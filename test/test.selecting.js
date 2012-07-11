
var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

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


describe('NDDB Selecting', function() {
	it('should select all paintings from Dali', function(){
		db.select('painter', '=', 'Dali').db.length.should.equal(2); 
	});

    it('should select all portraits', function(){
        db.select('portrait').db.length.should.equal(1);
    });
    
    it('should select all paintings from Dali that are from before 1928', function(){
       db.select('painter', '=', 'Dali').select('year', '<', 1928).db.length.should.equal(1); 
    });
    
    it('should select all painting of the beginning of the XX centuries', function(){
       db.select('year', '><', [1900, 1910]).db.length.should.equal(1); 
    });
    
    after(function(){
    	db.clear(true);
       	db = new NDDB(); 
       	db.import(items);
    });
});


