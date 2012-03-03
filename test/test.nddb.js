var util = require('util'),
    should = require('should');
    
exports.JSUS = require('JSUS').JSUS; // NDDB requires that JSUS gets exported by this module.

var NDDB = require('./../nddb').NDDB;
var db = new NDDB();
    
describe('NDDB:', function(){
    
    describe('An empty database', function(){
        it('should return size 0 when querying an empty DB', function(){
            db.size().should.equal(0);
        });
    });
    
    describe('Insert an object', function(){
        before(function(){
            db.insert({
                painter: "Picasso",
                title: "Les Demoiselles d'Avignon",
                year: 1907
            });
        });
        it('should return size 1 after having inserted an object', function(){
            db.size().should.equal(1);
        });
        after(function(){
            db = new NDDB();
        });
    });
    
    describe('Insert a collection of object', function(){
        before(function(){
            var items = [
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
                }
            ];
            
            db.import(items);
        });
        it('should return size 5 after having imported an object collection', function(){
            db.size().should.equal(5);
        });
        it('should select all painting from Dali', function(){
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
           db = new NDDB(); 
        });
    });
});