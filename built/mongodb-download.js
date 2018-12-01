"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require('os');
var http = require('https');
var fs = require('fs-extra');
var path = require('path');
var Debug = require('debug');
var getos = require('getos');
var url = require('url');
var semver = require('semver');
var decompress = require('decompress');
var request = require('request-promise');
var md5File = require('md5-file');
var DOWNLOAD_URI = "https://fastdl.mongodb.org";
var MONGODB_VERSION = "latest";
var MongoDBDownload = /** @class */ (function () {
    function MongoDBDownload(_a) {
        var _b = _a.platform, platform = _b === void 0 ? os.platform() : _b, _c = _a.arch, arch = _c === void 0 ? os.arch() : _c, _d = _a.downloadDir, downloadDir = _d === void 0 ? os.tmpdir() : _d, _e = _a.version, version = _e === void 0 ? MONGODB_VERSION : _e, _f = _a.http, http = _f === void 0 ? {} : _f;
        this.options = {
            "platform": platform,
            "arch": arch,
            "downloadDir": downloadDir,
            "version": version,
            "http": http
        };
        this.debug = Debug('mongodb-download-MongoDBDownload');
        this.mongoDBPlatform = new MongoDBPlatform(this.getPlatform(), this.getArch());
        this.options.downloadDir = path.resolve(this.options.downloadDir, 'mongodb-download');
        this.downloadProgress = {
            current: 0,
            length: 0,
            total: 0,
            lastStdout: ""
        };
    }
    MongoDBDownload.prototype.getPlatform = function () {
        return this.options.platform;
    };
    MongoDBDownload.prototype.getArch = function () {
        return this.options.arch;
    };
    MongoDBDownload.prototype.getVersion = function () {
        return this.options.version;
    };
    MongoDBDownload.prototype.getDownloadDir = function () {
        return this.options.downloadDir;
    };
    MongoDBDownload.prototype.getDownloadLocation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getArchiveName().then(function (archiveName) {
                var downloadDir = _this.getDownloadDir();
                var fullPath = path.resolve(downloadDir, archiveName);
                _this.debug("getDownloadLocation(): " + fullPath);
                resolve(fullPath);
            });
        });
    };
    MongoDBDownload.prototype.getExtractLocation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getMD5Hash().then(function (hash) {
                if (!hash) {
                    console.error("hash is not returned @ getExtractLocation()");
                    return reject();
                }
                var downloadDir = _this.getDownloadDir();
                var extractLocation = path.resolve(downloadDir, hash);
                _this.debug("getExtractLocation(): " + extractLocation);
                resolve(extractLocation);
            }, function (e) {
                console.error('hash is not returned @ getExtractLocation()', e);
                reject();
            });
        });
    };
    MongoDBDownload.prototype.getTempDownloadLocation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getArchiveName().then(function (archiveName) {
                var downloadDir = _this.getDownloadDir();
                var fullPath = path.resolve(downloadDir, archiveName + ".downloading");
                _this.debug("getTempDownloadLocation(): " + fullPath);
                resolve(fullPath);
            });
        });
    };
    MongoDBDownload.prototype.downloadAndExtract = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.download().then(function (archive) {
                _this.extract().then(function (extractLocation) {
                    resolve(extractLocation);
                });
            });
        });
    };
    MongoDBDownload.prototype.extract = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getExtractLocation().then(function (extractLocation) {
                _this.isExtractPresent().then(function (extractPresent) {
                    if (extractPresent === true) {
                        resolve(extractLocation);
                    }
                    else {
                        _this.getDownloadLocation().then(function (mongoDBArchive) {
                            decompress(mongoDBArchive, extractLocation).then(function (files) {
                                _this.debug("extract(): " + extractLocation);
                                resolve(extractLocation);
                            }, function (e) {
                                _this.debug('extract() failed', extractLocation, e);
                            });
                        });
                    }
                });
            });
        });
    };
    MongoDBDownload.prototype.download = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var httpOptionsPromise = _this.getHttpOptions();
            var downloadLocationPromise = _this.getDownloadLocation();
            var tempDownloadLocationPromise = _this.getTempDownloadLocation();
            var createDownloadDirPromise = _this.createDownloadDir();
            Promise.all([
                httpOptionsPromise,
                downloadLocationPromise,
                tempDownloadLocationPromise,
                createDownloadDirPromise
            ]).then(function (values) {
                var httpOptions = values[0];
                var downloadLocation = values[1];
                var tempDownloadLocation = values[2];
                var downloadDirRes = values[3];
                _this.isDownloadPresent().then(function (isDownloadPresent) {
                    if (isDownloadPresent === true) {
                        _this.debug("download(): " + downloadLocation);
                        resolve(downloadLocation);
                    }
                    else {
                        _this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation).then(function (location) {
                            _this.debug("download(): " + downloadLocation);
                            resolve(location);
                        }, function (e) {
                            reject(e);
                        });
                    }
                });
            });
        });
    };
    // TODO: needs refactoring
    MongoDBDownload.prototype.isDownloadPresent = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadLocation().then(function (downloadLocation) {
                if (_this.locationExists(downloadLocation) === true) {
                    _this.getMD5Hash().then(function (downloadHash) {
                        md5File(downloadLocation, function (err, hash) {
                            if (err) {
                                throw err;
                            }
                            if (hash === downloadHash) {
                                _this.debug("isDownloadPresent() md5 match: true");
                                resolve(true);
                            }
                            else {
                                _this.debug("isDownloadPresent() md5 mismatch: false");
                                resolve(false);
                            }
                        });
                    });
                }
                else {
                    _this.debug("isDownloadPresent() location missing: false");
                    resolve(false);
                }
            });
        });
    };
    MongoDBDownload.prototype.isExtractPresent = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getMD5Hash().then(function (downloadHash) {
                var downloadDir = _this.getDownloadDir();
                _this.getExtractLocation().then(function (extractLocation) {
                    var present = _this.locationExists(extractLocation);
                    _this.debug("isExtractPresent(): " + present);
                    resolve(present);
                });
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashFileLocation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadLocation().then(function (downloadLocation) {
                var md5HashLocation = downloadLocation + ".md5";
                _this.debug("@getMD5HashFileLocation resolving md5HashLocation: " + md5HashLocation);
                resolve(md5HashLocation);
            }, function (e) {
                console.error("error @ getMD5HashFileLocation", e);
                reject(e);
            });
        });
    };
    MongoDBDownload.prototype.cacheMD5Hash = function (signature) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getMD5HashFileLocation().then(function (hashFile) {
                fs.outputFile(hashFile, signature, function (err) {
                    if (err) {
                        _this.debug('@cacheMD5Hash unable to save signature', signature);
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    };
    MongoDBDownload.prototype.getMD5Hash = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getMD5HashOffline().then(function (offlineSignature) {
                _this.debug("@getMD5Hash resolving offlineSignature " + offlineSignature);
                resolve(offlineSignature);
            }, function (e) {
                _this.getMD5HashOnline().then(function (onlineSignature) {
                    _this.debug("@getMD5Hash resolving onlineSignature: " + onlineSignature);
                    resolve(onlineSignature);
                }, function (e) {
                    console.error('unable to get signature content', e);
                    reject(e);
                });
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashOnline = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadURIMD5().then(function (md5URL) {
                request(md5URL).then(function (signatureContent) {
                    _this.debug("getDownloadMD5Hash content: " + signatureContent);
                    var signatureMatch = signatureContent.match(/([^\s]*)(\s*|$)/);
                    var signature = signatureMatch[1];
                    _this.debug("getDownloadMD5Hash extracted signature: " + signature);
                    _this.cacheMD5Hash(signature).then(function () {
                        resolve(signature);
                    }, function (e) {
                        _this.debug('@getMD5HashOnline erorr', e);
                        reject();
                    });
                }, function (e) {
                    console.error('unable to get signature content', e);
                    reject(e);
                });
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashOffline = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getMD5HashFileLocation().then(function (hashFile) {
                fs.readFile(hashFile, 'utf8', function (err, signature) {
                    if (err) {
                        _this.debug('error @ getMD5HashOffline, unable to read hash content', hashFile);
                        reject();
                    }
                    else {
                        resolve(signature);
                    }
                });
            });
        });
    };
    MongoDBDownload.prototype.httpDownload = function (httpOptions, downloadLocation, tempDownloadLocation) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fileStream = fs.createWriteStream(tempDownloadLocation);
            var request = http.get(httpOptions, function (response) {
                _this.downloadProgress.current = 0;
                _this.downloadProgress.length = parseInt(response.headers['content-length'], 10);
                _this.downloadProgress.total = Math.round(_this.downloadProgress.length / 1048576 * 10) / 10;
                response.pipe(fileStream);
                fileStream.on('finish', function () {
                    fileStream.close(function () {
                        fs.renameSync(tempDownloadLocation, downloadLocation);
                        _this.debug("renamed " + tempDownloadLocation + " to " + downloadLocation);
                        resolve(downloadLocation);
                    });
                });
                response.on("data", function (chunk) {
                    _this.printDownloadProgress(chunk);
                });
                request.on("error", function (e) {
                    _this.debug("request error:", e);
                    reject(e);
                });
            });
        });
    };
    MongoDBDownload.prototype.getCrReturn = function () {
        if (this.mongoDBPlatform.getPlatform() === "win32") {
            return "\x1b[0G";
        }
        else {
            return "\r";
        }
    };
    MongoDBDownload.prototype.locationExists = function (location) {
        var exists;
        try {
            var stats = fs.lstatSync(location);
            this.debug("sending file from cache", location);
            exists = true;
        }
        catch (e) {
            if (e.code !== "ENOENT")
                throw e;
            exists = false;
        }
        return exists;
    };
    MongoDBDownload.prototype.printDownloadProgress = function (chunk) {
        var crReturn = this.getCrReturn();
        this.downloadProgress.current += chunk.length;
        var percent_complete = Math.round(100.0 * this.downloadProgress.current / this.downloadProgress.length * 10) / 10;
        var mb_complete = Math.round(this.downloadProgress.current / 1048576 * 10) / 10;
        var text_to_print = "Completed: " + percent_complete + " % (" + mb_complete + "mb / " + this.downloadProgress.total + "mb" + crReturn;
        if (this.downloadProgress.lastStdout !== text_to_print) {
            this.downloadProgress.lastStdout = text_to_print;
            process.stdout.write(text_to_print);
        }
    };
    MongoDBDownload.prototype.getHttpOptions = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadURI().then(function (downloadURI) {
                _this.options.http.protocol = downloadURI.protocol;
                _this.options.http.hostname = downloadURI.hostname;
                _this.options.http.path = downloadURI.path;
                _this.debug("getHttpOptions", _this.options.http);
                resolve(_this.options.http);
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURI = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var downloadURL = DOWNLOAD_URI + "/" + _this.mongoDBPlatform.getPlatform();
            _this.getArchiveName().then(function (archiveName) {
                downloadURL += "/" + archiveName;
                var downloadURLObject = url.parse(downloadURL);
                _this.debug("getDownloadURI (url obj returned with href): " + downloadURLObject.href);
                resolve(downloadURLObject);
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURIMD5 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadURI().then(function (downloadURI) {
                var downloadURIMD5 = downloadURI.href + ".md5";
                _this.debug("getDownloadURIMD5: " + downloadURIMD5);
                resolve(downloadURIMD5);
            });
        });
    };
    MongoDBDownload.prototype.createDownloadDir = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var dirToCreate = _this.getDownloadDir();
            _this.debug("createDownloadDir(): " + dirToCreate);
            fs.ensureDir(dirToCreate, function (err) {
                if (err) {
                    _this.debug("createDownloadDir() error: " + err);
                    throw err;
                }
                else {
                    _this.debug("createDownloadDir(): true");
                    resolve(true);
                }
            });
        });
    };
    MongoDBDownload.prototype.getArchiveName = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var platform = _this.mongoDBPlatform.getPlatform();
            var arch = _this.mongoDBPlatform.getArch();
            var version = _this.getVersion();
            switch (platform) {
                case 'osx':
                    if ((version === 'latest') || semver.satisfies(version, '>=3.5')) {
                        platform = platform + "-ssl";
                    }
                    break;
                case 'win32':
                    // TODO: '2012plus' for 4.x and above
                    if ((version === 'latest') || semver.satisfies(version, '>=3.5')) {
                        arch = arch + "-2008plus-ssl";
                    }
                    break;
                default:
                    break;
            }
            var name = "mongodb-" + platform + "-" + arch;
            _this.mongoDBPlatform.getOSVersionString().then(function (osString) {
                osString && (name += "-" + osString);
            }, function (error) {
                // nothing to add to name ... yet
            }).then(function () {
                name += "-" + _this.getVersion() + "." + _this.mongoDBPlatform.getArchiveType();
                resolve(name);
            });
        });
    };
    return MongoDBDownload;
}());
exports.MongoDBDownload = MongoDBDownload;
var MongoDBPlatform = /** @class */ (function () {
    function MongoDBPlatform(platform, arch) {
        this.debug = Debug('mongodb-download-MongoDBPlatform');
        this.platform = this.translatePlatform(platform);
        this.arch = this.translateArch(arch, this.getPlatform());
    }
    MongoDBPlatform.prototype.getPlatform = function () {
        return this.platform;
    };
    MongoDBPlatform.prototype.getArch = function () {
        return this.arch;
    };
    MongoDBPlatform.prototype.getArchiveType = function () {
        if (this.getPlatform() === "win32") {
            return "zip";
        }
        else {
            return "tgz";
        }
    };
    MongoDBPlatform.prototype.getCommonReleaseString = function () {
        var name = "mongodb-" + this.getPlatform() + "-" + this.getArch();
        return name;
    };
    MongoDBPlatform.prototype.getOSVersionString = function () {
        if (this.getPlatform() === "linux" && this.getArch() !== "i686") {
            return this.getLinuxOSVersionString();
        }
        else {
            return this.getOtherOSVersionString();
        }
    };
    MongoDBPlatform.prototype.getOtherOSVersionString = function () {
        return new Promise(function (resolve, reject) {
            reject("");
        });
    };
    MongoDBPlatform.prototype.getLinuxOSVersionString = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            getos(function (e, os) {
                if (/ubuntu/i.test(os.dist)) {
                    resolve(_this.getUbuntuVersionString(os));
                }
                else if (/elementary OS/i.test(os.dist)) {
                    resolve(_this.getElementaryOSVersionString(os));
                }
                else if (/suse/i.test(os.dist)) {
                    resolve(_this.getSuseVersionString(os));
                }
                else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
                    resolve(_this.getRhelVersionString(os));
                }
                else if (/fedora/i.test(os.dist)) {
                    resolve(_this.getFedoraVersionString(os));
                }
                else if (/debian/i.test(os.dist)) {
                    resolve(_this.getDebianVersionString(os));
                }
                else {
                    // TODO: 'legacy', 'static'
                    reject("");
                }
            });
        });
    };
    MongoDBPlatform.prototype.getDebianVersionString = function (os) {
        var name = "debian";
        var release = parseFloat(os.release);
        if (release >= 9.2) {
            name += "92";
        }
        else if (release >= 8.1) {
            name += "81";
        }
        else if (release >= 7.1) {
            name += "71";
        }
        else {
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getFedoraVersionString = function (os) {
        var name = "rhel";
        var fedora_version = parseInt(os.release);
        if (fedora_version > 18) {
            name += "70";
        }
        else if (fedora_version < 19 && fedora_version >= 12) {
            name += "62";
        }
        else if (fedora_version < 12 && fedora_version >= 6) {
            name += "55";
        }
        else {
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getRhelVersionString = function (os) {
        var name = "rhel";
        if (/^7/.test(os.release)) {
            name += "70";
        }
        else if (/^6/.test(os.release)) {
            name += "62";
        }
        else if (/^5/.test(os.release)) {
            name += "55";
        }
        else {
            // TODO: 'rhel57'
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getElementaryOSVersionString = function (os) {
        var name = "ubuntu1404";
        return name;
    };
    MongoDBPlatform.prototype.getSuseVersionString = function (os) {
        var release = (os.release.match(/(^11|^12)/) || [null])[0];
        if (release) {
            return "suse" + release;
        }
        else {
            this.debug("using legacy release");
            return '';
        }
    };
    MongoDBPlatform.prototype.getUbuntuVersionString = function (os) {
        var name = "ubuntu";
        var ubuntu_version = os.release ? os.release.split('.') : '';
        var major_version = parseInt(ubuntu_version[0]);
        var minor_version = ubuntu_version[1];
        if (os.release === "12.04") {
            name += "1204";
        }
        else if (os.release === "14.04") {
            name += "1404";
        }
        else if (os.release === "14.10") {
            name += "1410-clang";
        }
        else if (major_version === 14) {
            // default for major 14 to 1404
            name += "1404";
        }
        else if (os.release === "16.04") {
            name += "1604";
        }
        else if (os.release === "18.04") {
            name += "1804";
        }
        else if (major_version === 16) {
            // default for major 16 to 1604
            name += "1604";
        }
        else {
            // this needs to default to legacy release, this is a BUG
            this.debug("selecting default Ubuntu release 1404");
            name += "1404";
        }
        return name;
    };
    MongoDBPlatform.prototype.translatePlatform = function (platform) {
        switch (platform) {
            case "darwin":
                return "osx";
            case "win32":
                return "win32";
            case "linux":
                return "linux";
            case "elementary OS": //os.platform() doesn't return linux for elementary OS.
                return "linux";
            case "sunos":
                return "sunos5";
            default:
                this.debug("unsupported platform %s by MongoDB", platform);
                throw new Error("unsupported OS " + platform);
        }
    };
    MongoDBPlatform.prototype.translateArch = function (arch, mongoPlatform) {
        if (arch === "ia32") {
            if (mongoPlatform === "linux") {
                return "i686";
            }
            else if (mongoPlatform === "win32") {
                return "i386";
            }
            else {
                this.debug("unsupported mongo platform and os combination");
                throw new Error("unsupported architecture");
            }
        }
        else if (arch === "x64") {
            return "x86_64";
        }
        else {
            this.debug("unsupported architecture");
            throw new Error("unsupported architecture, ia32 and x64 are the only valid options");
        }
    };
    return MongoDBPlatform;
}());
exports.MongoDBPlatform = MongoDBPlatform;
//# sourceMappingURL=mongodb-download.js.map