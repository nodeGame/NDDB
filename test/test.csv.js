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

var filename = __dirname + '/data.csv';

describe('#load(".csv")', function(){

    it('should load a csv file with default options', function(done) {
        db = new NDDB();
        db.load(filename, function() {
            db.size().should.eql(4);
            db.last().should.be.eql({
                A: "10",
                B: "11",
                C: "12",
                D: "Z4"
            });
            done();
        });

    });

    it('should load a csv file with empty options', function(done) {
        db = new NDDB();
        db.load(filename, {}, function() {
            db.size().should.eql(4);
            db.last().should.be.eql({
                A: "10",
                B: "11",
                C: "12",
                D: "Z4"
            });
            done();
        });
    });

    it('should load a csv file with without quotes', function(done) {
        db = new NDDB();
        options = {
            quote: '-'
        };
        db.load(filename, options, function() {
            db.size().should.eql(4);
            db.last().should.be.eql({
                '"A"': '"10"',
                '"B"': '"11"',
                '"C"': '"12"',
                '"D"': '"Z4"'
            });
            done();
        });
    });
//    it('should load a csv file with pre-defined headers', function(done) {
//        db = new NDDB();
//        options = {
//            headers: ['q', 'w', 'e', 'r']
//        };
//        db.load(filename, options, function() {
//            console.log(db.db);
//            db.size().should.eql(5);
//            db.first().should.be.eql({
//                q: 'A',
//                w: 'B',
//                e: 'C',
//                r: 'D'
//            });
//            db.last().should.be.eql({
//                A: "10",
//                B: "11",
//                C: "12",
//                D: "Z4"
//            });
//            done();
//        });
//    });

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
