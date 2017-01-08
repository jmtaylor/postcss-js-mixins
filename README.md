# PostCSS JS Mixins

[![Build Status](https://travis-ci.org/nathanhood/postcss-js-mixins.svgbranch=master)](https://travis-ci.org/nathanhood/postcss-js-mixins)
[![codecov](https://codecov.io/gh/nathanhood/postcss-js-mixins/branch/master/graph/badge.svg)](https://codecov.io/gh/nathanhood/postcss-js-mixins)

<img align="right" width="135" height="95" src="http://postcss.github.io/postcss/logo-leftp.png" title="Philosopher’s stone, logo of PostCSS">

[PostCSS] plugin for custom mixin syntax

[PostCSS]: (https://github.com/postcss/postcss)

```css
/* before */
.block {
	column(spaced, 1, 2);
}

/* after */
.block {
	float: left;
	width: 50%;
	margin-left: 5%;
}

/* before */
.block {
	spacedBlock(width: 10px);
}

/* after */
.block {
	margin-bottom: 2rem;
	width: 10px;
	display: block;
}
```

## Usage

```js
postcss([ require('postcss-js-mixins')({ /* options */ }) ]).process(input, {
			parser: require('postcss-js-mixins/parser/parse'),
			stringifier: require('postcss-js-mixins/parser/stringify')
		})
		.then(result => {
			// Do something with result
		});
```

See [PostCSS] docs for examples for your environment.

## Options

### `mixins`

Type: `Object`  
Default: `{}`

Register mixins that you want to reference in your style sheets. 

```js
const Decl = require('postcss-js-mixins/lib/Declaration');
const { isEmpty } = require('postcss-js-mixins/lib/helpers');

require('postcss-js-mixins')({
	mixins: {
		/**
		* Example of creating a shorthand with default value
		*/
		spaced(value) {
			if (isEmpty(value)) {
				value = '20px';
			}

			return new Decl('margin-bottom', value);
		}
	}
});
```

### `defaults`

## Writing Mixins

Mixins are written solely in JavaScript. They can return a declaration, a rule, or an array of declarations/rules. 

### Declaration

Declarations take a CSS property and it's value as arguments.


```js
const Decl = require('postcss-js-mixins/lib/Declaration');

// Create single declaration
new Decl(prop, value);
```

#### Methods

#### `createMany`
Matches indexes from two arrays to produce declarations for each. This is used when order matters for your mixin arguments.

```js
// Create multiple declarations
function position(...args) {
	return Decl.createMany(['top', 'right', 'left', 'bottom'], args);
}
```
```css
position(10%, 0, false, 0);
```

#### `createManyFrom`
When passing arguments as `object: key` pairs, the first argument in the executed mixin will be an object with all arguments aggregated together. This allows for the user to pass in arguments in arbitrary order. This function can also take a prefix as the second argument that will be prepended to all declaration properties.
```js
// Create multiple declarations from an object
function background(obj) {
	return Decl.createManyFromObj(obj, 'background');
}
```
```css
position(color: #f7f7f7);
```

### `helper methods`
Helper methods have been provided in order to make writing mixin functions.

```js
const helpers = require('postcss-js-mixins/lib/helpers');
const { darken, lighten } = require('postcss-js-mixins/lib/colorHelpers');
```