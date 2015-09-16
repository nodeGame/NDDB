// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
fs = require('fs'),
path = require('path'),
should = require('should'),
NDDB = require('./../index').NDDB;

var db;
var options;

var filename = {
    default: __dirname + '/data.csv',
    escapeTesting: __dirname + '/data.escapetest.csv'
};

var lastItem = {
    A: "10",
    B: "11",
    C: "12",
    D: "Z4"
};

var lastItemUnescaped = {
    '"A"': '"10"',
    '"B"': '"11"',
    '"C"': '"12"',
    '"D"': '"Z4"'
};



describe('#load(".csv")', function(){

    it('should load a csv file with default options', function(done) {
        db = new NDDB();
        db.load(filename.default, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItem);
            done();
        });

    });

    it('should load a csv file with empty options', function(done) {
        db = new NDDB();
        db.load(filename.default, {}, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItem);
            done();
        });
    });

    it('should load a csv file with without quotes', function(done) {
        db = new NDDB();
        options = {
            quote: '-'
        };
        db.load(filename.default, options, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItemUnescaped);
            done();
        });
    });
    it('should load a csv file with pre-defined headers', function(done) {
        db = new NDDB();
        options = {
            headers: ['q', 'w', 'e', 'r']
        };
        db.load(filename.default, options, function() {
            db.size().should.eql(5);
            db.first().should.be.eql({
                q: 'A',
                w: 'B',
                e: 'C',
                r: 'D'
            });
            db.last().should.be.eql({
                q: "10",
                w: "11",
                e: "12",
                r: "Z4"
            });
            done();
        });
    });

    it('should load a csv file with pre-defined adapter', function(done) {
        db = new NDDB();
        options = {
            headers: ['q', 'w', 'e', 'r']
        };
        db.load(filename.default, options, function() {
            db.size().should.eql(5);
            db.first().should.be.eql({
                q: 'A',
                w: 'B',
                e: 'C',
                r: 'D'
            });
            db.last().should.be.eql({
                q: "10",
                w: "11",
                e: "12",
                r: "Z4"
            });
            done();
        });
    });


    it('should load a csv file with default options and unescape seperators',
    function(done) {
        db = new NDDB();
        db.load(filename.escapeTesting, function() {
            db.size().should.eql(4);
            db.first();
            db.next();
            db.next().should.be.eql({
                A: '7,5',
                B: '8',
                C: '9',
                D: 'Z3'
            });
            done();
        });

    });

});

// describe('#loadSync(".csv")', function(){
//
//     it('should load sync. a csv file with default options', function(done) {
//         db = new NDDB();
//         db.loadSync(filename, function() {
//             db.size().should.eql(4);
//             db.last().should.be.eql({
//                 A: "10",
//                 B: "11",
//                 C: "12",
//                 D: "Z4"
//             });
//             done();
//         });
//
//     });
//
//     it('should load sync. a csv file with empty options', function(done) {
//         db = new NDDB();
//         db.loadSync(filename, {}, function() {
//             db.size().should.eql(4);
//             db.last().should.be.eql({
//                 A: "10",
//                 B: "11",
//                 C: "12",
//                 D: "Z4"
//             });
//             done();
//         });
//     });
// });
