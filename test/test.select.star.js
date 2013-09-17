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
    describe('#select * simple',function() {
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
    });
});
