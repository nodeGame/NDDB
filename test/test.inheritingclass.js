var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB,
J = require('JSUS').JSUS;

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

ADB.prototype.remove = function(id) {
    this.id.remove(id);
};

var adb, adb2;
var out;

describe('ADB inherited class with view, index, and hash', function() {
    before(function() {
        adb = new ADB();
    });
    describe("#constructor()",function() {

        it("created obj should have empty index", function() {
            ('undefined' !== typeof adb.id).should.be.true;
        });
        it("created obj should have empty view", function() {
            ('undefined' !== typeof adb.vi).should.be.true;
        });
        it("created obj should have hash hash", function() {
            ('undefined' !== typeof adb.ha).should.be.true;
        });

        it("created obj should have view with empty index", function() {
            ('undefined' !== typeof adb.vi.id).should.be.true;
        });
        it("created obj should have view with empty hash", function() {
            ('undefined' !== typeof adb.vi.ha).should.be.true;
        });

    });

    describe("#insert()",function() {

        it("should return add 1 item to adb", function() {
            adb.insert({id: 1});
            adb.size().should.be.eql(1);
        });
        it("hash should have non-empty index", function() {
            ('undefined' !== typeof adb.ha[1].id).should.be.true;
            adb.ha[1].id.size().should.be.eql(1);
        });
        it("hash should have non-empty view", function() {
            ('undefined' !== typeof adb.ha[1].vi).should.be.true;
            adb.ha[1].vi.size().should.be.eql(1);
        });

        it("view should have non-empty index", function() {
            ('undefined' !== typeof adb.vi.id).should.be.true;
            adb.vi.id.size().should.be.eql(1);
        });
        it("view should have non-empty hash", function() {
            ('undefined' !== typeof adb.vi.ha[1]).should.be.true;
            adb.vi.ha[1].size().should.be.eql(1);
        });
    });

    describe("#breed()",function() {
        before(function() {
            adb2 = adb.breed();
        });
        it("adb2 should be instance of ADB", function() {
            adb.constructor.name.should.equal('ADB');
            ('function' === typeof adb.remove).should.be.true;
        });
    });

    describe("removing from index",function() {
        before(function() {
            adb.id.pop(1);
        });
        it("should reduce db size to 0", function() {
            adb.size().should.be.eql(0);
        });

        it("should reduce view size to 0", function() {
            adb.vi.size().should.be.eql(0);
        });
        it("should reduce index size in view to 0", function() {
            adb.vi.id.size().should.be.eql(0);
        });
        it("should reduce hash size in view to 0", function() {
            J.size(adb.vi.ha).should.be.eql(0);
        });

        it("should reduce hash size to 0", function() {
            J.size(adb.ha).should.be.eql(0);
        });
    });

    describe("#on('insert')", function() {
        before(function() {
            out = [];
            adb.on('insert', function(o) {
                out.push(o);
            });
            adb.insert({id: 100});
        });
        after(function() {
            adb.off('insert');
            out = null;
        });
        it('should call insert listener only once and not on hashes and views',
           function() {
               out.length.should.eql(1);
           });

    });

});
