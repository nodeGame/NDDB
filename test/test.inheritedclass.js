var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
JSUS = require('JSUS').JSUS;

var db = new NDDB();


var db = new NDDB();

db.hash('ha', function(i) {
    return i.id;
});
db.insert({id: 1});
db.insert({id: 2});


ADB.prototype = new NDDB();
ADB.prototype.constructor = ADB;

function ADB() {
    var options = {};
    options.update = {};
    options.update.indexes = true;
    NDDB.call(this, options);
    this.index('id', function(i) {
        return i.id;
    });
    this.hash('ha', function(i) {
        return i.id;
    });
    this.view('vi', function(i) {
        return i.id;
    }); 
}


var adb;

describe('ADB inherited class with view, index, and hash', function() {	
    before(function() {
        adb = new ADB();
    });

    describe("#insert()",function() {
    	
        it("should return add 1 item to adb", function() {
            adb.insert({id: 1});
            adb.size().should.be.eql(1);

        });
    });
});
