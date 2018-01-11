// Requiring and exporting JSUS
var JSUS = require('JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB;

var db = new NDDB({
    update: {
        indexes: true,
    }
});

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];

//To test 0 vs undefined

var hashable = [
    {
        painter: "Jesus",
        title: "Tea in the desert",
        year: 0,
    },
    {
        painter: "Dali",
        title: "Portrait of Paul Eluard",
        year: 1929,
        portrait: true
    },
    {
        painter: "Dali",
        title: "Barcelonese Mannequin",
        year: 1927
    },
    {
        painter: "Monet",
        title: "Water Lilies",
        year: 1906
    },
    {
        painter: "Monet",
        title: "Wheatstacks (End of Summer)",
        year: 1891
    },
    {
        painter: "Manet",
        title: "Olympia",
        year: 1863
    },

];

var not_hashable = [
    {
        car: "Ferrari",
        model: "F10",
        speed: 350,
    },
    {
        car: "Fiat",
        model: "500",
        speed: 100,
    },
    {
        car: "BMW",
        model: "Z4",
        speed: 250,
    },
];

var nitems = hashable.length + not_hashable.length;
var testcase = null;
var tmp = null;

var hashPainter = function(o) {
    if (!o) return undefined;
    return o.painter;
}

describe('NDDB Remove Operations:', function() {

    before(function(){
        db = new NDDB({
            update: {
                indexes: true,
            }
        });
        db.hash('painter', hashPainter);

        db.importDB(not_hashable);
        db.importDB(hashable);
    });

    describe('Removing elements not in index (Ferrari)', function() {
        before(function(){
            testcase = db.select('car', '=', 'Ferrari').execute();
            testcase.removeAllEntries();
        });
        after(function(){
            testcase = null;
            tmp = null;
        });

        it('the selection should be empty', function() {
            testcase.size().should.be.eql(0);
        });

        it('Ferrari should still be in the original database', function() {
            db.select('car', '=', 'Ferrari').execute().size().should.be.eql(1);
        });

        it('original length should not change', function() {
            db.size().should.eql(nitems);
        });

    });

    describe('Removing elements that are indexed', function() {
        before(function(){
            tmp = db.size();
            testcase = db.select('painter', '=', 'Monet').execute();
            testcase.removeAllEntries();
            db.rebuildIndexes();


        });

        it('should not decrease the length of the database', function() {
            db.size().should.be.eql(tmp);
        });

        it('should leave the length of the index unchanged', function() {
            db.painter.should.have.property('Monet');
        });

    });

    describe('#clear()',function() {

        before(function() {
            db.importDB(hashable);
            db.tag('A', db.first());
            db.clear();
        });

        it('should clear all items',function() {
            db.size().should.eql(0);
        });

        it('should clear all tags',function() {
            JSUS.size(db.tags).should.eql(0);
        });

        it('should clear indexes and hashes',function() {
            (!db.painter).should.be.true;
        });
    });

});
