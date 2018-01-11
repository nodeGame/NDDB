// Requiring and exporting JSUS
var JSUS = require('JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
should = require('should'),
NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];

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


var element = {
    painter: "Picasso",
    title: "Les Demoiselles d'Avignon",
    year: 1907
};

var hashPainter = function(o) { return o.painter; }

db.hash('painter', hashPainter);
db.hash('foo_painter', hashPainter);

db.init({ update: { indexes: true } });

describe('NDDB Hashing Operations:', function() {

    describe('Importing not-hashable items', function() {
        before(function(){
            db.importDB(not_hashable);
        });

        it('should not create the special indexes', function() {
            db.painter.should.not.exist;
            db.size().should.eql(not_hashable.length);
        });
    });

    describe('Importing hashable items', function() {
        before(function(){
            db.importDB(hashable);
        });

        it('should create the special indexes', function() {
            db.painter.should.exist;
            db.painter.Monet.size().should.be.eql(2);
        });

        it('should increase the length of the database', function() {
            db.size().should.be.eql(nitems);
        });
    });

    describe('Elements updated in the db should be updated in the indexes',
             function() {

        before(function(){
            var j = db.select('painter', '=', 'Jesus').execute().first();
            j.painter = 'JSUS';
        });


        it('updated property \'painter\' should be reflected in the index',
           function() {

            var j = db.painter.Jesus.first();
            j.painter.should.be.eql('JSUS');
        });
    });

    describe('Elements updated in the index should be updated in the db',
             function() {

        before(function(){
            db.painter.Manet.first().painter = 'M.A.N.E.T.';
        });

        it('updated property \'painter\' should be reflected in the index',
           function() {

            db.select('painter', '=', 'M.A.N.E.T.')
                   .execute().size().should.be.eql(1);
        });
    });


    describe('Index should be created regardless if that is the name ' +
             'of a property of the object', function() {

        it('should create the special indexes', function() {
            db.foo_painter.should.exist;
            db.foo_painter.Monet.size().should.be.eql(2);
        });
    });


    // Default hash.

    describe('**default hash** Importing not-hashable items', function() {
        before(function(){
            db = new NDDB();
            db.init({ update: { indexes: true } });

            db.hash('painter');
            db.importDB(not_hashable);
        });

        it('should not create the special indexes', function() {
            db.painter.should.not.exist;
            db.size().should.eql(not_hashable.length);
        });
    });

    describe('**default hash** Importing hashable items', function() {
        before(function(){
            db.importDB(hashable);
        });

        it('should create the special indexes', function() {
            db.painter.should.exist;
            db.painter.Monet.size().should.be.eql(2);
        });

        it('should increase the length of the database', function() {
            db.size().should.be.eql(nitems);
        });
    });

});
