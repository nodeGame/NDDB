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
    simon: __dirname + '/data.simon.csv',
    temp: function(num) {
        return __dirname + '/data.temp' + num + '.csv';
    }
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


function getLoadTests(m, it) {

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


    it('should ' + m + ' a csv file with default options and unescape '
    +'separators, quotes and escape characters, and handle \n', function(done) {
        db = new NDDB();
        db[m](filename.simon, function() {
            db.size().should.eql(3);
            db.first().should.be.eql({
                // Sentence containing tab, quote, seperator, linebreak and
                //  escape.
                Messages: 'Simon:\t"How are you, Stacey?"\nStacey:\t"\\o.o/"',
                TimeStamp: '16/3/8:2132'
            });
            db.next().should.be.eql({
                Messages: 'Simon: "Are you coming Saturday?"',
                TimeStamp: '16/3/8:2134'
            });
            db.next().should.be.eql({
                Messages: 'Stacey: "Yeah, sure \\P"',
                TimeStamp: '16/3/8:2139'
            });
            done();
        });

    });

    it('should ' + m + ' a csv file with pre-defined adapter', function(done) {
        var options, adapter;

        adapterMaker = function(str) {
            return function(item) {
                var out;
                // Convert to number
                out = parseFloat(item[str]);
                return (isNaN(out) ? item[str] : 2*out + "");
            };
        };

        // Doubles all floats
        options = {
            adapter: {
                q: adapterMaker("q"),
                e: adapterMaker("e"),
                r: adapterMaker("r")
            },
            headers: ['q', 'w', 'e', 'r']
        };
        db = new NDDB();
        db[m](filename.standard, options, function() {
            db.size().should.eql(5);
            db.first().should.be.eql({
                q: 'A',
                w: 'B',
                e: 'C',
                r: 'D'
            });
            db.last().should.be.eql({
                q: "20",
                w: "11",
                e: "24",
                r: "Z4"
            });
            done();
        });
    });

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
            db[m](filename.temp(1), function() {
                db2.load(filename.temp(1), function() {
                    db2.size().should.eql(4);
                    db2.last().should.be.eql(lastItem);
                    done();
                });
            });
        });
    });

    it('should load, ' + m + ', and reload a csv file with pre-defined adapter',
     function(done) {
        db = new NDDB();
        db.load(filename.standard, function() {
            var options, adapter;

            adapterMaker = function(str) {
                return function(item) {
                    var out;
                    // Convert to number
                    out = parseFloat(item[str]);
                    return (isNaN(out) ? item[str] : 2*out + "");
                };
            };

            // Doubles all floats
            options = {
                adapter: {
                    A: adapterMaker("A"),
                    C: adapterMaker("C"),
                    D: adapterMaker("D")
                },
                headers: true
            };

            db.size().should.eql(4);
            db2 = new NDDB();
            db[m](filename.temp(2), options, function() {
                db2.load(filename.temp(2), options, function() {
                    db2.size().should.eql(4);
                    db2.last().should.be.eql({
                        A: "40",
                        B: "11",
                        C: "48",
                        D: "Z4"
                    });
                    done();
                });
            });
        });
    });
}

describe('#load(".csv")', function() {
    getLoadTests('load', it);
});


describe('#loadSync(".csv")', function() {
    getLoadTests('loadSync', it);
});


describe('#save(".csv")', function() {
    getSaveTests('save', it);
});


describe('#saveSync(".csv")', function() {
    getSaveTests('saveSync', it);
});
