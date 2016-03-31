# mongodb-download

[![NPM](https://nodei.co/npm/mongodb-download.png)](https://nodei.co/npm/mongodb-download/)

downloads a MongoDB release zip/tgz from MongoDB

## Usage

```plain
$ npm install --global mongodb-download
$ mongodb-download --version=3.0.6
```

## Synopsis

```javascript
var download = require('mongodb-download')

download({
  version: '3.0.6', 
  arch: 'ia32',
  platform: 'win32',
  download_dir: './temp_download', // defaults to os.tmpdir()
  http_opts: {} // extra options that one would want to pass to http request
}, function (err, location) {
  // location will be the path of the archive that it downloaded.
})
```

if you don't specify `arch` or `platform` args it will use `require('os')` to get them from the current OS. specifying `version` is mandatory.

## Options

### version (required)
MongoDB version to download

### arch (optional)
32 or 64 bit version architecture, possible values: ia32 or x64

### platform (optional)
Target platform of a download, possible values: "win32", "darwin", "osx", "linux" or "elementary OS"  

### download_dir (optional) 
Download path

### http_opts (optional)
Additional options that are going to be passed to http library, such as "agent".

```javascript
var download = require('mongodb-download');
var https_proxy_agent = require('https-proxy-agent');

var proxy_url = "https://localhost:3128";
var proxy_agent = new https_proxy_agent(proxy_url);

download({
  version: '3.0.6', 
  http_opts: {
  	agent: proxy_agent
  } 
}, function (err, location) {
  // location will be the path of the archive that it downloaded.
})

```
