const tinyColor = require('tinycolor2');

/**
 * Calculate darker shade of color
 *
 * @param {string} color - hex value
 * @param {number} percent
 * @returns {string}
 */
function darken(color, percent) {
	return tinyColor(color).darken(percent).toString();
}

/**
 * Calculate lighter shade of provided color
 *
 * @param {string} color - hex value
 * @param {number} percent
 * @returns {string}
 */
function lighten(color, percent) {
	return tinyColor(color).lighten(percent).toString();
}

module.exports = {
	darken: darken,
	lighten: lighten
};