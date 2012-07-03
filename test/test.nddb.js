// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

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


describe('NDDB Basic Operations:', function() {
    
	var element = {
	        painter: "Picasso",
	        title: "Les Demoiselles d'Avignon",
	        year: 1907
	};
	
    describe('An empty database', function() {
        it('should return size 0 when querying an empty DB', function() {
            db.length.should.equal(0);
        });
    });
    
    describe('An empty database', function() {
        it('should return size 0 when querying an empty DB', function() {
            db.length.should.equal(0);
        });
    });
    
    describe('#insert()', function() {
        before(function() {
            db.insert(element);
        });
        it('should return size 1 after having inserted an object', function() {
            db.length.should.equal(1);
        });
    });
    
    describe('#get()', function() {
        it('should return the previously inserted element', function() {
        	db.get().should.equal(element);
        });
      });
      
	  describe('#next()', function() {
	    it('should return false when there is only one element', function() {
	    	db.next().should.equal(false);
	    });
	  });
	  
	  describe('#previous()', function() {
	    it('should return false when there is only one element', function() {
	    	db.previous().should.equal(false);
	    });
	  });
	  
	  describe('get unexisting element (index out of bound)', function() {
	    it('should return false', function(){
	    	db.get(1).should.equal(false);
	    });
	  });
	    
	  describe('clearing the database', function() {
	  	before(function(){
	  	    db.clear(true);
	  	});
	  	it('should return length 0', function() {
	    	db.length.should.equal(0);
	    });
	  });
	  
	  describe('Insert a collection of object', function() {
	        before(function() {
	            db.import(items);
	        });
	        it('should return size 6 after having imported an object collection', function() {
	            db.length.should.equal(items.length);
	        });
	    });
	    
	after(function(){
		db.clear(true);
		db = new NDDB(); 
		db.import(items);
	});
});

describe('NDDB Iterator', function() {
	
	describe('#last()', function() {
	    it('should return the last element of the previously inserted collection', function() {
	        db.last().should.equal(items[(items.length-1)]);
	    });
	    
	    it('should move nddb_pointer to 4', function() {
    		db.nddb_pointer.should.equal((items.length-1));
    	});
	});
	
	describe('#first()', function() {
	    it('should return the first element of the inserted collection', function() {
	        db.first().should.equal(items[0]);
	    });
	    
    	it('should reset nddb_pointer to 0', function() {
    		db.nddb_pointer.should.equal(0);
    	});
	});
	
	describe('#next()', function() {
	    it('should return the next element in the database', function() {
	        db.next().should.equal(items[1]);
	    });
	    
    	it('should move nddb_pointer to 1', function() {
    		db.nddb_pointer.should.equal(1);
    	});
	});
	
	describe('#get()', function() {

		it('should return the current element (nddbid = 1)', function() {
	        db.get().should.equal(items[1]);
	    });
	    
    	it('the returned element should have nddbid equal to 1', function() {
    		db.get().nddbid.should.equal(1);
    	});
	});
	
	describe('calling 4 times next() in a row', function() {
		
		before(function() {
			db.next();
			db.next();
			db.next();
		});
		
	    it('should return the last element of the collection', function() {
	    	db.next().should.equal(items[(items.length-1)]);
	    });
	    
	    it('should make get() to return the last element of the collection', function() {
	    	db.get().should.equal(items[(items.length-1)]);
	    });
	    
	    it('should move nddb_pointer to 4', function() {
    		db.nddb_pointer.should.equal((items.length-1));
    	});
	    
	    it('should make get() equivalent to last()', function() {
	    	db.get().should.equal(db.last());
	    });
	    
	});
	
	describe('#next() when we are already at the last position of the db', function() {
		it('should return false', function() {
			 db.next().should.equal(false);
		});
	});
	
	describe('#previous() when we are already at the last position of the db', function() {
		it('should return false', function() {
			 db.previous().should.equal(items[(items.length-2)]);
		});
		
		it('should move nddb_pointer to 3', function() {
    		db.nddb_pointer.should.equal((items.length-2));
    	});
	});
	
	describe('calling 4 times previous() in a row', function() {
		
		before(function() {
			db.previous();
			db.previous();
			db.previous();
		})
		
	    it('should return the first element of the collection', function() {
	    	db.previous().should.equal(items[0]);
	    });
	    
	    it('should make get() to return the last element of the collection', function() {
	    	db.get().should.equal(items[0]);
	    });
	    
	    it('should move nddb_pointer to 0', function() {
    		db.nddb_pointer.should.equal(0);
    	});
	    
	    it('should make get() equivalent to first()', function() {
	    	db.get().should.equal(db.first());
	    });
	    
	});
	
	describe('#previous() when we are already at the last position of the db', function() {
		it('should return false', function() {
			 db.previous().should.equal(false);
		});
	});
	
    after(function(){
    	db.clear(true);
       	db = new NDDB(); 
       	db.import(items);
    });	
});


describe('NDDB Sorting', function(){

	describe('#sort()', function() {  
		it('should not change the order of the elements (it sorts by nddbid)', function(){
			db.sort().first().should.equal(items[0]);
			db.last().should.equal(items[(items.length-1)]);
       	});
		
	});
	  
	describe('#reverse()', function() {  
		it('should reverse the order of the elements (it sorts by nddbid)', function(){
			db.reverse().first().should.equal(items[(items.length-1)]);
			db.last().should.equal(items[0]);
		});
   	});
	         
	describe('#sort(\'year\')', function() {  
		it('should have Jesus first', function() {
			db.sort('year');
			var f = db.first();
			f.should.have.property('painter', 'Jesus');
			f.should.have.property('year', 0);
		});
		
		it('should have Dali\'s Portrait of Paul Eluard last', function() {
			var l = db.last();
			l.should.have.property('painter', 'Dali');
			l.should.have.property('title', 'Portrait of Paul Eluard');
		});
   	});  
	
	describe('#sort(\'title\')', function() {  
		it('should have Dali\'s Barcelonese Mannequin first', function() {
			db.sort('title');
			var f = db.first();
			f.should.have.property('painter', 'Dali');
			f.should.have.property('title', 'Barcelonese Mannequin');
		});
		
		it('should have Monet\'s Wheatstacks (End of Summer) last', function() {
			var l = db.last();
			l.should.have.property('painter', 'Monet');
			l.should.have.property('title', 'Wheatstacks (End of Summer)');
		});
   	});
	
	describe('#sort([\'painter\', \'portrait\'])', function() {  
		it('should have Dali\'s Portrait of Paul Eluard first', function() {
			db.sort(['painter', 'portrait']);		
			
			var f = db.first();
			f.should.have.property('painter', 'Dali');
			f.should.have.property('title', 'Portrait of Paul Eluard');
		});
		
		it('should have Dali\'s Barcelonese Mannequin second', function() {
			var s = db.get(1); // 0-indexed
			s.should.have.property('painter', 'Dali');
			s.should.have.property('title', 'Barcelonese Mannequin');
		});
		
		it('should have Monet\'s Wheatstacks (End of Summer) last', function() {
			var l = db.last();
			l.should.have.property('painter', 'Monet');
			l.should.have.property('title', 'Wheatstacks (End of Summer)');
		});
   	});

    after(function(){
    	db.clear(true);
       	db = new NDDB(); 
       	db.import(items);
    });
	
});


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



describe('NDDB Custom callbacks', function() {
	//map, forEach, filter

});

describe('NDDB Deletion', function() {
	//delete, clear
	    	console.log(db.select("*"));


	it('should delete only all Dali paintings', function(){
		db.delete('painter', '=', 'Dali');

       	db.select('painter', '=', 'Dali').db.length.should.equal(0);
       	db.select('painter', '=', 'Jesus').db.length.should.equal(1);
    });


    it('should clear db', function(){
		db.clear(true);

       	db.select('portrait').db.length.should.equal(0);
    });

	after(function(){
		db.clear(true);
       	db = new NDDB(); 
       	db.import(items);
    });


});


describe('NDDB Advanced Operation', function() {
	//split*, join, concat
	
});


describe('NDDB Fetching', function() {
	//fetch, fetchArray, fetchKeyArray
	
});



describe('NDDB Statistics Operator', function() {
	//count, max, min, mean

});



describe('NDDB Diff', function() {
	//diff, intersect
	
});

describe('NDDB Tagging', function() {
	//tag
	
});



