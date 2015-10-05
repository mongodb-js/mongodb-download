# mongodb-download

[![NPM](https://nodei.co/npm/mongodb-download.png)](https://nodei.co/npm/mongodb-download/)

downloads a MongoDB release zip/tgz from MongoDB

### usage

```plain
$ npm install --global mongodb-download
$ mongodb-download --version=3.0.6
```

```
var download = require('mongodb-download')

download({
  version: '3.0.6',
  arch: 'ia32',
  platform: 'win32',
  download_dir: './temp_download' // defaults to os.tmpdir()
}, function (err, location) {
  // location will be the path of the archive that it downloaded.
})
```

if you don't specify `arch` or `platform` args it will use `require('os')` to get them from the current OS. specifying `version` is mandatory.