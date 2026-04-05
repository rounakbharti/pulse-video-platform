'use strict';

const LocalStorageProvider = require('./LocalStorageProvider');

// For the MVP, we instantiate the local provider.
// If S3 or GCP were added, we would check process.env.STORAGE_TYPE here
// and return the appropriate provider class.
const storageLayer = new LocalStorageProvider();

module.exports = storageLayer;
