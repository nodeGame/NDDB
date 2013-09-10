// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
fs = require('fs'),
path = require('path'),
should = require('should'),
NDDB = require('./../index').NDDB;

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

var weirdos_import = [
    {}, 
    function(){console.log('foo')},
    {
       	a: undefined,
       	b: null,
       	c: {},
       	d: function(){console.log('foo')},
    }];

var weirdos_load = [
    {}, 
    {},
    {
      	b: null,
      	c: {},
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
var c2 = base_cycle;

// TODO: referencing the whole object does not work.
//c1.aa = base_cycle;
c2.ac = base_cycle.c;
c2.aa = base_cycle.b;

var cycles = [c1, c2];

var nitems = hashable.length + not_hashable.length;
var testcase = null;
var tmp = null;

var hashPainter = function(o) {
    if (!o) return undefined;
    return o.painter;
}

db.hash('painter', hashPainter);

var filename = './db.out';

var deleteIfExist = function(cb) {
    if (JSUS.existsSync(filename)) {
	fs.unlinkSync(filename);
	if (cb) cb();
    }
    else {
	if (cb) cb();
    }
};


var testSaveLoad = function(items, compareToImport, compareToLoad) {
    
    describe('#save()', function(){
	
	before(function() {
	    deleteIfExist(function(){
		db2.clear(true);
		db = new NDDB();
		db.importDB(items);
		db.save(filename);
	    });
	});
	
	it('should create a dump file', function() {
	    JSUS.existsSync(filename).should.be.true;
	});
	
	it('original database should be unchanged', function() {
	    
	    if (compareToImport) {
		JSUS.equals(db.db, compareToImport).should.be.true;
	    }
	    else {
		db.db.should.be.eql(items);
	    }
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
	    if (compareToLoad) {
		JSUS.equals(db2.db, compareToLoad).should.be.true;
	    }
	    else {
		JSUS.equals(db.db, db2.db).should.be.true;
	    }
	    
	});
	
    });
};

// STRESS TEST
//for (var i=0; i<1000; i++){

describe('NDDB io operations.', function(){
    
    describe('Cycle / Decycle.', function(){
	
	describe('Not Hashable items', function(){
	    testSaveLoad(not_hashable);
	});
	
	describe('Hashable items.', function(){
	    testSaveLoad(hashable);
	});
	
	describe('Weirdos items.', function(){
	    testSaveLoad(weirdos, weirdos_import);
	});
	
	describe('Cycles items', function(){
	    testSaveLoad(cycles);
	});

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
	
	describe('Weirdos items.', function(){
	    testSaveLoad(weirdos, weirdos_import);
	});
	
	describe('Cycles items', function(){
	    testSaveLoad(cycles);
	});

    });
    
});

// END STRESS
//}