// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB({
	update: {
		indexes: true,
	}
});

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
var testcase = null;
var tmp = null;

var hashPainter = function(o) {
	if (!o) return undefined;
	return o.painter;
}

db.h('painter', hashPainter);

db.importDB(not_hashable);
db.importDB(hashable);

describe('NDDB Remove Operations:', function() {


	describe('#remove()',function() {
        describe('Removing elements not in index (Ferrari)', function() {
            before(function(){
                testcase = db.select('car', '=', 'Ferrari').execute();
                testcase.remove();
            });
            after(function(){
                testcase = null;
                tmp = null;
            });
            
            it('the selection should be empty', function() {
                testcase.length.should.be.eql(0);
            });
            
            it('there should be no Ferrari in the database', function() {
               db.select('car', '=', 'Ferrari').execute().length.should.be.eql(0);
            });
            
            it('should decrease db.length', function() {
                db.length.should.eql(nitems -1);
            });
        
        });
        describe('Removing elements that are indexed', function() {
            before(function(){
                tmp = db.length;
                testcase = db.select('painter', '=', 'Monet').execute();
                testcase.remove();
                db.rebuildIndexes();    

                
            });
            
            it('should decrease the length of the database', function() {
                db.length.should.be.eql(tmp - 2);
            });
            
            it('should decrease the length of the index', function() {
                db.painter.should.not.have.property('Monet');
            });
        
        });
        
        describe('Removing all items', function() {
            before(function(){
                db.remove();
            });
            
            it('should make db.length equal to 0', function() {
                db.length.should.eql(0);
            });
            
            it('should reset all indexes', function() {
                db.painter.should.be.eql({});
            });
            
        });
    });
	
	describe('#clear()',function() {

        before(function() {
            db.importDB(hashable);
        });

        it('should clear all items',function() {
            var before = db.db.length;
            db.clear(true);
            db.db.length.should.not.eql(before);
        })
    });

});



