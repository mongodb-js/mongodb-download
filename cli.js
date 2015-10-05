#!/usr/bin/env node
var download = require('./')
var argv = require('yargs')
	.alias("dp", "display_progress")
	.boolean('display_progress')
	.default("display_progress", true)
	.argv;

download(argv, function (err, downloadPath) {
  if (err) throw err
  console.log('Downloaded MongoDB:', downloadPath);
  process.exit(0)
})