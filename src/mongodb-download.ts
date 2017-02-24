const os: any = require('os');
const http: any = require('https');
const fs: any = require('fs');
const path: any = require('path');
const debug: any = require('debug')('mongodb-download');
const getos: any = require('getos');
const url: any = require('url');
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
        debug(`getDownloadLocation(): ${fullPath}`);
        resolve(fullPath);
      });
    });
  }
  
  getExtractLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getMD5Hash().then(hash => {
        let downloadDir: string = this.getDownloadDir();
        let extractLocation: string = path.resolve(downloadDir, hash);
        debug(`getExtractLocation(): ${extractLocation}`);
        resolve(extractLocation);
      });
    });
  }
  
  getTempDownloadLocation(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getArchiveName().then((archiveName) => {
        let downloadDir: string = this.getDownloadDir();
        let fullPath: string = path.resolve(downloadDir, `${archiveName}.downloading`);
        debug(`getTempDownloadLocation(): ${fullPath}`);
        resolve(fullPath);
      });
    });
  }
  
  downloadAndExtract(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.download().then((archive: string) => {
        this.extract().then((location: string) => {
          resolve('downloaded and extracted');
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
                debug(`extract(): ${extractLocation}`);
                resolve(extractLocation);
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
      let createDownloadDirPromise: Promise<string> = this.createDownloadDir();
      let getMD5HashPromise: Promise<string> = this.getMD5Hash();
      
      Promise.all([
      httpOptionsPromise, 
      downloadLocationPromise,
      tempDownloadLocationPromise,
      ]).then(values => {
        let httpOptions: any = values[0];
        let downloadLocation: string = values[1];
        let tempDownloadLocation: string = values[2];
        
        this.isDownloadPresent().then((isDownloadPresent: boolean) => {
          if ( isDownloadPresent === true ) {
            debug(`download(): ${downloadLocation}`);
            resolve(downloadLocation);
          } else {
            this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation).then((location: string) => {
              debug(`download(): ${downloadLocation}`);
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
                debug(`isDownloadPresent(): true`);
                resolve(true);
              } else {
                debug(`isDownloadPresent(): false`);
                resolve(false);
              }
              console.log(`The MD5 sum of LICENSE.md is: ${hash}`);
            });
          });
        } else {
          debug(`isDownloadPresent(): false`);
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
          debug(`isExtractPresent(): ${present}`);
          resolve(present);
        });
      });
    });
  }
  
  getMD5Hash(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURIMD5().then((md5URL) => {
        request(md5URL).then((signatureContent: string) => {
          debug(`getDownloadMD5Hash content: ${signatureContent}`);
          let signatureMatch: string[] = signatureContent.match(/(.*?)\s/);
          let signature: string = signatureMatch[1];
          debug(`getDownloadMD5Hash: ${signature}`);
          resolve(signature);
        }, (e: any) => {
          console.error('unable to get signature content', e);
          reject(e);
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
            resolve(downloadLocation);
          });
        });
        
        response.on("data", (chunk: any) => {
          this.printDownloadProgress(chunk);
        });
        
        request.on("error", (e: any) => {
          debug("request error:", e);
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
      debug("sending file from cache");
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
        debug("getHttpOptions", this.options.http);
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
        debug(`getDownloadURI (url obj returned with href): ${downloadURLObject.href}`);
        resolve(downloadURLObject);
      });
    });
  }
  
  getDownloadURIMD5(): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURI().then((downloadURI: any) => {
        let downloadURIMD5: string = `${downloadURI.href}.md5`;
        debug(`getDownloadURIMD5: ${downloadURIMD5}`);
        resolve(downloadURIMD5);
      })
    });
  }
  
  createDownloadDir(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        fs.mkdirSync(this.getDownloadDir());
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
      } finally {
        resolve("ok");
      }
    });
  }
  
  
  getArchiveName(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      //var name = "mongodb-" + mongo_platform + "-" + mongo_arch;
      let name = "mongodb-" + 
      this.mongoDBPlatform.getPlatform() + "-" +
      this.mongoDBPlatform.getArch();
      
      this.mongoDBPlatform.getOSVersionString().then((osString) => {
        name += `-${osString}`;
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
  
  constructor(platform: string, arch: string) {
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
          reject("");
        }  
      });
    });    
  }
  
  getDebianVersionString(os: any): string {
    let name: string = "debian";
    if (/^(7|8)/.test(os.release)) {
      name += "71";
    } else {
      debug("using legacy release");
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
      debug("using legacy release");
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
      debug("using legacy release");
    }
    return name;
  }
  
  getElementaryOSVersionString(os: any): string {
    let name: string = "ubuntu1404";
    return name;
  }
  
  getSuseVersionString(os: any): string {
    let name: string = "suse";
    if (/^11/.test(os.release)) {
      name += "11";
    } else {
      debug("using legacy release");
    }
    return name;
  }
  
  getUbuntuVersionString(os: any): string {
    let name: string = "ubuntu";
    let ubuntu_version: string[] = os.release.split('.');
    let major_version: number = parseInt(ubuntu_version[0]);
    let minor_version: string = ubuntu_version[1];
    if (os.release == "14.04" || major_version > 14) {
      name += "1404";
    } else if (os.release == "12.04") {
      name += "1204";
    } else if (os.release == "14.10") {
      name += "1410-clang";
    } else {
      debug("using legacy release");
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
      debug("unsupported platform %s by MongoDB", platform);
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
        debug("unsupported mongo platform and os combination");
        throw new Error("unsupported architecture");
      }
    } else if (arch === "x64") {
      return "x86_64";
    } else {
      debug("unsupported architecture");
      throw new Error("unsupported architecture, ia32 and x64 are the only valid options");
    }
  }
  
}