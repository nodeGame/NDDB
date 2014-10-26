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




describe('Updating NDDB', function() {
    before(function() {
        db.importDB(items);
    });

    describe('#update()',function() {


        it('should add an \'old\' tag on old paintings',function() {

            db.select('year', '<', 1900)
              .execute()
              .update({old: true});

            db.select('old').execute().db.length.should.be.eql(3);
        });
    });
});



