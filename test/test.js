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
    
    it('should return a archive name', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getArchiveName().then((name) => {
            expect(name).to.be.a("string");
            done();
        });
    });
    
    it('should return a download URI', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getDownloadURI().then((downloadURI) => {
            expect(downloadURI).to.be.an("object");
            done();
        });
    });
    
    it('should return a cr', function(){
        let mongoDBDownload = new MongoDBDownload({});
        expect(mongoDBDownload.getCrReturn()).to.be.a("string");
    });
    
    it('should return a download location', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getDownloadLocation().then((location) => {
            expect(location).to.be.an("string");
            done();
        });
    });
    it('should download', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.download().then((location) => {
            expect(location).to.be.an("string");
            done();
        });
    });
    
    it('should extract', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.download().then((location) => {
            expect(location).to.be.an("string");
            done();
        });
    });
    
    it('should download and extract', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.downloadAndExtract().then((location) => {
            expect(location).to.be.an("string");
            done();
        });
    });
    
    it('should return a link to md5 URI', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getDownloadURIMD5().then((location) => {
            expect(location).to.be.an("string");
            done();
        });
    });
    it('should return md5 cache file', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getMD5HashFileLocation().then((md5File) => {
            expect(md5File).to.be.an("string");
            done();
        });
    }); 
    it('should return a link to md5 content', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getMD5Hash().then((md5) => {
            expect(md5).to.be.an("string");
            done();
        });
    });  
    it('should return md5 hash online', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getMD5HashOnline().then((md5) => {
            expect(md5).to.be.an("string");
            done();
        });
    });
    it('should return md5 cached hash', function(done){
        let mongoDBDownload = new MongoDBDownload({});
        mongoDBDownload.getMD5HashOffline().then((md5) => {
            expect(md5).to.be.an("string");
            done();
        });
    });  
});
