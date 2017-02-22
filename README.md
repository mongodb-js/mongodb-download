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
let {MongoDBDownload} = require('mongodb-download');

let mongoDBDownload: any = new MongoDBDownload({});

mongoDBDownload.download().then((downloadLocation: string) => {
  console.log(`Downloaded MongoDB: ${downloadLocation}`);
}, (err: any) => {
  throw err;
});
```

if you don't specify `arch` or `platform` args it will use `require('os')` to get them from the current OS.

## Options

### version (optional)
MongoDB version to download, "latest" is by default

### arch (optional)
32 or 64 bit version architecture, possible values: ia32 or x64

### platform (optional)
Target platform of a download, possible values: "win32", "darwin", "osx", "linux" or "elementary OS"  

### downloadDir (optional) 
Download path

### http (optional)
Additional options that are going to be passed to http library, such as "agent".

```javascript
let {MongoDBDownload} = require('mongodb-download');
let httpsProxyAgent = require('https-proxy-agent');

var proxyUrl = "https://localhost:3128";
var proxyAgent = new httpsProxyAgent(proxy_url);

let mongoDBDownload: any = new MongoDBDownload({
  version: '3.0.6',
  http: {
    agent: proxyAgent
  }
});


```
