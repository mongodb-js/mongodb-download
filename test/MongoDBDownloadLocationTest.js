const expect = require('chai').expect;
const assert = require('assert');
const rewire = require('rewire');
const url = require('url');
const request = require('request-promise');
const libUnderTest = rewire('../built/mongodb-download.js');
const {MongoDBDownload} = libUnderTest;


// variation options
//   { platform, version, os }
//   plus ...
//   `location` = expected Download URL
//   `isMissing` = assert no such download
//   `only` = explicit inclusion, like `it.only`
//
// `platform` derived from MongoDBPlatform#translatePlatform, #translateArch
//   'darwin'; x64
//   'win32'; x64
//   'linux';
//     + `os` variants:  'ubuntu', etc.
//     + arch: 'x64' (x86_64), 'ia32' (i386, i686), unsupported: arm64, aarch64, s390x
//   'elementary OS' => 'linux'
//   'sunos'; x64
//
// `version` derived from MongoDBPlatform#getOSVersionString
//   @see Community Server versions
//   https://www.mongodb.com/download-center
const VARIATIONS = [

    // latest
    {
        platform: 'darwin',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-latest.tgz',
    },
    {
        platform: 'win32',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-latest.zip',
    },
    {
        platform: 'linux',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-latest.tgz',
    },
    {
        platform: 'elementary OS',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-latest.tgz',
    },
    {
        platform: 'sunos',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-latest.tgz',
    },


    // version: '4.0.3',
    {
        platform: 'darwin',
        version: '4.0.3',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.3.tgz',
    },
    {
        platform: 'win32',
        version: '4.0.3',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-4.0.3.zip',
    },
    {
        platform: 'linux',
        version: '4.0.3',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-4.0.3.tgz',
    },
    {
        platform: 'elementary OS',
        version: '4.0.3',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-4.0.3.tgz',
    },

    {
        platform: 'sunos',
        version: '4.0.1', // unsupported
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-4.0.1.tgz',
        isMissing: true,
    },

    // version: '3.6.8',
    {
        platform: 'darwin',
        version: '3.6.8',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-3.6.8.tgz',
    },
    {
        platform: 'win32',
        version: '3.6.8',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-3.6.8.zip',
    },
    {
        platform: 'linux',
        version: '3.6.8',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.6.8.tgz',
    },
    {
        platform: 'elementary OS',
        version: '3.6.8',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.6.8.tgz',
    },

    {
        platform: 'sunos',
        version: '3.6.1', // unsupported
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.6.1.tgz',
        isMissing: true,
    },

    {
        platform: 'darwin',
        version: '3.5.1',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-3.5.1.tgz',
    },
    {
        platform: 'win32',
        version: '3.5.1',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-3.5.1.zip',
    },

    // version: '3.4.17',
    {
        platform: 'darwin',
        version: '3.4.17',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.4.17.tgz',
    },
    {
        platform: 'win32',
        version: '3.4.17',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-3.4.17.zip',
    },
    {
        platform: 'linux',
        version: '3.4.17',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.17.tgz',
    },
    {
        platform: 'elementary OS',
        version: '3.4.17',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.17.tgz',
    },
    {
        platform: 'sunos',
        version: '3.4.5', // never reached 3.4.17
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.4.5.tgz',
    },

    {
        platform: 'sunos',
        version: '3.4.6', // unsupported
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.4.6.tgz',
        isMissing: true,
    },

    // version: '3.2.21',
    {
        platform: 'darwin',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.2.21.tgz',
    },
    {
        platform: 'win32',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-3.2.21.zip',
    },
    {
        platform: 'linux',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.2.21.tgz',
    },
    {
        platform: 'elementary OS',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.2.21.tgz',
    },
    {
        platform: 'sunos',
        version: '3.2.14', // never reached 3.2.21
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.2.14.tgz',
    },

    {
        platform: 'sunos',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.2.21.tgz',
        isMissing: true,
    },

    // version: '3.0.15',
    {
        platform: 'darwin',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.0.15.tgz',
    },
    {
        platform: 'win32',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-3.0.15.zip',
    },
    {
        platform: 'linux',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.0.15.tgz',
    },
    {
        platform: 'elementary OS',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.0.15.tgz',
    },
    {
        platform: 'sunos',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-3.0.15.tgz',
    },

    // version: '2.6.10',
    {
        platform: 'darwin',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-2.6.10.tgz',
    },
    {
        platform: 'win32',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2.6.10.zip',
    },
    {
        platform: 'linux',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.6.10.tgz',
    },
    {
        platform: 'elementary OS',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.6.10.tgz',
    },
    {
        platform: 'sunos',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-2.6.10.tgz',
    },

    // version: '2.4.13',
    {
        platform: 'darwin',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-2.4.13.tgz',
    },
    {
        platform: 'win32',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2.4.13.zip',
    },
    {
        platform: 'linux',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.4.13.tgz',
    },
    {
        platform: 'elementary OS',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.4.13.tgz',
    },
    {
        platform: 'sunos',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-2.4.13.tgz',
    },

    // version: '2.2.7',
    {
        platform: 'darwin',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-2.2.7.tgz',
    },
    {
        platform: 'win32',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2.2.7.zip',
    },
    {
        platform: 'linux',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.2.7.tgz',
    },
    {
        platform: 'elementary OS',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.2.7.tgz',
    },
    {
        platform: 'sunos',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-2.2.7.tgz',
    },

    // version: '2.0.9',
    {
        platform: 'darwin',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-2.0.9.tgz',
    },
    {
        platform: 'win32',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2.0.9.zip',
    },
    {
        platform: 'linux',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.0.9.tgz',
    },
    {
        platform: 'elementary OS',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.0.9.tgz',
    },
    {
        platform: 'sunos',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/sunos5/mongodb-sunos5-x86_64-2.0.9.tgz',
    },


    // win32 + arch variants
    //   ia32
    {
        platform: 'win32',
        arch: 'ia32',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2008plus-ssl-latest.zip',
        isMissing: true,
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '4.0.1',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2008plus-ssl-4.0.1.zip',
        isMissing: true,
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '3.6.1',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2008plus-ssl-3.6.1.zip',
        isMissing: true,
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '3.4.1',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.4.1.zip',
        isMissing: true,
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.2.21.zip',
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.0.15.zip',
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2.6.10.zip',
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2.4.13.zip',
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2.2.7.zip',
    },
    {
        platform: 'win32',
        arch: 'ia32',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/win32/mongodb-win32-i386-2.0.9.zip',
    },


    // linux + arch variants
    //   ia32
    {
        platform: 'linux',
        arch: 'ia32',
        version: 'latest',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-latest.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '4.0.1',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-4.0.1.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '3.6.1',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-3.6.1.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '3.4.1',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-3.4.1.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '3.2.21',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-3.2.21.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '3.0.15',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-3.0.15.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '2.6.10',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-2.6.10.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '2.4.13',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-2.4.13.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '2.2.7',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-2.2.7.tgz',
    },
    {
        platform: 'linux',
        arch: 'ia32',
        version: '2.0.9',
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-i686-2.0.9.tgz',
    },


    // linux + os variants
    //   ubuntu
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '0.0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '12.00' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '12.04' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1204-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '14.00' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '14.04' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '14.10' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1410-clang-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '16.00' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1604-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'ubuntu', release: '16.04' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1604-latest.tgz',
    },
    //   elementary OS
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'elementary OS' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-latest.tgz',
    },
    //   suse
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'suse', release: '0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'suse', release: '11' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-suse11-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'suse', release: '12' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-suse12-latest.tgz',
    },
    //   rhel
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'rhel', release: '0.0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel-latest.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'rhel', release: '5.0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel55-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'rhel', release: '6.0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'rhel', release: '7.0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-latest.tgz',
    },
    //   fedora
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'fedora', release: '0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel-latest.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'fedora', release: '6' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel55-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'fedora', release: '12' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'fedora', release: '19' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-latest.tgz',
    },
    //   debian
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'debian', release: '0' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian-latest.tgz',
        isMissing: true,
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'debian', release: '7.1' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian71-latest.tgz',
    },
    {
        platform: 'linux',
        version: 'latest',
        os: { dist: 'debian', release: '8.1' },
        location: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian81-latest.tgz',
    },
];


describe('MongoDB Download Location variations', () => {
    let getos = libUnderTest.__get__('getos');
    beforeEach(() => {
        // file detection & MD5 downloads shouldn't take a long time
        this.timeout = 5000;
    });
    afterEach(() => {
        libUnderTest.__set__('getos', getos);
    });

    let variations = VARIATIONS.filter((variation) => variation.only);
    if (variations.length === 0) {
        // none were called out
        variations = VARIATIONS;
    }

    variations.forEach((variation) => {
        const options = Object.assign({}, variation);
        delete options.location;
        delete options.os;
        delete options.isMissing;
        delete options.only;
        const mongoDBDownload = new MongoDBDownload(options);

        const { location, os, isMissing } = variation;
        let description = `for ${ JSON.stringify(options) }`;
        if (os !== undefined) {
            description = `${ description } with OS ${ JSON.stringify(os) }`;
        }

        describe(description, () => {
            beforeEach(() => {
                if (os !== undefined) {
                    // mock { dist, release }
                    libUnderTest.__set__('getos', (callback) => {
                        callback(null, os);
                    });
                }
            });

            it('returns a Download Location', () => {
                return mongoDBDownload.getDownloadURI().then((downloadURLObject) => {
                    const { href } = downloadURLObject;
                    expect(href).to.equal(location);
                });
            });

            if (isMissing) {
                it('does not detect a Download File', () => {
                    return mongoDBDownload.getDownloadURI().then((downloadURLObject) => {
                        const { href } = downloadURLObject;
                        return request(href, { method: 'HEAD' });
                    })
                    .then(assert.fail, (err) => {
                        expect(err.statusCode).to.equal(403);
                    });
                });

                it('fails to retrieve an MD5 Hash online', () => {
                    return mongoDBDownload.getMD5HashOnline().then(assert.fail, (err) => {
                        expect(err.statusCode).to.equal(403);
                    });
                });
            }
            else {
                it('detects a Download File', () => {
                    return mongoDBDownload.getDownloadURI().then((downloadURLObject) => {
                        const { href } = downloadURLObject;
                        return request(href, { method: 'HEAD' });
                    })
                    .then((results) => {
                        const { etag } = results;
                        expect(etag).to.not.equal(undefined);
                    });
                });

                it('retrieves an MD5 Hash online', () => {
                    return mongoDBDownload.getMD5HashOnline().then((md5) => {
                        expect(md5).to.match(/^[a-fA-F0-9]+$/);
                    });
                });
            }
        });

    });
});
