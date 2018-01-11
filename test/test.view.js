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

var art_items = [
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

var not_art_items = [
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

var nitems = art_items.length + not_art_items.length;


var element = {
    painter: "Picasso",
    title: "Les Demoiselles d'Avignon",
    year: 1907
};


var paintersView = function(o) {
    return o.painter;
}

var carsView = function(o) {
    if (!o) return undefined;
    return o.car;
}

db.view('art', paintersView);
db.view('cars', carsView);

db.init({update:{ indexes: true, } });


describe('NDDB Views Operations:', function() {

     describe('views after invoking constructor', function() {
        it('should exist even if no element was added', function() {
            ('undefined' !== typeof db.cars).should.be.true;
            ('undefined' !== typeof db.art).should.be.true;
        });
    });

    describe('Importing not-art_items', function() {
        before(function(){
            db.importDB(not_art_items);
        });

        it('should populate the car view', function() {
            db.cars.size().should.eql(not_art_items.length);
        });
    });


    describe('Importing art_items', function() {
        before(function(){
            db.importDB(art_items);
        });

        it('should populate the art view', function() {
            db.art.size().should.eql(art_items.length);

        });

        it('should increase the length of the database', function() {
            db.size().should.be.eql(nitems);
        });
    });

    describe('Elements updated in the db should be updated in the views',
             function() {

        before(function(){
            var j = db.selexec('painter', '=', 'Jesus').update({
                painter: 'JSUS'
            });
        });


        it('updated property \'painter\' should be reflected in the index',
           function() {

            db.art.selexec('painter', '=', 'JSUS').count().should.be.eql(1);

        });
    });

    describe('Elements updated in the views should be updated in the db',
             function() {

        before(function(){
            var j = db.art.selexec('painter', '=', 'JSUS').update({
                painter: 'Jesus'
            });
        });

        it('updated property \'painter\' should be reflected in the index',
           function() {

            db.selexec('painter', '=', 'Jesus').count().should.be.eql(1);
        });
    });

    // Default view.

    // Default hash.

    describe('**default view** Importing not-hashable items', function() {
        before(function(){
            db = new NDDB();
            db.init({ update: { indexes: true } });

            db.view('painter');
            db.importDB(not_art_items);
        });

        it('should not create the special indexes', function() {
            db.painter.should.not.exist;
            db.size().should.eql(not_art_items.length);
        });
    });

    describe('**default view** Importing hashable items', function() {
        before(function(){
            db.importDB(art_items);
        });

        it('should create the special indexes', function() {
            db.painter.should.exist;
            db.painter.size().should.be.eql(art_items.length);
        });

        it('should increase the length of the database', function() {
            db.size().should.be.eql(nitems);
        });
    });

});
