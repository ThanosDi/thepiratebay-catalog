module.exports = {
	id: 'org.stremio.thepiratebay-catalog',
	version: '1.0.0',

	name: 'ThePirateBay Catalog',
	description: 'Addon providing a catalog from The Pirate Bay',
	isFree: true,
	resources: ['catalog', 'stream', 'meta'],

	types: ['movie', 'series'],

	catalogs: [
		{
			type: 'movie',
			id: 'tpbctlg-movies',
			extra: [
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
			type: 'movie',
			id: 'Movies',
			extra: [
				{
					name: 'search',
					isRequired: true
				}
			]
		},
		{
			type: 'series',
			id: 'TV shows',
			extra: [
				{
					name: 'search',
					isRequired: true
				}
			]
		},
		{
			type: 'movie',
			id: 'Porn',
			extra: [
				{
					name: 'search',
					isRequired: true
				}
			]
		}
	],

	idPrefixes: ['tt', 'tpbclg:']
};
