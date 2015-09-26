// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
fs = require('fs'),
path = require('path'),
should = require('should'),
NDDB = require('./../index').NDDB;

var db, db2;
var options;

var filename = {
    standard: __dirname + '/data.csv',
    escapeTesting: __dirname + '/data.escapetest.csv',
    simon: __dirname + '/data.simon.csv'
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

// To be used. Maybe.
var items = [
    {
        id: '123456',
        time: '098765',
        data: {
            a: 1,
            b: 2,
            c: "the butler said: \"ah.\""
        }
    },
    {
        id: '123456',
        time: '098765',
        data: {
            a: 1,
            b: 2,
            c: 'the butler said: "ah, not now."'
        },
    },
];


function getTests(m, it) {

    var db;

    it('should ' + m + ' a csv file with default options', function(done) {
        db = new NDDB();
        db[m](filename.standard, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItem);
            done();
        });

    });

    it('should ' + m + ' a csv file with empty options', function(done) {
        db = new NDDB();
        db[m](filename.standard, {}, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItem);
            done();
        });
    });

    it('should ' + m + ' a csv file with without quotes', function(done) {
        db = new NDDB();
        options = {
            quote: '-'
        };
        db[m](filename.standard, options, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItemUnescaped);
            done();
        });
    });
    it('should ' + m + ' a csv file with pre-defined headers', function(done) {

        db = new NDDB();
        options = {
            headers: ['q', 'w', 'e', 'r']
        };
        db[m](filename.standard, options, function() {
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

    it('should ' + m + ' a csv file with pre-defined adapter', function(done) {
        db = new NDDB();
        options = {
            headers: ['q', 'w', 'e', 'r']
        };
        db.load(filename.standard, options, function() {
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


    it('should ' + m + ' a csv file with def. options and unescape separators',
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


    it('should ' + m + ' a csv file with default options and unescape '
    +'separators, quotes and escape characters, and handle \n', function(done) {
        db = new NDDB();
        db[m](filename.simon, function() {
            db.size().should.eql(1);
            db.first().should.be.eql({
                Speech: 'Simon says "Hello, I like you"\n'
            });
            done();
        });

    });

    //Isn't this the same as above?
   it('should ' + m + ' a csv file with pre-defined adapter', function(done) {
        db = new NDDB();
        options = {
            headers: ['q', 'w', 'e', 'r']
        };
        db[m](filename.standard, options, function() {
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

    //Isn't this the same as above?
    it('should ' + m + ' a csv file with def. options and unescape separators',
       function(done) {
           db = new NDDB();
           db[m](filename.escapeTesting, function() {
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
}

function getSaveTests(m, it) {

    it('should load, ' + m + ', and reload a csv file', function(done) {
        db = new NDDB();
        db.load(filename.standard, function() {
            db.size().should.eql(4);
            db2 = new NDDB();
            db[m](__dirname + '/data.currenttest.csv', function() {
                db2.load(__dirname + '/data.currenttest.csv', function() {
                    db2.size().should.eql(4);
                    db2.last().should.be.eql(lastItem);
                    done();
                });
            });
        });
    });
}

describe('#load(".csv")', function() {
    getTests('load', it);
});


describe('#loadSync(".csv")', function() {
    getTests('loadSync', it);
});


describe('#save(".csv")', function() {
    getSaveTests('save', it);
});


describe('#saveSync(".csv")', function() {
    getSaveTests('saveSync', it);
});
