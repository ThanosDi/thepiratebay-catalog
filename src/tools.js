const {pipe, prop, split, last, head} = require('ramda');
const {decode} = require('base-64');

const parseId = pipe(prop('id'), split(':'), last, decode, JSON.parse);

const getId = pipe(prop('id'), split(':'), head);

module.exports = {
	parseId,
	getId,
};
