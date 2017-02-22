var expect = require('chai').expect;
let {MongoDBDownload} = require('../built/mongodb-download.js');



describe('MongoDBDownload class', function() {
    it('should return a platform', function(){
    	let mongoDBDownload = new MongoDBDownload({});
    	expect(mongoDBDownload.getPlatform()).to.be.a("string");
    });

    it('should return a version', function(){
        let mongoDBDownload = new MongoDBDownload({});
        expect(mongoDBDownload.getVersion()).to.be.a("string");
    });

    it('should return a arch', function(){
        let mongoDBDownload = new MongoDBDownload({});
        expect(mongoDBDownload.getArch()).to.be.a("string");
    });

    it('should return a download dir', function(){
        let mongoDBDownload = new MongoDBDownload({});
        expect(mongoDBDownload.getDownloadDir()).to.be.a("string");
    });

    it('should return a archive name', function(){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getArchiveName().then((name) => {
            expect(name).to.be.a("string");
        });
    });

    it('should return a download URI', function(){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getDownloadURI().then((downloadURI) => {
            expect(downloadURI).to.be.an("object");
        });
    });

    it('should return a cr', function(){
        let mongoDBDownload = new MongoDBDownload({});
        expect(mongoDBDownload.getCrReturn()).to.be.a("string");
    });

    it('should return a download location', function(){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getDownloadLocation().then((location) => {
            expect(location).to.be.an("string");
        });
    });
});
