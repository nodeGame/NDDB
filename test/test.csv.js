// Requiring and exporting JSUS
var JSUS = require('JSUS').JSUS;
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
    escapeTestingNoQuotes: __dirname + '/data.escapetest_noquotes.csv',
    unescapeTesting: __dirname + '/data.unescapetest.csv',
    simon: __dirname + '/data.simon.csv',
    linebreak: __dirname + '/data.linebreak.csv',
    temp: function(num) {
        return __dirname + '/data.temp' + num + '.csv';
    }
};

var lastItem = {
    A: 10,
    B: 11,
    C: "12",
    D: "Z4"
};

var lastItemUnescaped = {
    '"A"': 10,
    '"B"': 11,
    '"C"': '"12"',
    '"D"': '"Z4"'
};

var deleteIfExists = function(filename) {
    if (JSUS.existsSync(filename)) {
        fs.unlinkSync(filename);
    }
};

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


    it('should ' + m + ' a csv file with custom linebreak characters',
        function(done) {
        db = new NDDB();

        db.load(filename.standard, function() {
            db.save(filename.linebreak, { lineBreak: '\r\n' }, function() {
                db = new NDDB();
                db[m](filename.linebreak, { lineBreak: '\r\n' } , function() {
                    db.size().should.eql(4);
                    db.last().should.be.eql(lastItem);

                    // Delete linebreak file.
                    fs.unlink(filename.linebreak, function() {
                        done();
                    });
                });
            });
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
                q: 10,
                w: 11,
                e: '12',
                r: 'Z4'
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

    it('should ' + m + ' a csv file with adapter with strings', function(done) {
        var options, adapterMaker;

        // Doubles all floats
        options = {
            adapter: {
                q: 'e',
                e: 'r',
                r: 'q'
            },
            headers: ['q', 'w', 'e', 'r']
        };
        db = new NDDB();
        db[m](filename.standard, options, function() {
            db.size().should.eql(5);
            db.first().should.be.eql({
                q: 'C',
                w: 'B',
                e: 'D',
                r: 'A'
            });
            db.last().should.be.eql({
                q: '12',
                w: 11,
                e: 'Z4',
                r: 10
            });
            done();
        });
    });

    it('should ' + m + ' a csv file with adapter with cbs', function(done) {
        var options, adapterMaker;

        adapterMaker = function(str) {
            return function(item) {
                var out;
                // Convert to number
                out = parseFloat(item[str]);
                return (isNaN(out) ? item[str] : 2*out + '');
            };
        };

        // Doubles all floats
        options = {
            adapter: {
                q: adapterMaker('q'),
                e: adapterMaker('e'),
                r: adapterMaker('r')
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
                q: '20',
                w: 11,
                e: '24',
                r: 'Z4'
            });
            done();
        });
    });

    it('should ' + m + ' a csv file with def. options and unescaped separators',
       function(done) {
           db = new NDDB();
           db[m](filename.unescapeTesting, function() {
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

    it('should ' + m + ' a csv file with def. options and escaped separators',
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

    it('should ' + m + ' a csv file with def. options and escaped ' +
       'separators, and no quotes.',

       function(done) {
           db = new NDDB();
           db[m](filename.escapeTestingNoQuotes, function() {
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

    it('should ' + m + ' a csv file with several pre-defined headers',
     function(done) {
        db = new NDDB();

        // No headers defined.
        db[m](filename.standard, {headers: false}, function() {
            db.size().should.eql(5);
            db.first().should.be.eql({
                X1: 'A',
                X2: 'B',
                X3: 'C',
                X4: 'D'
            });
            db.last().should.be.eql({
                X1: 10,
                X2: 11,
                X3: '12',
                X4: 'Z4'
            });
            db = new NDDB();

            // User defined headers.
            db[m](filename.standard, {headers: ['q', 'w', 'e', 'r']},
                function() {
                    db.size().should.be.eql(5);
                    db.first().should.be.eql({
                        q: 'A',
                        w: 'B',
                        e: 'C',
                        r: 'D'
                    });
                    db.last().should.be.eql({
                        q: 10,
                        w: 11,
                        e: '12',
                        r: 'Z4'
                    });
                    db = new NDDB();

                    // Headers defined in file.
                    db[m](filename.standard, {headers: true}, function() {
                        db.size().should.be.eql(4);
                        db.first().should.be.eql({
                            A: '1',
                            B: '2',
                            C: '3',
                            D: 'Z1'
                        });
                        db.last().should.be.eql(lastItem);

                        db = new NDDB();

                        // Mixed.
                        db[m](filename.standard, {headers: [false, true, 'k']},
                            function() {
                                db.size().should.be.eql(4);
                                db.first().should.be.eql({
                                    X1: '1',
                                    B:  '2',
                                    k:  '3',
                                    X4: 'Z1'
                                });
                                db.last().should.be.eql({
                                    X1: 10,
                                    B:  11,
                                    k:  '12',
                                    X4: 'Z4'
                                });

                                db = new NDDB();

                                // Mixed
                                db[m](filename.standard,
                                    {headers: [false, 'B', 'k']}, function() {
                                    db.size().should.be.eql(5);
                                    db.first().should.be.eql({
                                        X1: 'A',
                                        B:  'B',
                                        k:  'C',
                                        X4: 'D'
                                    });
                                    db.last().should.be.eql({
                                        X1: 10,
                                        B:  11,
                                        k:  '12',
                                        X4: 'Z4'
                                    });

                                    done();
                                });
                            }
                        );
                    });
                }
            );
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

    it('should load, ' + m + ', and reload a csv file using a small buffer',
        function(done) {
        var options;
        options = { bufferSize: 16 };

        db = new NDDB();
        db.load(filename.standard, options, function() {
            db.size().should.eql(4);
            db2 = new NDDB();
            db[m](filename.temp(1), options, function() {
                db2.load(filename.temp(1), options, function() {
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
                var options, adapterMaker;

                adapterMaker = function(str) {
                    return function(item) {
                        var out;
                        // Convert to number
                        out = parseFloat(item[str]);
                        return (isNaN(out) ? item[str] : 2*out + '');
                    };
                };

                // Doubles all floats.
                options = {
                    adapter: {
                        A: adapterMaker('A'),
                        C: adapterMaker('C'),
                        D: adapterMaker('D')
                    },
                    headers: true
                };

                db.size().should.eql(4);
                db2 = new NDDB();
                db[m](filename.temp(2), options, function() {
                    db2.load(filename.temp(2), options, function() {
                        db2.size().should.eql(4);
                        db2.last().should.be.eql({
                            A: '40',
                            B: 11,
                            C: '48',
                            D: 'Z4'
                        });
                        done();
                    });
                });
            });
        }
    );

    it('should load, ' + m + ', and reload a csv file with several '
        + 'pre-defined headers', function(done) {
            db = new NDDB();
            db.loadSync(filename.standard);
            db.size().should.eql(4);
            db2 = new NDDB();

            // Do not save headers.
            db[m](filename.temp(3), {headers: false}, function() {
                db2.loadSync(filename.temp(3), {headers: ['A','B','C','D']},
                    null);
                db2.size().should.eql(4);
                db2.last().should.be.eql(lastItem);

                db2 = new NDDB();

                // Save user defined headers.
                db[m](filename.temp(3), {headers: ['A', 'B', 'C']},
                    function() {
                        db2.loadSync(filename.temp(3));
                        db2.size().should.eql(4);
                        db2.last().should.be.eql({
                            A: 10,
                            B: 11,
                            C: '12'
                        });
                        db2 = new NDDB();

                        // Infer and save headers.
                        db[m](filename.temp(3), {headers: true}, function() {
                            db2.loadSync(filename.temp(3), {headers: false},
                                null);
                            db2.size().should.eql(5);
                            db2.first().should.be.eql({
                                X1: 'A',
                                X2: 'B',
                                X3: 'C',
                                X4: 'D'
                            });
                            db2.last().should.be.eql({
                                X1: 10,
                                X2: 11,
                                X3: '12',
                                X4: 'Z4'
                            });
                            done();
                        });
                    }
                );
            });
        }
    );
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
    after(function() {
        deleteIfExists(__dirname + '/data.temp1.csv');
        deleteIfExists(__dirname + '/data.temp2.csv');
        deleteIfExists(__dirname + '/data.temp3.csv');
    });
});
