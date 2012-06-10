// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
	fs = require('fs'),
	path = require('path'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();
var db2 = new NDDB();

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

// NOT WORKING WELL
var weirdos = [
	undefined, 
    null, 
    {}, 
    function(){console.log('foo')},
    {
    	a: undefined,
    	b: null,
    	c: {},
    	d: function(){console.log('foo')},
}];

// Cycles

var base_cycle = {
		a: 1,
		b: 2,
		c: {a: 1, 
			b: {foo: 1},
			},
};

var c1 = base_cycle;
var c2 = JSUS.clone(base_cycle);

c1.aa = base_cycle;
c2.ac = base_cycle.c;

var cycles = [c1];

//console.log(cycles);
//console.log(Object.prototype.toString.apply(c1.aa))
var nitems = hashable.length + not_hashable.length;
var testcase = null;
var tmp = null;

var hashPainter = function(o) {
	if (!o) return undefined;
	return o.painter;
}

db.h('painter', hashPainter);

var filename = './db.out';

var deleteIfExist = function() {
	if (path.existsSync(filename)) {
		fs.unlink(filename, function (err) {
			if (err) throw err;  
		});
	}
};


var testSaveLoad = function(items) {
	
	describe('#save()', function(){
		
		before(function() {
			deleteIfExist();
			db2.clear(true);
			db = new NDDB();
			db.import(items);
			db.save(filename);
		});
		
		it('should create a dump file', function() {
			path.existsSync(filename).should.be.true;
		});
		
		it('original database should be unchanged', function() {
			db.db.should.be.eql(items);
		});
		
	});
	
	describe('#load()', function(){
		before(function() {
			db2.load(filename);
		});
		after(function() {
			deleteIfExist();
		});
		
		it('the loaded database should be a copy of the saved one', function() {
			db2.db.should.be.eql(db.db);
		});
		
	});
};


describe('NDDB io operations.', function(){
	
	describe('Cycle / Decycle.', function(){
		
		describe('Not Hashable items', function(){
			testSaveLoad(not_hashable);
		});
		
		describe('Hashable items.', function(){
			testSaveLoad(hashable);
		});
		
//		describe('Weirdos items.', function(){
//			testSaveLoad(weirdos);
//		});
		
//		describe('Cycles items', function(){
//			testSaveLoad(cycles);
//		});

	});
	
	describe('Without Cycle / Decycle.', function(){
		before(function(){
			delete JSON.decycle;
			delete JSON.retrocycle;
		});
		
		describe('Not Hashable items', function(){
			testSaveLoad(not_hashable);
		});
		
		describe('Hashable items.', function(){
			testSaveLoad(hashable);
		});
		
//		describe('Weirdos items.', function(){
//			testSaveLoad(weirdos);
//		});
		
//		describe('Cycles items', function(){
//			testSaveLoad(cycles);
//		});

	});
	
});