const {
	pipe,
	map,
	propEq,
	find,
	prop,
	filter,
	T,
	cond,
	hasPath,
	has,
	tap,
	isEmpty,
	pathOr
} = require('ramda');
const byteSize = require('byte-size');

const torrentStream = require('torrent-stream');
const PirateBay = require('thepiratebay');
const parseVideo = require('video-name-parser');
const pify = require('pify');
const nameToImdb = require('name-to-imdb');

const pPipe = require('p-pipe');
const pMap = require('p-map');
const {encode} = require('base-64');

const {searchCategory, search} = require('./search-tpb');
const categories = require('./categories');
const METAHUB_URL = 'https://images.metahub.space';

const getCategoryId = pipe(
	(categories, category) => find(propEq('name', category), categories),
	prop('id')
);

const cleanString = input => {
	let output = '';
	for (let i = 0; i < input.length; i++) {
		if (input.charCodeAt(i) <= 127) {
			output += input.charAt(i);
		}
	}

	return output;
};

const generateMetaPreview = ({
	imdbId,
	type,
	parsedName,
	size,
	seeders,
	leechers,
	magnetLink,
	uploadDate,
	uploader
}) => {
	const isValidImdbId = imdbId.startsWith('tt');
	const id = isValidImdbId ? imdbId : `tt1234567890`;
	const poster = isValidImdbId
		? `${METAHUB_URL}/poster/large/${imdbId}/img`
		: '';
	const {value, unit} = byteSize(size);
	const parameters = {
		magnetLink,
		parsedName: parsedName.trim(),
		size,
		seeders,
		leechers,
		poster,
		isValidImdbId
	};
	return {
		id: `${id}:${encode(JSON.stringify(parameters))}`,
		type,
		name: parsedName,
		poster,
		description: `
		Size: ${value} ${unit}

		Seeders: ${seeders}

		Leechers: ${leechers}

		Uploader: ${uploader}
		`
	};
};

const fetchTorrents = ({categoryId, args}) =>
	pPipe(
		cond([
			[
				({args}) => hasPath(['extra', 'search'], args),
				({args}) =>
					search(
						args.extra.search,
						cond([
							[propEq('id', 'Movies'), () => 202],
							[propEq('id', 'Porn'), () => 500],
							[propEq('id', 'TV shows'), () => 205]
						])(args)
					)
			],
			[T, ({categoryId}) => searchCategory(categoryId)]
		]),
		filter(item => item.name),
		torrents =>
			pMap(torrents, async item => {
				const name = cleanString(item.name);
				const parsedName = parseVideo(name);
				const imdbId = item.imdb;
				// const imdbId = (isEmpty(item.imdb) && parsedName.name) ?
				//     (await pify(nameToImdb)(parsedName.name)) || item.name :
				//     item.imdb;
				return {
					...item,
					parsedName: `${name} ${
						has('season', parsedName) ? `Season ${parsedName.season}` : ''
					} ${
						has('episode', parsedName)
							? `Episodes ${parsedName.episode.join(', ')}`
							: ''
					}`,
					imdbId,
					type: args.type,
					isSearch: hasPath(['extra', 'search'], args)
				};
			}),
		map(generateMetaPreview)
	)({categoryId, args});

const catalogHandler = async args => {
	const hasSkip = pathOr(false, ['extra', 'skip'], args);
	if (hasSkip) {
		return Promise.resolve({metas: []});
	}

	const topCategory = args.id === 'tpbctlg-movies' ? 'Movies' : 'TV shows';
	const categoryId = getCategoryId(categories, args.extra.genre || topCategory);
	const metas = await fetchTorrents({categoryId, args});
	return Promise.resolve({metas});
};

module.exports = catalogHandler;
