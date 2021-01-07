const {addonBuilder} = require('stremio-addon-sdk');

const manifest = require('./manifest');
const metaHandler = require('./meta-handler');
const catalogHandler = require('./catalog-handler');
const streamHandler = require('./stream-handler');

const builder = new addonBuilder(manifest);

builder.defineMetaHandler(metaHandler);
builder.defineCatalogHandler(catalogHandler);
builder.defineStreamHandler(streamHandler);

module.exports = builder.getInterface();
