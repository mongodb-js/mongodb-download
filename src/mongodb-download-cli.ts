#!/usr/bin/env node
import {MongoDBDownload} from './mongodb-download';
import * as yargs from 'yargs';



let argv:any =	yargs
	.alias("dp", "display_progress")
	.boolean('display_progress')
	.default("display_progress", true)
	.argv;

let mongoDBDownload = new MongoDBDownload(argv);

mongoDBDownload.download().then((downloadLocation: string) => {
	console.log(`Downloaded MongoDB: ${downloadLocation}`);
	process.exit(0);
}).catch((err) => {
	console.warn(`Download failed: ${err}`);
	process.exit(1);
});