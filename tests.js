'use strict';

const expect = require('chai').expect;
const postcss = require('postcss');
const plugin = require('./index.js');
const parser = require('./parser/parse');
const stringify = require('./parser/stringify');
const Decl = require('./lib/Declaration');
const helpers = require('./lib/helpers');
const mixins = {
	spacedBlock(...args) {
		let props = this.spaced(...args);

		args.shift();
		return props.concat(this.block(...args));
	},
	block(...args) {
		let props = [
			new Decl('display', 'block')
		];

		props.push(new Decl('width', args[0]));

		if (args[1]) {
			props.push(new Decl('height', args[1]));
		}

		return props;
	},
	spaced(value) {
		if (helpers.isEmpty(value) || helpers.isObject(value)) {
			value = 2;
		}

		return this.margin({ bottom: value });
	},
	margin(...args) {
		let props = [];

		return props.concat(Decl.createManyFromObj(args[0], 'margin'));
	},
	font(...args) {
		var props = [];

		props.push(new Decl('font-family', args[0]));

		if (args[1]) {
			props.push(new Decl('font-size', args[1]));
		}

		if (args[2]) {
			props.push(new Decl('font-weight', args[2]));
		}

		if (args[3]) {
			props.push(new Decl('line-height', args[3]));
		}

		if (args[4]) {
			props.push(new Decl('font-style', args[4]));
		}

		return props;
	}
};

function process(input, expected, opts = {}, warnings = 0) {
	return postcss([ plugin(opts) ]).process(input, {
			parser: parser,
			stringifier: stringify
		})
		.then(result => {
			expect(result.css).to.equal(expected);
			expect(result.warnings().length).to.equal(warnings);
		});
}

describe('mixins', () => {
	it('should generate a single declaration', () => {
		return process(
			`.block {
				background(#fff);
			}`,
			`.block {
				background: #fff;
			}`,
			{
				mixins: {
					background(color) {
						return { prop: 'background', value: color }
					}
				}
			}
		);
	});

	it('should generate multiple declarations from one mixin', () => {
		return process(
			`.block {
				background(#fff, no-repeat, right, top);
			}`,
			`.block {
				background-color: #fff;
				background-repeat: no-repeat;
				background-position: right top;
			}`,
			{
				mixins: {
					background(color, repeat, x = '0%', y = '0%') {
						return [
							{ prop: 'background-color', value: color },
							{ prop: 'background-repeat', value: repeat },
							{ prop: 'background-position', value: x + ' ' + y }
						];
					}
				}
			}
		);
	});

	it('should convert numbers', () => {
		return process(
			`.block {
				opacity(.4);
			}`,
			`.block {
				opacity: 0.4;
			}`,
			{
				mixins: {
					opacity(value) {
						return new Decl('opacity', helpers.calcOpacity(value));
					}
				}
			}
		);
	});

	it('should parse unmatched variables as individual parameters', () => {
		return process(
			`.block {
				spacedBlock($margin, 10);
			}`,
			`.block {
				margin-bottom: $margin;
				display: block;
				width: 10rem;
			}`,
			{
				mixins: mixins
			}
		);
	});

	it('should throw a warning if mixin does not exist', () => {
		return process(
			`.block {
				customMixin(#fff);
			}`,
			`.block {
			}`,
			{},
			1
		);
	});
});

describe('default units', () => {
	after(() => {
		return process('', '', {
			mixins: {},
			units: {
				default: 'rem',
				lineHeight: 'em'
			}
		});
	});

	it('should fallback to rem and em (line-height only)', () => {
		return process(
			`.block {
				font('Open Sans' Arial sans-serif, 5, bold, 1.2);
			}`,
			`.block {
				font-family: 'Open Sans', Arial, sans-serif;
				font-size: 5rem;
				font-weight: bold;
				line-height: 1.2em;
			}`,
			{
				mixins: mixins
			}
		);
	});

	it('should be registered in options object', () => {
		return process(
			`.block {
				spacedBlock($margin, 10);
				font(Arial, 5, bold, 1.2);
			}`,
			`.block {
				margin-bottom: $margin;
				display: block;
				width: 10px;
				font-family: Arial;
				font-size: 5px;
				font-weight: bold;
				line-height: 1.2%;
			}`,
			{
				mixins: mixins,
				units: {
					default: 'px',
					lineHeight: '%'
				}
			}
		);
	});
});

describe('declarations', () => {
	it('should create many declaration instances by mapping two arrays together', () => {
		return process(
			`.block {
				margin(1, 2, 3, 4);
			}`,
			`.block {
				margin-top: 1rem;
				margin-right: 2rem;
				margin-left: 3rem;
				margin-bottom: 4rem;
			}`,
			{
				mixins: {
					margin(...args) {
						return Decl.createMany([
							'margin-top',
							'margin-right',
							'margin-left',
							'margin-bottom'
						], args);
					}
				}
			}
		);
	});

	it('should create many by reusing the same value', () => {
		return process(
			`.block {
				verticalPadding(2);
			}`,
			`.block {
				padding-top: 2rem;
				padding-bottom: 2rem;
			}`,
			{
				mixins: {
					verticalPadding(value) {
						return Decl.createMany([
							'padding-top',
							'padding-bottom'
						], helpers.unit(value));
					}
				}
			}
		);
	});

	it('should create many declaration instances from an object', () => {
		return process(
			`.block {
				margin(top: 1, bottom: 4, right: 2, left: 3);
			}`,
			`.block {
				margin-top: 1rem;
				margin-bottom: 4rem;
				margin-right: 2rem;
				margin-left: 3rem;
			}`,
			{
				mixins: {
					margin(obj) {
						return Decl.createManyFromObj(obj, 'margin');
					}
				}
			}
		);
	});
});

describe('helpers: calcOpacity', () => {
	it('should convert percentage argument into proper format', () => {
		return expect(helpers.calcOpacity('20%')).to.equal(0.2);
	});

	it('should convert numerical value over 1 into proper format', () => {
		return expect(helpers.calcOpacity(20)).to.equal(0.2);
	});

	it('should return the raw value if not percentage or greater than 1', () => {
		return expect(helpers.calcOpacity(0.2)).to.equal(0.2);
	});
});

describe('helpers: hexToRgba', () => {
	it('should convert a hex value to RGB', () => {
		return expect(helpers.hexToRgba('#f5830f')).to.equal('rgb(245, 131, 15)');
	});

	it('should convert a hex value with opacity into RGBA', () => {
		return expect(helpers.hexToRgba('#f5830f', 0.2)).to.equal('rgba(245, 131, 15, 0.2)');
	});

	it('should convert three character hex value into proper rgb', () => {
		return expect(helpers.hexToRgba('#fff')).to.equal('rgb(255, 255, 255)');
	});
});

describe('helpers: isColor', () => {
	it('should identify hex values as color', () => {
		expect(helpers.isColor('#fff')).to.equal(true);
		expect(helpers.isColor('#f7f7f7')).to.equal(true);
	});

	it('should identify rgb/rgba values as color', () => {
		expect(helpers.isColor('rgb(0, 0, 0)')).to.equal(true);
		expect(helpers.isColor('rgba(0, 0, 0, 0.5)')).to.equal(true);
	});

	it('should identify hsl/hsla values as color', () => {
		expect(helpers.isColor('hsl(0, 100%, 50%)')).to.equal(true);
		expect(helpers.isColor('hsla(0, 100%, 50%, 1)')).to.equal(true);
	});

	it('should identify non-color strings as false', () => {
		expect(helpers.isColor('something')).to.equal(false);
	});
});

describe('helpers: isEmpty', () => {
	it('should identify empty array as empty', () => {
		expect(helpers.isEmpty([])).to.equal(true);
	});

	it('should identify undefined as empty', () => {
		expect(helpers.isEmpty()).to.equal(true);
	});
});

describe('helpers: isNumber', () => {
	it('should identify string numbers and numbers as a number', () => {
		expect(helpers.isNumber('2')).to.equal(true);
		expect(helpers.isNumber(2)).to.equal(true);
		expect(helpers.isNumber(2.1)).to.equal(true);
	});

	it('should not identify any other types', () => {
		expect(helpers.isNumber('string')).to.equal(false);
		expect(helpers.isNumber(undefined)).to.equal(false);
		expect(helpers.isNumber(null)).to.equal(false);
		expect(helpers.isNumber([])).to.equal(false);
		expect(helpers.isNumber({})).to.equal(false);
	});
});