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




describe('NDDB Tagging', function() {
    before(function() {
        db.importDB(items);
    });

    describe('#tag() #resolveTag()',function() {
        describe('a pre-selected entry (args: tagname)', function() {
            it('should return the entry number 5',function() {
                db.last();
                db.tag('someone');
                db.resolveTag('someone').should.eql(items[5]);
            });
            
            it('should return the entry number 4',function() {
                db.previous();
                db.tag('a other one');
                db.resolveTag('a other one').should.eql(items[4]);
            });

            it('should return the correct position after db.sort(year)',function() {
                var sortedDb = db.sort('year');
                sortedDb.resolveTag('someone').should.eql({painter: "Manet",title: "Olympia",year: 1863});
            });

        });

        describe('a specific entry (args: tagname,key)', function() {
            it('should return the entry number 3',function() {
                db.tag('the secret one', 3);
                db.resolveTag('the secret one').should.eql(items[3]);
            });
        });

        describe('the count of tags',function() {
            it('should return the count of made tags',function() {
                Object.keys(db.tags).length.should.eql(3);
            });
        });
        
        describe('tagging and other operations',function() {
            it('tag should not change with sorting',function() {
            	var tagged = db.tag('someone');
                db.reverse();
                db.resolveTag('someone').should.be.eql(tagged);
                db.reverse();
                db.resolveTag('someone').should.be.eql(tagged);
            });
            it('tag should not change with shuffling',function() {
            	var tagged = db.tag('someone');
                db.shuffle();
                db.resolveTag('someone').should.be.eql(tagged);
            });
            it('tag should change with update',function() {
            	db.sort('year');
            	var tagged = db.tag('someone', 0);
            	db.selexec('painter','=','Jesus').update({painter: 'JSUS'});
                db.resolveTag('someone').should.be.eql(tagged);
            });
        });
        
    });
    



});



