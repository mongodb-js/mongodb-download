"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var os = require('os');
var http = require('http');
var https = require('https');
var fs = require('fs-extra');
var path = require('path');
var Debug = require('debug');
var getos = require('getos');
var url = require('url');
var decompress = require('decompress');
var request = require('request-promise');
var md5File = require('md5-file');
var DOWNLOAD_URI = "http://downloads.mongodb.org";
var MONGODB_VERSION = "latest";
var HTTP_PROTOCOLS = {
    'http': http,
    'https': https
};
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
        return __awaiter(this, void 0, void 0, function () {
            var archiveName, downloadDir, fullPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getArchiveName()];
                    case 1:
                        archiveName = _a.sent();
                        downloadDir = this.getDownloadDir();
                        fullPath = path.resolve(downloadDir, archiveName);
                        this.debug("getDownloadLocation(): " + fullPath);
                        return [2 /*return*/, fullPath];
                }
            });
        });
    };
    MongoDBDownload.prototype.getExtractLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hash, e_1, downloadDir, extractLocation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hash = '';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getMD5Hash()];
                    case 2:
                        hash = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.error("hash is not returned @ getExtractLocation()");
                        throw e_1;
                    case 4:
                        downloadDir = this.getDownloadDir();
                        extractLocation = path.resolve(downloadDir, hash);
                        this.debug("getExtractLocation(): " + extractLocation);
                        return [2 /*return*/, extractLocation];
                }
            });
        });
    };
    MongoDBDownload.prototype.getTempDownloadLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var archiveName, downloadDir, fullPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getArchiveName()];
                    case 1:
                        archiveName = _a.sent();
                        downloadDir = this.getDownloadDir();
                        fullPath = path.resolve(downloadDir, archiveName + ".downloading");
                        this.debug("getTempDownloadLocation(): " + fullPath);
                        return [2 /*return*/, fullPath];
                }
            });
        });
    };
    MongoDBDownload.prototype.downloadAndExtract = function () {
        return __awaiter(this, void 0, void 0, function () {
            var archive;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.download()];
                    case 1:
                        archive = _a.sent();
                        return [4 /*yield*/, this.extract()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MongoDBDownload.prototype.extract = function () {
        return __awaiter(this, void 0, void 0, function () {
            var extractLocation, extractPresent, mongoDBArchive, files, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getExtractLocation()];
                    case 1:
                        extractLocation = _a.sent();
                        return [4 /*yield*/, this.isExtractPresent()];
                    case 2:
                        extractPresent = _a.sent();
                        if (!(extractPresent === true)) return [3 /*break*/, 3];
                        return [2 /*return*/, extractLocation];
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, this.getDownloadLocation()];
                    case 4:
                        mongoDBArchive = _a.sent();
                        return [4 /*yield*/, decompress(mongoDBArchive, extractLocation)];
                    case 5:
                        files = _a.sent();
                        this.debug("extract(): " + extractLocation);
                        return [2 /*return*/, extractLocation];
                    case 6:
                        e_2 = _a.sent();
                        this.debug('extract() failed', extractLocation, e_2);
                        throw e_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MongoDBDownload.prototype.download = function () {
        return __awaiter(this, void 0, void 0, function () {
            var httpOptionsPromise, downloadLocationPromise, tempDownloadLocationPromise, createDownloadDirPromise, _a, httpOptions, downloadLocation, tempDownloadLocation, downloadDirRes, isDownloadPresent, location;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        httpOptionsPromise = this.getHttpOptions();
                        downloadLocationPromise = this.getDownloadLocation();
                        tempDownloadLocationPromise = this.getTempDownloadLocation();
                        createDownloadDirPromise = this.createDownloadDir();
                        return [4 /*yield*/, Promise.all([
                                httpOptionsPromise,
                                downloadLocationPromise,
                                tempDownloadLocationPromise,
                                createDownloadDirPromise
                            ])];
                    case 1:
                        _a = _b.sent(), httpOptions = _a[0], downloadLocation = _a[1], tempDownloadLocation = _a[2], downloadDirRes = _a[3];
                        return [4 /*yield*/, this.isDownloadPresent()];
                    case 2:
                        isDownloadPresent = _b.sent();
                        if (!(isDownloadPresent === true)) return [3 /*break*/, 3];
                        this.debug("download(): " + downloadLocation);
                        return [2 /*return*/, downloadLocation];
                    case 3: return [4 /*yield*/, this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation)];
                    case 4:
                        location = _b.sent();
                        this.debug("download(): " + downloadLocation);
                        return [2 /*return*/, location];
                }
            });
        });
    };
    MongoDBDownload.prototype.isDownloadPresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadLocation, downloadHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadLocation()];
                    case 1:
                        downloadLocation = _a.sent();
                        if (!(this.locationExists(downloadLocation) === true)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getMD5Hash()];
                    case 2:
                        downloadHash = _a.sent();
                        return [4 /*yield*/, this.checkMD5CheckSum(downloadLocation, downloadHash)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        this.debug("isDownloadPresent() location missing: false");
                        return [2 /*return*/, false];
                }
            });
        });
    };
    MongoDBDownload.prototype.checkMD5CheckSum = function (downloadLocation, downloadHash) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            md5File(downloadLocation, function (err, hash) {
                if (err) {
                    reject(err);
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
    };
    MongoDBDownload.prototype.isExtractPresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadHash, downloadDir, extractLocation, present;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMD5Hash()];
                    case 1:
                        downloadHash = _a.sent();
                        downloadDir = this.getDownloadDir();
                        return [4 /*yield*/, this.getExtractLocation()];
                    case 2:
                        extractLocation = _a.sent();
                        present = this.locationExists(extractLocation);
                        this.debug("isExtractPresent(): " + present);
                        return [2 /*return*/, present];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashFileLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadLocation, md5HashLocation, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getDownloadLocation()];
                    case 1:
                        downloadLocation = _a.sent();
                        md5HashLocation = downloadLocation + ".md5";
                        this.debug("@getMD5HashFileLocation resolving md5HashLocation: " + md5HashLocation);
                        return [2 /*return*/, md5HashLocation];
                    case 2:
                        e_3 = _a.sent();
                        console.error("error @ getMD5HashFileLocation", e_3);
                        throw e_3;
                    case 3: return [2 /*return*/];
                }
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
        return __awaiter(this, void 0, void 0, function () {
            var md5URL, e_4, signatureContent, signatureMatch, signature, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        md5URL = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getDownloadURIMD5()];
                    case 2:
                        md5URL = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _a.sent();
                        console.error('unable to get signature content', e_4);
                        throw e_4;
                    case 4: return [4 /*yield*/, request(md5URL)];
                    case 5:
                        signatureContent = _a.sent();
                        this.debug("getDownloadMD5Hash content: " + signatureContent);
                        signatureMatch = signatureContent.match(/(.*?)\s/);
                        signature = signatureMatch[1];
                        this.debug("getDownloadMD5Hash extracted signature: " + signature);
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.cacheMD5Hash(signature)];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, signature];
                    case 8:
                        e_5 = _a.sent();
                        this.debug('@getMD5HashOnline erorr', e_5);
                        throw e_5;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashOffline = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var hashFile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMD5HashFileLocation()];
                    case 1:
                        hashFile = _a.sent();
                        fs.readFile(hashFile, 'utf8', function (err, signature) {
                            if (err) {
                                _this.debug('error @ getMD5HashOffline, unable to read hash content', hashFile);
                                reject();
                            }
                            else {
                                resolve(signature);
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    MongoDBDownload.prototype.httpDownload = function (httpOptions, downloadLocation, tempDownloadLocation) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fileStream = fs.createWriteStream(tempDownloadLocation);
            var protocol = httpOptions.protocol || 'https';
            var httpProtocol = protocol === 'http' ? http : https;
            var request = httpProtocol.get(httpOptions, function (response) {
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
        return __awaiter(this, void 0, void 0, function () {
            var downloadURI;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadURI()];
                    case 1:
                        downloadURI = _a.sent();
                        this.options.http.protocol = downloadURI.protocol;
                        this.options.http.hostname = downloadURI.hostname;
                        downloadURI.protocol = this.options.http.protocol || 'https';
                        this.options.http.path = downloadURI.path;
                        this.debug("getHttpOptions", this.options.http);
                        return [2 /*return*/, this.options.http];
                }
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadURL, archiveName, downloadURLObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        downloadURL = DOWNLOAD_URI + "/" + this.mongoDBPlatform.getPlatform();
                        return [4 /*yield*/, this.getArchiveName()];
                    case 1:
                        archiveName = _a.sent();
                        downloadURL += "/" + archiveName;
                        downloadURLObject = url.parse(downloadURL);
                        this.debug("getDownloadURI (url obj returned with href): " + downloadURLObject.href);
                        return [2 /*return*/, downloadURLObject];
                }
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURIMD5 = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadURI, downloadURIMD5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadURI()];
                    case 1:
                        downloadURI = _a.sent();
                        downloadURIMD5 = downloadURI.href + ".md5";
                        this.debug("getDownloadURIMD5: " + downloadURIMD5);
                        return [2 /*return*/, downloadURIMD5];
                }
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
        return __awaiter(this, void 0, void 0, function () {
            var name, osString, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = "mongodb-" +
                            this.mongoDBPlatform.getPlatform() + "-" +
                            this.mongoDBPlatform.getArch();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.mongoDBPlatform.getOSVersionString()];
                    case 2:
                        osString = _a.sent();
                        if (osString) {
                            name += "-" + osString;
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_6 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        name += "-" + this.getVersion() + "." + this.mongoDBPlatform.getArchiveType();
                        return [2 /*return*/, name];
                }
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
                    reject("");
                }
            });
        });
    };
    MongoDBPlatform.prototype.getDebianVersionString = function (os) {
        var name = "debian";
        var release = parseFloat(os.release);
        if (release >= 8.1) {
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
            case "elementary OS"://os.platform() doesn't return linux for elementary OS.
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