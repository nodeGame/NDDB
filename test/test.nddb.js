var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;
    var db = new NDDB();
    
describe('NDDB', function(){  
  describe('empty NDDB', function(){
    it('should return length 0 when instantiating an empty DB', function(){
      db.size().should.equal(0);
    });
  });
  
  describe('filled NDDB', function(){
    before(function(){
      // insert a single object
      db.insert({'name':'foobar'});
    });
    it('should return length 1 when inserting an object', function(){
      db.size().should.equal(1);
    });
  });
});