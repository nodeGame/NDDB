
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
    
    describe('#current()', function() {

	it('should return the current element (first item)', function() {
	    db.current().should.equal(items[1]);
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
	
	it('should make current() to return the last element of the collection', function() {
	    db.current().should.equal(items[(items.length-1)]);
	});
	
	it('should move nddb_pointer to 4', function() {
    	    db.nddb_pointer.should.equal((items.length-1));
    	});
	
	it('should make current() equivalent to last()', function() {
	    db.current().should.equal(db.last());
	});
	
    });
    
    describe('#next() when we are already at the last position of the db', function() {
	it('should return false', function() {
	    (typeof db.next()).should.equal('undefined');
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
	
	it('should make current() to return the last element of the collection', function() {
	    db.current().should.equal(items[0]);
	});
	
	it('should move nddb_pointer to 0', function() {
    	    db.nddb_pointer.should.equal(0);
    	});
	
	it('should make current() equivalent to first()', function() {
	    db.current().should.equal(db.first());
	});
	
    });
    
    describe('#previous() when we are already at the last position of the db', function() {
	it('should return false', function() {
	    (typeof db.previous()).should.equal('undefined');
	});
    });
    
    before(function(){
    	db.clear(true);
       	db = new NDDB(); 
       	db.importDB(items);
    });	
});

