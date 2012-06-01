// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];

//To test 0 vs undefined

var items = [
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

var element = {
        painter: "Picasso",
        title: "Les Demoiselles d'Avignon",
        year: 1907
};


var hashPainter = function(o) {
	if (!o) return undefined;
	return o.painter;
}

db.h('painter',hashPainter);


describe('NDDB Hashing Operations:', function() {
    
	
    describe('An empty database', function() {
    	
    	db.import(items);
//    	console.log(db);
    	
    	
        it('should create memory slots', function() {
            db.painter.should.exist;
            db.painter.Monet.length.should.be.eql(2);
        });
    });
	    
});




