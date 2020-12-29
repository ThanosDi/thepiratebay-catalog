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
	has
} = require('ramda');
const PirateBay = require('thepiratebay');
const parseVideo = require('video-name-parser');
const pify = require('pify');
const nameToImdb = require('name-to-imdb');

const pPipe = require('p-pipe');
const pMap = require('p-map');
const {encode} = require('base-64');

const categories = require('./categories');
const METAHUB_URL = 'https://images.metahub.space';

const getCategoryId = pipe(
	(categories, category) => find(propEq('name', category), categories),
	prop('id')
);

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
	const poster = `${METAHUB_URL}/poster/large/${imdbId}/img`;
	return {
		id: `${id}:${encode(
			JSON.stringify({
				magnetLink,
				parsedName,
				size,
				seeders,
				leechers,
				poster,
				isValidImdbId
			})
		)}`,
		type,
		name: parsedName,
		poster,
		description: `
		Size: ${size}

		Seeders: ${seeders}

		Leechers: ${leechers}

		Upload Date: ${uploadDate}

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
					PirateBay.search(args.extra.search, {
						category: cond([
							[propEq('id', 'Movies'), () => 202],
							[propEq('id', 'Porn'), () => 500],
							[propEq('id', 'TV shows'), () => 205]
						])(args),
						orderBy: 'seeds',
						sortBy: 'desc'
					})
			],
			[T, ({categoryId}) => PirateBay.search(`top100:${categoryId}`)]
		]),
		filter(item => parseVideo(item.name).name),
		torrents =>
			pMap(torrents, async item => {
				const parsedName = parseVideo(item.name);
				const imdbId = (await pify(nameToImdb)(parsedName.name)) || item.name;
				return {
					...item,
					parsedName: `${parsedName.name} ${
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
	const topCategory = args.id === 'tpbctlg-movies' ? 'Movies' : 'TV shows';
	console.log({topCategory});
	const categoryId = getCategoryId(categories, args.extra.genre || topCategory);
	const metas = await fetchTorrents({categoryId, args});
	console.log(metas[0]);
	return Promise.resolve({metas});
};

module.exports = catalogHandler;
