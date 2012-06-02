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


var hashPainter = function(o) {
	if (!o) return undefined;
	return o.painter;
}

db.h('painter',hashPainter);


describe('NDDB Hashing Operations:', function() {
    
	describe('Importing not-hashable items', function() {
    	before(function(){
    		db.import(not_hashable);
    	});
    	
        it('should not create the special indexes', function() {
            db.painter.should.not.exist;
            db.length.should.eql(not_hashable.length);
        });
    });
	
	
    describe('Importing hashable items', function() {
    	before(function(){
    		db.import(hashable);
    	});
    	
        it('should create the special indexes', function() {
            db.painter.should.exist;
            db.painter.Monet.length.should.be.eql(2);
        });
        
        it('should increase the length of the database', function() {
            db.length.should.be.eql(nitems);
        });
    });
	
    describe('Elements updated in the db should be updated in the indexes', function() {
    	before(function(){
    		var j = db.select('painter', '=', 'Jesus').first();
    		j.painter = 'JSUS';
    	});
    	
    	
    	it('updated property \'painter\' should be reflected in the index', function() {
    		var j = db.painter.Jesus.first();
    		j.painter.should.be.eql('JSUS');
        });
    });
    
    describe('Elements updated in the index should be updated in the db', function() {
    	before(function(){
    		db.painter.Manet.first().painter = 'M.A.N.E.T.';
    	});

    	it('updated property \'painter\' should be reflected in the index', function() {
    		db.select('painter', '=', 'M.A.N.E.T.').length.should.be.eql(1);
        });
    });
    
//    describe('Deleting elements should update the indexes', function() {
//    	before(function(){
//    		db.select('painter', '=', 'Monet').delete();
//    	});
//    	
//    	it('should decrease the length of the database', function() {
//    		db.length.should.be.eql(nitems - 2);
//    	});
//    	
//    	it('should decrease the length of the index', function() {
//    		db.painter.Monet.length.should.be.eql(0);
//    	});
//
//    });
    
//    describe('Deleting elements in the index should update the database', function() {
//    	before(function() {
//    		var m = db.painter.Monet.select('year', '=', 1906);
//    		console.log(m.fetch());
//    		m.delete();
//    	});
//    	
//    	
//    	it('should decrease the length of the database', function() {
//    		db.length.should.be.eql(nitems - 1);
//    	});
//    	
//    	it('should delete all Monet entries', function() {
//    		db.select('painter', '=', 'Monet').length.should.be.eql(1);
//    	});
//    	
//    	it('should decrease the length of the index', function() {
//    		db.painter.Monet.length.should.be.eql(1);
//    	});
//
//    });
    
});




