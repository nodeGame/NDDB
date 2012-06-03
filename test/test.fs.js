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

var nitems = hashable.length + not_hashable.length;
var testcase = null;
var tmp = null;

var hashPainter = function(o) {
	if (!o) return undefined;
	return o.painter;
}

//db.h('painter', hashPainter);

db.import(not_hashable);
db.import(hashable);

var filename = './db.out';

describe('Testing NDDB save and load functions', function(){
	
	describe('#save()', function(){
		before(function(){
			fs.unlink(filename, function (err) {
				if (err) throw err;  
			});
			db.save(filename);
		});
		
		it('should create a dump file', function() {
			path.existsSync(filename).should.be.true;
		});
		
	});
	
	describe('#load()', function(){
		before(function() {
			db2.load(filename);
		});
		
		it('the loaded database should be a copy of the saved one', function() {
			db2.db.should.be.eql(db.db);
		});
		
	});
	
	
	
});