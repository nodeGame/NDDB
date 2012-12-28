
var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();



var o = {
		a: 1,
		b: "a",
		c: null,
		d: undefined,
		e: function() { console.log('foo'); }
};

describe('NDDB exists', function(){
	before(function(){
		db.insert(o);
	});
	
    it('should find an object', function(){
    	db.exists(o).should.be.true;
    });  

    it('should NOT find an object', function(){
    	db.exists({a:1}).should.be.false;
    });
});


