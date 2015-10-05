#!/usr/bin/env node
var download = require('./')
var argv = require('yargs').argv;

download(argv, function (err, downloadPath) {
  if (err) throw err
  console.log('Downloaded MongoDB:', downloadPath);
  process.exit(0)
})