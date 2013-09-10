
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
            var s = db.db[1]; // 0-indexed
            s.should.have.property('painter', 'Dali');
            s.should.have.property('title', 'Barcelonese Mannequin');
        });
        
        it('should have Monet\'s Wheatstacks (End of Summer) last', function() {
            var l = db.last();
            l.should.have.property('painter', 'Monet');
            l.should.have.property('title', 'Wheatstacks (End of Summer)');
        });
    });

    before(function(){
        db.clear(true);
        db = new NDDB(); 
        db.importDB(items);
    });
    
});


