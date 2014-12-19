var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB,
    JSUS = require('JSUS').JSUS;

var db = new NDDB();

var select = null;

var items = [
    {
	painter: "Jesus",
	title: "Tea in the desert",
	year: 0,
    },
    {
        painter: "Dali",
        title: ["Portrait of Paul Eluard", "Das Rätsel der Begierde", "Das finstere Spiel oder Unheilvolles Spiel"],
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
        title: {en: "Water Lilies", de: "Wasser Lilies"},
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

db.importDB(items);

describe('NDDB Like operator', function() {
    

    describe('sensitive',function() {
        it('should select all paintings from Manet and Monet and Dali\'s Barcelonese Mannequien', function(){
            db.select('*', 'LIKE', '%M%')
                .execute().db.length.should.equal(4); 
        });
        it('should select all paintings from Manet and Monet', function(){
            db.select('*', 'LIKE', 'M%')
                .execute().db.length.should.equal(3);
        });
        it('should select all paintings from Manet and Monet (painter select)', function(){
            db.select('painter', 'LIKE', '%M%')
                .execute().db.length.should.equal(3);
        });
        it('should select all paintings from Manet and Monet', function(){
            db.select('title', 'LIKE', 'T%')
                .execute().db.length.should.equal(1);
        });
        it('should select all paintings from Manet and Monet', function(){
            db.select('painter', 'LIKE', 'M_net')
                .execute().db.length.should.equal(3);
        });

        it('selecting LIKE M_NET should return nothing (case sensitive)', function() {
            db.select('painter', 'LIKE', 'M_NET')
           	.fetch().length.should.equal(0); 
        });
       
    });

    describe('insensitive', function() {
        it('selecting LIKE M_NET should return all Manet and Monet', function() {
            db.select('painter', 'iLIKE', 'M_NET')
           	.fetch().length.should.equal(3); 
        });
        it('should select all paintings', function(){
            db.select('*', 'iLIKE', '%e%')
                .execute().db.length.should.equal(6); 
        });
        it('should select all paintings, but Dali\'s Barcelonese Mannequien', function(){
            db.select(['painter', 'portrait'], 'iLIKE', '%e%')
                .execute().db.length.should.equal(5); 
        });
    });
});
