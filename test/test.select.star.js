var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB,
    JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;

var items = [
    { a: 1, b: 2, c: 3, d: 100}, 
    { a: 1, b: 2, c: 3, d: 0},
    { a: 3, b: 2, c: 3, d: 100},
    { a: 1, b: 2, c: 100, d: 0}, 
    { a: 100, b: 2, c: -1, d: 0}
];


db.importDB(items);

describe('NDDB Selecting *', function() {
    describe('#select simple',function() {
        it('should select all items with a field == 100', function(){
            db.select('*', '=', 100)
                .execute().db.length.should.equal(items.length-1);
        });
        it('should select all items with a field > 99', function(){
            db.select('*', '>', 99)
                .execute().db.length.should.equal(items.length-1);
        });
        it('should select all items with a field between 2 and 4', function(){
            db.select('*', '><', [2,4])
                .execute().db.length.should.equal(items.length-2);
        });
        it('should select all items with a field in set (1;3)', function(){
            db.select('*', 'in', [1,3])
                .execute().db.length.should.equal(4);
        });
        it('should select all items with no field equal -1 or 100', function(){
            db.select('*', '!in', [-1,100])
                .execute().db.length.should.equal(1);
        });
        it('should select all items with no field equal 100', function(){
            db.select('*', '!in', [100])
                .execute().db.length.should.equal(1);
        });
    });


    describe('#select up to three conditions',function() {
        
        it('should select all items with a field = 3, and a field = 0', function(){
            db.select('*', '=', 3)
                .and('*', '=', 100)
                .execute().db.length.should.equal(2); 
        });
        
        it('should select all items with at least one non-zero field, and one non-(-1) field', function(){
            db.select('*', '!in', [0])
            	.and('*', '!in', [-1])
            	.execute().db.length.should.equal(2); 
        });

        
        it('should select items with a field = -1, or field = 0', function(){
             db.select('*', '=', -1)
                .or('*', '=', 0)
                .execute().db.length.should.equal(3); 
         });
        
        it('should select all items with a negative number, or a 0, but not a 100', function(){
            db.select('*', '<', 0)
              .or('*', '=', 0)
              .and('*', '!in', [100])
              .execute()
              .db.length.should.equal(1); 
         });
     
    });  

     describe('#select more than 3 conditions',function() {
         before(function(){
             db.insert({f: 1000, g: 2000});
             db.insert({f: 500, g: 1000, h: 1500});
         });
        
        it('should select all items with a negative number, or a 0, but not a 10, or have and f field', function(){
            db.select('*', '<', 0)
                .or('*', '=', 0)
                .and('*', '!in', [100])
                .or('f')
              .execute()
              .db.length.should.equal(3); 
        });
     
    });  
    
});
