
var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();


describe('NDDB Inserting', function(){
	beforeEach(function(){
		db.clear(true);
	});
	
    
    it('number', function(){
    	db.insert(1);
    	db.length.should.be.eql(0);
    });  

    it('string', function(){
    	db.insert('foo');
    	db.length.should.be.eql(0);
    });
    
    it('NaN', function(){
    	db.insert(NaN);
    	db.length.should.be.eql(0);
    });
    
    it('Infinity', function(){
    	db.insert(Infinity);
    	db.length.should.be.eql(0);
    });
    
});


