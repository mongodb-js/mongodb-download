#!/usr/bin/env node
let {MongoDBDownload} = require('./mongodb-download');

let argv: any = require('yargs')
	.alias("dp", "display_progress")
	.boolean('display_progress')
	.default("display_progress", true)
	.argv;

let mongoDBDownload: any = new MongoDBDownload(argv);

mongoDBDownload.download().then((downloadLocation: string) => {
	console.log(`Downloaded MongoDB: ${downloadLocation}`);
	process.exit(0);
}, (err: any) => {
	throw err;
});