module.exports = {
	id: 'org.stremio.thepiratebay-catalog',
	version: '1.0.5',
	name: 'ThePirateBay Catalog',
	description: 'Addon providing a catalog and search from The Pirate Bay.',
	isFree: true,
	resources: ['catalog', 'stream', 'meta'],
	logo:
		'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png',
	background:
		'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg',
	types: ['movie', 'series'],
	contactEmail: 'thanosdi@live.com',
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
					options: ['TV shows', 'HD - TV shows', 'Porn'],
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
			type: 'series',
			id: 'Porn',
			extra: [
				{
					name: 'search',
					isRequired: true
				}
			]
		}
	],
	idPrefixes: ['tt'],
	idProperty: ['imdb_id']
};
