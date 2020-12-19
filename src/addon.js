const {addonBuilder} = require('stremio-addon-sdk');
const PirateBay = require('thepiratebay');
const Opensubtitles = require('opensubtitles-js');
const isVideo = require('is-video');
const nameToImdb = require('name-to-imdb');
const pify = require('pify');
const parseVideo = require('video-name-parser');
const parseTorrent = require('parse-torrent');
const {encode, decode} = require('base-64');
const {
	pipe,
	map,
	propEq,
	find,
	prop,
	split,
	last,
	ifElse,
	head,
	length,
	filter,
	T,
	F,
	cond,
	pathEq
} = require('ramda');
const pPipe = require('p-pipe');
const pMap = require('p-map');
const Magnet2torrent = require('magnet2torrent-js');
const episodeParser = require('episode-parser');

const subs = new Opensubtitles({
	language: 'en',
	userAgent: 'TemporaryUserAgent'
});
const m2t = new Magnet2torrent({timeout: 120});

const categories = require('./categories');
const hasPath = require('ramda/src/hasPath');

const METAHUB_URL = 'https://images.metahub.space';

const manifest = {
	id: 'org.stremio.thepiratebay-catalog',
	version: '1.0.0',

	name: 'ThePirateBay Catalog',
	description: 'Addon providing a catalog from The Pirate Bay',
	isFree: true,
	// Set what type of resources we will return
	resources: ['catalog', 'stream', 'meta'],

	types: ['movie', 'series', 'custom'],

	catalogs: [
		{
			type: 'movie',
			id: 'tpbctlg-movies',
			extra: [
				{
					name: 'search',
					isRequired: false
				},
				{
					name: 'genre',
					options: [
						'Movies',
						'Movies DVDR',
						'Music videos',
						'Movie clips',
						'HD - Movies',
						'3D',
						'Porn'
					],
					isRequired: false
				}
			]
		},
		{
			type: 'series',
			id: 'tpbctlg-series',
			extra: [
				{
					name: 'genre',
					options: ['TV shows', 'HD - TV shows'],
					isRequired: false
				}
			]
		},
		{
			type: 'custom',
			id: 'Porn',
			extra: [
				{
					name: 'search',
					isRequired: false
				}
			]
		}
	],

	idPrefixes: ['tt', 'tpbclg:']
};
const parseId = pipe(prop('id'), split(':'), last, decode, JSON.parse);

const getId = pipe(prop('id'), split(':'), head);
const getSeasonEpisode = pipe(
	prop('id'),
	split(':'),
	ifElse(
		array => length(array) > 2,
		array => ({
			id: array[0],
			season: array[1],
			episode: array[2]
		}),
		array => ({
			id: array[0],
			season: false,
			episode: false
		})
	)
);

const fetchTorrents = ({categoryId, args}) =>
	pPipe(
		cond([
			[
				({args}) => hasPath(['extra', 'search'], args),
				({args}) =>
					PirateBay.search(args.extra.search, {
						category: args.id === 'tpbctlg-movies' ? 'video' : 'xxx',
						orderBy: 'seeds',
						sortBy: 'desc'
					})
			],
			[T, ({categoryId}) => PirateBay.search(`top100:${categoryId}`)]
		]),
		filter(item => parseVideo(item.name).name),
		torrents =>
			pMap(torrents, async item => {
				console.log(item.name);
				const parsedName = parseVideo(item.name).name;
				const imdbId = (await pify(nameToImdb)(parsedName)) || item.name;
				return {
					...item,
					parsedName,
					imdbId,
					type: args.type,
					isSearch: hasPath(['extra', 'search'], args)
				};
			}),
		map(generateMetaPreview)
	)({categoryId, args});

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
	magnetLink
}) => {
	console.log(magnetLink);
	const isImdb = imdbId.startsWith('tt');
	const id = isImdb ? imdbId : `tt1234567890`;
	console.log(id);
	const poster = isImdb
		? `${METAHUB_URL}/poster/large/${imdbId}/img`
		: 'https://www.redwolf.in/image/cache/catalog/posters/pirate-bay-sharing-is-caring-poster-india-700x700.jpg';
	return {
		id: `${id}:${encode(
			JSON.stringify({
				magnetLink,
				parsedName,
				size,
				seeders,
				leechers,
				poster,
				index: 0
			})
		)}`,
		type,
		name: parsedName,
		poster,
		description: `
		Size: ${size}
		Seeders: ${seeders}
		Leechers: ${leechers}
		`
	};
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async args => {
	console.log('defineCatalogHandler', args);

	const topCategory = args.id === 'tpbctlg-movies' ? 'Movies' : 'TV shows';
	const categoryId = getCategoryId(categories, args.extra.genre || topCategory);
	const metas = await fetchTorrents({categoryId, args});
	return Promise.resolve({metas});
});

builder.defineMetaHandler(async args => {
	console.log('defineMetaHandler', args);
	const {magnetLink, seeders, parsedName, size, poster} = parseId(args);

	const torrent = await m2t.getTorrent(magnetLink);
	const videos = ifElse(
		propEq('type', 'series'),
		() => {
			return torrent.files
				.map((file, index) => ({
					...file,
					index
				}))
				.filter(file => isVideo(file.name))
				.filter(file => {
					const parsed = episodeParser(file.name);
					return args.type === 'series' && parsed;
				})
				.map(file => {
					const {season, episode} = episodeParser(file.name);

					return {
						name: file.name,
						season,
						number: episode,
						firstAired: '2002-01-31T22:00:00.000Z',
						id: `${getId(args)}:${season}:${episode}:${encode(
							JSON.stringify({
								magnetLink,
								parsedName,
								size,
								seeders,
								index: file.index
							})
						)}`,
						episode
					};
				});
		},
		() => []
	)(args);

	const metaObject = {
		id: args.id,
		name: parsedName,
		background: poster.replace('/poster/', '/background/'),
		logo: poster.replace('/poster/', '/logo/'),
		posterShape: 'regular',
		type: args.type === 'custom' ? 'movie' : args.type,
		videos
	};
	return Promise.resolve({meta: metaObject});
});

// Streams handler
builder.defineStreamHandler(async args => {
	console.log('defineStreamHandler', args);
	try {
		const {magnetLink, seeders, parsedName, size, index} = parseId(args);
		const {infoHash} = parseTorrent(magnetLink);
		const stream = {
			name: 'TPB-CTL',
			title: `${parsedName}
Seeders: ${seeders}
Size: ${size}
	`,
			type: args.type === 'custom' ? 'movie' : args.type,
			infoHash,
			fileIdx: index
		};

		return Promise.resolve({streams: [stream]});
	} catch (error) {
		console.log({error});
		return Promise.resolve([]);
	}
});

module.exports = builder.getInterface();
