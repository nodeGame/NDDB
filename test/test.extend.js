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




describe('Extending NDDB', function() {
    before(function() {
        db.importDB(items);
    });

    describe('#addFilter()',function() {
    	
        it('should return all entries whose year is multiple of 2',function() {
            db.addFilter('%', function(d, value, comparator){
            	return function(elem) {
            	    if ((elem[d] % value) === 0) {
            		return elem;
            	    }
            	}
            });
            
            db.select('year', '%', 2)
                .execute()
                .db.length.should.be.equal(2);
        });
    });
});



