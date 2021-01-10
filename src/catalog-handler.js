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
	isEmpty,
	pathOr,
	ifElse
} = require('ramda');
const byteSize = require('byte-size');
const parseVideo = require('video-name-parser');

const pPipe = require('p-pipe');
const pMap = require('p-map');
const {encode} = require('base-64');

const {searchCategory, search, searchTop100recent} = require('./search-tpb');
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
	uploader,
	extra,
	infoHash
}) => {
	const isValidImdbId = imdbId === 'tt1234567890';
	const id = imdbId;
	const poster = `${METAHUB_URL}/poster/large/${imdbId}/img`;
	const {value, unit} = byteSize(size);
	const parameters = {
		magnetLink,
		parsedName: parsedName.trim(),
		size,
		seeders,
		leechers,
		poster,
		isValidImdbId,
		extra,
		infoHash
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
			[({categoryId}) => categoryId === '100', () => searchTop100recent()],
			[
				({args}) => hasPath(['extra', 'search'], args),
				({args}) =>
					search(
						args.extra.search,
						cond([
							[propEq('id', 'Movies'), () => 201],
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
					isSearch: hasPath(['extra', 'search'], args),
					extra: args
				};
			}),
		map(generateMetaPreview)
	)({categoryId, args});

const catalogHandler = async args => {
	const hasSkip = pathOr(false, ['extra', 'skip'], args);
	if (hasSkip) {
		return Promise.resolve({metas: [], cacheMaxAge: 1});
	}

	const topCategory =
		args.id === 'tpbctlg-movies' ? 'top-100-movies' : 'TV shows';
	const categoryId = getCategoryId(categories, args.extra.genre || topCategory);
	const metas = await fetchTorrents({categoryId, args});

	const cacheProperties = ifElse(
		isEmpty,
		() => ({
			staleRevalidate: 120
		}),
		() => ({
			cacheMaxAge:
				process.env.ENVIRONMENT === 'development'
					? process.env.CACHE_TIMEOUT
					: 1 // 3600
		})
	)(metas);

	return Promise.resolve({metas, ...cacheProperties});
};

module.exports = catalogHandler;
