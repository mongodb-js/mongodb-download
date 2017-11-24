import { expect } from 'chai';

import {MongoDBPlatform} from '../src/mongodb-download';


describe('MongoDBPlatform class', () => {

    describe('getDebianVersionString()', () => {

        const mongoDBDownload = new MongoDBPlatform("linux", "x64");

        let os:any = {
            dist: "debian",
        };

        it('should return a archive name for debian 6.2', done => {
            os.release = "6.2";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian");
            done();
        });

        it('should return a archive name for debian 7.0', done => {
            os.release = "7.0";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian");
            done();
        });

        it('should return a archive name for debian 7.1', done => {
            os.release = "7.1";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian71");
            done();
        });

        it('should return a archive name for debian 8.0', done => {
            os.release = "8.0";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian71");
            done();
        });

        it('should return a archive name for debian 8.1', done => {
            os.release = "8.1";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian81");
            done();
        });

        it('should return a archive name for debian 9.0', done => {
            os.release = "9.0";
            expect(mongoDBDownload.getDebianVersionString(os)).to.equal("debian81");
            done();
        });
    })
});
