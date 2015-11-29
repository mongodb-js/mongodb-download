var download = require('./');

download({
  version: '3.0.6',
//  arch: 'x64',
//  platform: 'darwin'
}, function (err, filePath) {
  if (err) throw err
  console.log('OK!:', filePath)
  process.exit(0)
});
