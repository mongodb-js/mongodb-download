const os: any = require('os');
const http: any = require('https');
const fs: any = require('fs-extra');
const path: any = require('path');
const Debug: any = require('debug');
const getos: any = require('getos');
const url: any = require('url');
const semver: any = require('semver');
const decompress: any = require('decompress');
const request: any = require('request-promise');
const md5File: any = require('md5-file');

const DOWNLOAD_URI: string = "https://fastdl.mongodb.org";
const MONGODB_VERSION: string = "latest";

export interface IMongoDBDownloadOptions {
  platform: string;
  arch: string;
  version: string;
  downloadDir: string;
  http: any;
}

export interface IMongoDBDownloadProgress {
  current: number;
  length: number;
  total: number;
  lastStdout: string;
}


export class MongoDBDownload {
  options: IMongoDBDownloadOptions;
  mongoDBPlatform: MongoDBPlatform;
  downloadProgress: IMongoDBDownloadProgress;
  debug: any;

  constructor( {
    platform = os.platform(),
    arch = os.arch(),
    downloadDir = os.tmpdir(),
    version = MONGODB_VERSION,
    http = {}
  }) {
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
    this.downloadProgress ={
      current: 0,
      length: 0,
      total: 0,
      lastStdout: ""
    }
  }

  getPlatform(): string {
    return this.options.platform;
  }

  getArch(): string {
    return this.options.arch;
  }

  getVersion(): string {
    return this.options.version;
  }

  getDownloadDir(): string {
    return this.options.downloadDir;
  }

  getDownloadLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getArchiveName().then((archiveName) => {
        let downloadDir: string = this.getDownloadDir();
        let fullPath: string = path.resolve(downloadDir, archiveName);
        this.debug(`getDownloadLocation(): ${fullPath}`);
        resolve(fullPath);
      });
    });
  }

  getExtractLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getMD5Hash().then((hash: string) => {
        if (! hash) {
          console.error("hash is not returned @ getExtractLocation()");
          return reject();
        }
        let downloadDir: string = this.getDownloadDir();
        let extractLocation: string = path.resolve(downloadDir, hash);
        this.debug(`getExtractLocation(): ${extractLocation}`);
        resolve(extractLocation);
      }, (e) => {
        console.error('hash is not returned @ getExtractLocation()', e);
        reject();
      });
    });
  }

  getTempDownloadLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getArchiveName().then((archiveName) => {
        let downloadDir: string = this.getDownloadDir();
        let fullPath: string = path.resolve(downloadDir, `${archiveName}.downloading`);
        this.debug(`getTempDownloadLocation(): ${fullPath}`);
        resolve(fullPath);
      });
    });
  }

  downloadAndExtract(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.download().then((archive: string) => {
        this.extract().then((extractLocation: string) => {
          resolve(extractLocation);
        });
      })
    });
  }

  extract(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getExtractLocation().then((extractLocation: string) => {
        this.isExtractPresent().then((extractPresent: boolean) => {
          if ( extractPresent === true ) {
            resolve(extractLocation);
          } else {
            this.getDownloadLocation().then((mongoDBArchive: string) => {
              decompress(mongoDBArchive, extractLocation).then((files: any) => {
                this.debug(`extract(): ${extractLocation}`);
                resolve(extractLocation);
              }, (e: any) => {
                this.debug('extract() failed', extractLocation, e);
              });
            });
          }
        });
      })
    });
  }

  download(): Promise<string> {
    return new Promise<string>((resolve, reject) => {

      let httpOptionsPromise: Promise<string> = this.getHttpOptions();
      let downloadLocationPromise: Promise<string> = this.getDownloadLocation();
      let tempDownloadLocationPromise: Promise<string> = this.getTempDownloadLocation();
      let createDownloadDirPromise: Promise<boolean> = this.createDownloadDir();

      Promise.all([
      httpOptionsPromise,
      downloadLocationPromise,
      tempDownloadLocationPromise,
      createDownloadDirPromise
      ]).then(values => {
        let httpOptions: any = values[0];
        let downloadLocation: string = values[1];
        let tempDownloadLocation: string = values[2];
        let downloadDirRes: boolean = values[3];

        this.isDownloadPresent().then((isDownloadPresent: boolean) => {
          if ( isDownloadPresent === true ) {
            this.debug(`download(): ${downloadLocation}`);
            resolve(downloadLocation);
          } else {
            this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation).then((location: string) => {
              this.debug(`download(): ${downloadLocation}`);
              resolve(location);
            }, (e) => {
              reject(e);
            })
          }
        });
      });
    });
  }

  // TODO: needs refactoring
  isDownloadPresent(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getDownloadLocation().then((downloadLocation: string) => {
        if (this.locationExists(downloadLocation) === true ) {
          this.getMD5Hash().then(downloadHash => {
            md5File(downloadLocation, (err: any, hash: string) => {
              if (err) {
                throw err;
              }
              if ( hash === downloadHash ) {
                this.debug(`isDownloadPresent() md5 match: true`);
                resolve(true);
              } else {
                this.debug(`isDownloadPresent() md5 mismatch: false`);
                resolve(false);
              }
            });
          });
        } else {
          this.debug(`isDownloadPresent() location missing: false`);
          resolve(false);
        }
      });
    });
  }

  isExtractPresent(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getMD5Hash().then(downloadHash => {
        let downloadDir: string = this.getDownloadDir();
        this.getExtractLocation().then((extractLocation: string) => {
          let present: boolean = this.locationExists(extractLocation);
          this.debug(`isExtractPresent(): ${present}`);
          resolve(present);
        });
      });
    });
  }

 getMD5HashFileLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadLocation().then((downloadLocation: string) => {
        let md5HashLocation: string = `${downloadLocation}.md5`;
        this.debug(`@getMD5HashFileLocation resolving md5HashLocation: ${md5HashLocation}`);
        resolve(md5HashLocation);
      }, (e) => {
        console.error("error @ getMD5HashFileLocation", e);
        reject(e);
      });
    });
  }

  cacheMD5Hash(signature: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.getMD5HashFileLocation().then((hashFile: string) => {
        fs.outputFile(hashFile, signature, (err: any) => {
          if ( err ) {
            this.debug('@cacheMD5Hash unable to save signature', signature);
            reject();
          } else {
            resolve();
          }
        });
      });
    });
  }

  getMD5Hash(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        this.getMD5HashOffline().then((offlineSignature: string) => {
          this.debug(`@getMD5Hash resolving offlineSignature ${offlineSignature}`);
          resolve(offlineSignature);
        }, (e: any) => {
          this.getMD5HashOnline().then((onlineSignature: string) => {
            this.debug(`@getMD5Hash resolving onlineSignature: ${onlineSignature}`);
            resolve(onlineSignature);
          }, (e: any) => {
            console.error('unable to get signature content', e);
            reject(e);
          });
        });
    });
  }

  getMD5HashOnline(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURIMD5().then((md5URL) => {
        request(md5URL).then((signatureContent: string) => {
          this.debug(`getDownloadMD5Hash content: ${signatureContent}`);
          let signatureMatch: string[] = signatureContent.match(/([^\s]*)(\s*|$)/);
          let signature: string = signatureMatch[1];
          this.debug(`getDownloadMD5Hash extracted signature: ${signature}`);
          this.cacheMD5Hash(signature).then(() => {
            resolve(signature);
          }, (e: any) => {
            this.debug('@getMD5HashOnline erorr', e);
            reject();
          });
        }, (e: any) => {
          console.error('unable to get signature content', e);
          reject(e);
        });
      })
    });
  }

  getMD5HashOffline(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getMD5HashFileLocation().then((hashFile: string) => {
        fs.readFile(hashFile, 'utf8', (err: any, signature: string) => {
          if ( err ) {
            this.debug('error @ getMD5HashOffline, unable to read hash content', hashFile);
            reject();
          } else {
            resolve(signature);
          }
        });
      });
    });
  }

  httpDownload(httpOptions: any, downloadLocation: string, tempDownloadLocation: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let fileStream: any = fs.createWriteStream(tempDownloadLocation);

      let request: any = http.get(httpOptions, (response: any) => {
        this.downloadProgress.current = 0;
        this.downloadProgress.length = parseInt(response.headers['content-length'], 10);
        this.downloadProgress.total = Math.round(this.downloadProgress.length / 1048576 * 10) / 10;

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            fs.renameSync(tempDownloadLocation, downloadLocation);
            this.debug(`renamed ${tempDownloadLocation} to ${downloadLocation}`);
            resolve(downloadLocation);
          });
        });

        response.on("data", (chunk: any) => {
          this.printDownloadProgress(chunk);
        });

        request.on("error", (e: any) => {
          this.debug("request error:", e);
          reject(e);
        });
      });
    });
  }

  getCrReturn(): string {
    if (this.mongoDBPlatform.getPlatform() === "win32") {
      return "\x1b[0G";
    } else {
      return "\r";
    }
  }

  locationExists(location: string): boolean {
    let exists: boolean;
    try {
      let stats: any = fs.lstatSync(location);
      this.debug("sending file from cache", location);
      exists = true;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      exists = false;
    }
    return exists;
  }

  printDownloadProgress(chunk: any): void {
    let crReturn: string = this.getCrReturn();
    this.downloadProgress.current += chunk.length;
    let percent_complete: number = Math.round(
    100.0 * this.downloadProgress.current / this.downloadProgress.length * 10
    ) / 10 ;
    let mb_complete: number = Math.round(this.downloadProgress.current / 1048576 * 10) / 10;
    let text_to_print: string =
    `Completed: ${percent_complete} % (${mb_complete}mb / ${this.downloadProgress.total}mb${crReturn}`;
    if (this.downloadProgress.lastStdout !== text_to_print) {
      this.downloadProgress.lastStdout = text_to_print;
      process.stdout.write(text_to_print);
    }
  }


  getHttpOptions(): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURI().then((downloadURI) => {
        this.options.http.protocol = downloadURI.protocol;
        this.options.http.hostname = downloadURI.hostname;
        this.options.http.path = downloadURI.path;
        this.debug("getHttpOptions", this.options.http);
        resolve(this.options.http);
      });
    });
  }

  getDownloadURI(): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      let downloadURL: string = `${DOWNLOAD_URI}/${this.mongoDBPlatform.getPlatform()}`;
      this.getArchiveName().then((archiveName) => {
        downloadURL += `/${archiveName}`;
        let downloadURLObject: any = url.parse(downloadURL);
        this.debug(`getDownloadURI (url obj returned with href): ${downloadURLObject.href}`);
        resolve(downloadURLObject);
      });
    });
  }

  getDownloadURIMD5(): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURI().then((downloadURI: any) => {
        let downloadURIMD5: string = `${downloadURI.href}.md5`;
        this.debug(`getDownloadURIMD5: ${downloadURIMD5}`);
        resolve(downloadURIMD5);
      })
    });
  }

  createDownloadDir(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        let dirToCreate: string = this.getDownloadDir();
        this.debug(`createDownloadDir(): ${dirToCreate}`);
        fs.ensureDir(dirToCreate, (err: any) => {
          if ( err ) {
            this.debug(`createDownloadDir() error: ${err}`);
            throw err;
          } else {
            this.debug(`createDownloadDir(): true`);
            resolve(true);
          }
        });
    });
  }


  getArchiveName(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let platform: string = this.mongoDBPlatform.getPlatform();
      let arch: string = this.mongoDBPlatform.getArch();
      let version: string = this.getVersion();

      switch (platform) {
        case 'osx':
          if ((version === 'latest') || semver.satisfies(version, '>=3.5')) {
             platform = `${platform}-ssl`;
          }
          break;
        case 'win32':
          // TODO: '2012plus' for 4.x and above
          if ((version === 'latest') || semver.satisfies(version, '>=3.5')) {
             arch = `${arch}-2008plus-ssl`;
          }
          break;
        default:
          break;
      }
      let name: string = `mongodb-${platform}-${arch}`;

      this.mongoDBPlatform.getOSVersionString().then(osString => {
        osString && (name += `-${osString}`);
      }, (error) => {
        // nothing to add to name ... yet
      }).then(() => {
        name += `-${this.getVersion()}.${this.mongoDBPlatform.getArchiveType()}`;
        resolve(name);
      });
    });
  }
}


export class MongoDBPlatform {
  platform: string;
  arch: string;
  debug: any;

  constructor(platform: string, arch: string) {
    this.debug = Debug('mongodb-download-MongoDBPlatform');
    this.platform = this.translatePlatform(platform);
    this.arch = this.translateArch(arch, this.getPlatform());
  }

  getPlatform(): string {
    return this.platform;
  }

  getArch(): string {
    return this.arch;
  }

  getArchiveType(): string {
    if ( this.getPlatform() === "win32" ) {
      return "zip";
    } else {
      return "tgz";
    }
  }

  getCommonReleaseString(): string {
    let name: string = `mongodb-${this.getPlatform()}-${this.getArch()}`;
    return name;
  }

  getOSVersionString(): Promise<string> {
    if ( this.getPlatform() === "linux" && this.getArch() !== "i686") {
      return this.getLinuxOSVersionString();
    } else {
      return this.getOtherOSVersionString();
    }
  }

  getOtherOSVersionString(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      reject("");
    });
  }

  getLinuxOSVersionString(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      getos((e: any, os: any) => {
        if (/ubuntu/i.test(os.dist)) {
          resolve(this.getUbuntuVersionString(os));
        } else if (/elementary OS/i.test(os.dist)) {
          resolve(this.getElementaryOSVersionString(os));
        } else if (/suse/i.test(os.dist)) {
          resolve(this.getSuseVersionString(os));
        } else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
          resolve(this.getRhelVersionString(os));
        } else if (/fedora/i.test(os.dist)) {
          resolve(this.getFedoraVersionString(os));
        } else if (/debian/i.test(os.dist)) {
          resolve(this.getDebianVersionString(os));
        } else {
          // TODO: 'legacy', 'static'
          reject("");
        }
      });
    });
  }

  getDebianVersionString(os: any): string {
    let name: string = "debian";
    let release: number = parseFloat(os.release);
    if (release >= 9.2) {
      name += "92";
    } else if (release >= 8.1) {
      name += "81";
    } else if (release >= 7.1) {
      name += "71";
    } else {
      this.debug("using legacy release");
    }
    return name;
  }

  getFedoraVersionString(os: any): string {
    let name: string = "rhel";
    let fedora_version: number = parseInt(os.release);
    if (fedora_version > 18) {
      name += "70";
    } else if (fedora_version < 19 && fedora_version >= 12) {
      name += "62";
    } else if (fedora_version < 12 && fedora_version >= 6) {
      name += "55";
    } else {
      this.debug("using legacy release");
    }
    return name;
  }

  getRhelVersionString(os: any): string {
    let name: string = "rhel";
    if (/^7/.test(os.release)) {
      name += "70";
    } else if (/^6/.test(os.release)) {
      name += "62";
    } else if (/^5/.test(os.release)) {
      name += "55";
    } else {
      // TODO: 'rhel57'
      this.debug("using legacy release");
    }
    return name;
  }

  getElementaryOSVersionString(os: any): string {
    let name: string = "ubuntu1404";
    return name;
  }

  getSuseVersionString(os: any): string {
    let [release]: [string | null] = os.release.match(/(^11|^12)/) || [null];

    if (release) {
      return `suse${release}`;
    } else {
      this.debug("using legacy release");
      return '';
    }
  }

  getUbuntuVersionString(os: any): string {
    let name: string = "ubuntu";
    let ubuntu_version: string[] = os.release ? os.release.split('.') : '';
    let major_version: number = parseInt(ubuntu_version[0]);
    let minor_version: string = ubuntu_version[1];

    if (os.release === "12.04") {
      name += "1204";
    } else if (os.release === "14.04") {
      name += "1404";
    } else if (os.release === "14.10") {
      name += "1410-clang";
    } else if (major_version === 14) {
      // default for major 14 to 1404
      name += "1404";
    } else if (os.release === "16.04") {
      name += "1604";
    } else if (os.release === "18.04") {
      name += "1804";
    } else if (major_version === 16) {
      // default for major 16 to 1604
      name += "1604";
    } else {
      // this needs to default to legacy release, this is a BUG
      this.debug("selecting default Ubuntu release 1404");
      name += "1404";
    }
    return name;
  }


  translatePlatform(platform: string): string {
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
      throw new Error(`unsupported OS ${platform}`);
    }
  }

  translateArch(arch: string, mongoPlatform: string): string {
    if (arch === "ia32") {
      if (mongoPlatform === "linux") {
        return "i686";
      } else if (mongoPlatform === "win32") {
        return "i386";
      } else {
        this.debug("unsupported mongo platform and os combination");
        throw new Error("unsupported architecture");
      }
    } else if (arch === "x64") {
      return "x86_64";
    } else {
      this.debug("unsupported architecture");
      throw new Error("unsupported architecture, ia32 and x64 are the only valid options");
    }
  }

}
