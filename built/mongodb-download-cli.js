#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_download_1 = require("./mongodb-download");
var yargs = require("yargs");
var argv = yargs
    .alias("dp", "display_progress")
    .boolean('display_progress')
    .default("display_progress", true)
    .argv;
var mongoDBDownload = new mongodb_download_1.MongoDBDownload(argv);
mongoDBDownload.download().then(function (downloadLocation) {
    console.log("Downloaded MongoDB: " + downloadLocation);
    process.exit(0);
}).catch(function (err) {
    console.warn("Download failed: " + err);
    process.exit(1);
});
//# sourceMappingURL=mongodb-download-cli.js.map