#!/usr/bin/env node
var MongoDBDownload = require('./mongodb-download').MongoDBDownload;
var argv = require('yargs')
    .alias("dp", "display_progress")
    .boolean('display_progress')
    .default("display_progress", true)
    .argv;
var mongoDBDownload = new MongoDBDownload(argv);
mongoDBDownload.download().then(function (downloadLocation) {
    console.log("Downloaded MongoDB: " + downloadLocation);
    process.exit(0);
}, function (err) {
    throw err;
});
//# sourceMappingURL=mongodb-download-cli.js.map