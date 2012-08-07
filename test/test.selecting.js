
var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB,
    JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;

var items = [
			 {
				 painter: "Jesus",
				 title: "Tea in the desert",
				 year: 0,
			 },
             {
                 painter: "Dali",
                 title: ["Portrait of Paul Eluard", "Das Rätsel der Begierde", "Das finstere Spiel oder Unheilvolles Spiel"],
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
                 title: {en: "Water Lilies",de:"Wasser Lilies"},
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
    describe('#select',function() {
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
        //
        it('should select all painting between 1900 and 1999', function(){
           db.select('year', '<>', [1900, 1999]).db.length.should.equal(3); 
        });
        
        it('should select all paintings made by Dali and Monet', function(){
           db.select('painter', 'in', ['Dali','Monet']).db.length.should.equal(4); 
        });
        
        it('should select all painting not made by Dali and Jesus', function(){
            var res = db.select('painter', '!in', ['Dali']).select('painter', '!in', ['Jesus']);
            res.db.length.should.equal(3); 
            res.select('painter','==','Dali').length.should.be.eql(0);
        });
        
        it('passing from parameter to >< should work like >', function(){
           db.select('year', '><', [1900]).db.length.should.equal(3); 
        });
        it('passing from parameter to the >< should not accept numbers', function(){
           db.select('painter', '><', ['Monet']).db.length.should.equal(0); 
        });  
        it('selecting a translation of a title', function(){
           db.select('title.de', '==', 'Wasser Lilies').db.length.should.equal(1); 
           db.select('title.de', '==', ['Wasser Lilies']).select('painter','=','Manet').db.length.should.be.eql(0);
        });
        it('selecting one of the posibles titles', function(){
           db.select('title', '=', 'Das finstere Spiel oder Unheilvolles Spiel').db.length.should.equal(0); 
        });
    });
    describe('#filter',function() {
        describe('',function() {
            before(function() {
                select = db.filter(function(e){
                   if (JSUS.in_array("Das Rätsel der Begierde", e.title)) {
                       return true;
                   }
                });
            });
            it('select a title in a array', function(){
               select.db.should.eql([items[1]]);
            });
        });
        describe('',function() {
            before(function() {
                select = db.filter(function(e){
                    return (typeof e.title == 'object');
                });
            });
            it('select all Objects that are titles', function(){
               select.db.should.eql([items[1],items[3]]);
            });
        });
    });

	



    before(function(){
    	db.clear(true);
       	db = new NDDB(); 
       	db.importDB(items);
    });
});


describe('#distinct()', function(){
	before(function(){
		db.clear(true);
		db.importDB(items);
		db.importDB(items);
	})
	it('should eliminates all duplicated entries', function() {
		db.distinct().fetch().should.be.eql(items);
	});
});


