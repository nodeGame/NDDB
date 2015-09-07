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


var items = [
    {
        id: '123456',
        time: '098765',
        data: {
            a: 1,
            b: 2,
            c: "she said: \"ah.\""
        }
    },
    {
        id: '123456',
        time: '098765',
        data: {
            a: 1,
            b: 2,
            c: 'she said: "ah, not now."'
        },
    },
];

var ops = ['loadSync'];

var i, len;
i = -1, len = ops.length;


function getTests(m, it) {

    var db;

    it('should ' + m + ' a csv file with default options', function(done) {
        db = new NDDB();
        db[m](filename, function() {
            db.size().should.eql(4);
            db.last().should.be.eql(lastItem);
            done();
        });

    });

    it('should ' + m + ' a csv file with empty options', function(done) {
        db = new NDDB();
        db[m](filename, {}, function() {
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
        db[m](filename, options, function() {
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
        db[m](filename, options, function() {
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
}

describe('#load(".csv")', function() {
    getTests('load', it);
});


describe('#loadSync(".csv")', function() {
    getTests('loadSync', it);
});
