var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB,
    J = require('JSUS').JSUS;

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

var copy = null;



describe('NDDB Events', function() {
    
//    describe('#on(\'insert\') ',function() {
//    	before(function() {
//        	copy = [];
//        	db.on('insert', function(o){
//        		copy.push(o);
//        	});
//        	db.on('insert', function(o){
//        		db.tag(o.year, o);
//        	});
//        	db.importDB(items);
//        });
//       
//        it('should copy all the inserted elements', function() {
//            db.db.should.eql(copy);
//        });
//
//        it('should add a tag for each inserted element', function() {
//        	J.size(db.tags).should.eql(items.length);
//            db.tags['1863'].should.eql({
//                 painter: "Manet",
//                 title: "Olympia",
//                 year: 1863
//            });
//        });
//
//    });
    
    describe('#on(\'update\') ',function() {
    	before(function() {
        	copy = [];
        	db.clear(true);
        	db.on('update', function(o){
        		copy.push(o);
        	});
        	db.on('update', function(o){
        		db.tag(o.year, o);
        	});        	
        	db.importDB(items);
        	
        	db.selexec('painter', '=', 'Jesus').update({comment: "Was he a painter !?"});

        });
       
        it('copy should have length 1', function() {
           copy.length.should.be.eql(1);
        });

        it('should add a tag for each updated element', function() {
        	J.size(db.tags).should.eql(1);
            db.tags['0'].should.eql({ 
            	painter: 'Jesus',
            	title: 'Tea in the desert',
            	year: 0,
            	comment: 'Was he a painter !?' 
            });
        });

    });
    
//    describe('#on(\'remove\') ',function() {
//    	before(function() {
//        	copy = [];
//        	db.clear(true);
//        	db.on('remove', function(o){
//        		copy = o;
//        	});
//        	db.importDB(items);
//        	db.remove('year');
//        });
//       
//        it('should copy all the inserted elements', function() {
//            items.should.eql(copy);
//        });
//
//    });
    



});



