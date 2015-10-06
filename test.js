var download = require('./');

download({
  version: '3.0.6',
  arch: 'x86_64',
  platform: 'osx'
}, function (err, filePath) {
  if (err) throw err
  console.log('OK!:', filePath)
  process.exit(0)
});