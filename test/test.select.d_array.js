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
    { a: 100, b: 2, c: -1, d: 0},
    { a: 100, c: 100, d: 0},
    { z: 9, y: 8, x: 7}
];


db.importDB(items);

describe('NDDB Selecting []', function() {
    describe('#select simple',function() {
        it('should select all items with fields a or c == 100', function(){
            db.select(['a','c'], '=', 100)
                .execute().db.length.should.equal(3);
        });
        it('should select all items with fields a,b, or z in set (9,2,1)', function(){
            db.select(['a','b','z'], 'in', [9,2,1])
                .execute().db.length.should.equal(6);
        });
        it('should select all items with fields a,b, or z not in set (9,2,1)', function(){
            db.select(['a','b','z'], '!in', [9,2,1])
                .execute().db.length.should.equal(1);
        });

        it('should select all items with a fields b or c between -2 and 4', function(){
            db.select(['b','c'], '><', [-2,4])
                .execute().db.length.should.equal(5);
        });
        it('should select all items with field "a" greater or equal 3', function(){
            db.select(['a'], '>=', 3)
                .execute().db.length.should.equal(3);
        });
    });


    describe('#select up to three conditions',function() {
        
        it('should select all items with a fields a or b = 1, and y and d = 0', function(){
            db.select(['a','b'], '=', 1)
                .and(['y','d'], '=', 0)
                .execute().db.length.should.equal(2); 
        });
        
        it('should select all items with fields a or b *not* in set (3;10) and fields y or d *not* in set (8;4).,', function(){
            db.select(['a','b'], '!in', [3, 10])
                .and(['y','d'], '!in', [8, 4])
          	.execute().db.length.should.equal(5); 
        });

        
        it('should select items with fields a or b = 1 or fields y or d = 0.,', function(){
            db.select(['a','b'], '=', 1)
                .or(['y','d'], '=', 0)
                .execute().db.length.should.equal(5); 
        });
        
        it('should select all items with a,b or c greater or equal 0 or x,z, or k equal 8, and d greater than 0', function(){
            db.select(['a','b','c'], '>=', 0)
                .or(['x','z', 'k'], '=', 8)
                .and('d', '>', 0)
                .execute()
                .db.length.should.equal(2); 
        });
        
    });  
    
    describe('#select more than 3 conditions',function() {
        before(function(){
            db.insert({f: 1000, g: 2000});
            db.insert({f: 500, g: 1000, h: 1500});
        });
        
        it('should select all items with a,r,m =< 3, or f =< 500, and any field different from 100, and b smaller than 4 or bigger than 10', function(){
            db.select(['a','r','m'], '<=', 3)
                .or(['f'], '<=', 500)
                .and('*', '!in', [100])
                .or('b', '<>', [4,10])
                .execute()
                .db.length.should.equal(6); 
        });
        
    });  
    
});
