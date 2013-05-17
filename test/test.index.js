//// Requiring and exporting JSUS
//var JSUS = require('./../node_modules/JSUS').JSUS;
//module.exports.JSUS = JSUS;
//
//var util = require('util'),
//    should = require('should'),
//    NDDB = require('./../nddb').NDDB;
//
//var db = new NDDB();
//
//var clients = ['a','b','c','d'];
//var states = [1,2,3,4];
//var ids = ['z','x'];//['z','x','c','v'];
//
//var indexable = [
//			 {
//				 id: 1,
//				 painter: "Jesus",
//				 title: "Tea in the desert",
//				 year: 0,
//			 },
//             {
//				 id: 2,
//                 painter: "Dali",
//                 title: "Portrait of Paul Eluard",
//                 year: 1929,
//                 portrait: true
//             },
//             {
//            	 id: 3,
//                 painter: "Dali",
//                 title: "Barcelonese Mannequin",
//                 year: 1927
//             },
//             {
//            	 id: 4,
//                 painter: "Monet",
//                 title: "Water Lilies",
//                 year: 1906
//             },
//             {
//            	 id: 5,
//                 painter: "Monet",
//                 title: "Wheatstacks (End of Summer)",
//                 year: 1891
//             },
//             {
//            	 id: 6,
//                 painter: "Manet",
//                 title: "Olympia",
//                 year: 1863
//             },
//                          
//];
//
//var not_indexable = [
//                    {
//                    	car: "Ferrari",
//                    	model: "F10",
//                    	speed: 350,
//                    },
//                    {
//                    	car: "Fiat",
//                    	model: "500",
//                    	speed: 100,
//                    },
//                    {
//                    	car: "BMW",
//                    	model: "Z4",
//                    	speed: 250,
//                    },
//];
//
//var nitems = indexable.length + not_indexable.length;
//
//
//var element = {
//        painter: "Picasso",
//        title: "Les Demoiselles d'Avignon",
//        year: 1907
//};
//
//
//var indexPainter = function(o) {
//	if (!o) return undefined;
//	return o.id;
//}
//
//
//db.i('painter', indexPainter);
////db.i('foo_painter', indexPainter);
//
//db.init({update:
//			{
//			indexes: true,
//			}
//});
//
//
//describe('NDDB Indexing Operations:', function() {
//    
//	describe('Importing not-indexable items', function() {
//    	before(function(){
//    		db.importDB(not_indexable);
//    	});
//    	
//        it('should not create the special indexes', function() {
//        	db.painter.should.not.exist;
//            db.length.should.eql(not_indexable.length);
//        });
//    });
//	
//	
//    describe('Importing indexable items', function() {
//    	before(function(){
//    		db.importDB(indexable);
//    	});
//    	
//        it('should create the special indexes', function() {
//            db.painter.should.exist;
//            JSUS.size(db.painter).should.be.eql(indexable.length);
//        });
//        
//    });
//	
//    describe('Elements updated in the db should be updated in the indexes', function() {
//    	before(function(){
//    		var j = db.select('painter', '=', 'Jesus').first();
//    		j.painter = 'JSUS';
//    	});
//    	
//    	
//    	it('updated property \'painter\' should be reflected in the index', function() {
//    		//db.painter[0].painter.should.be.eql('JSUS');
//        });
//    });
//    
//    describe('Elements updated in the index should be updated in the db', function() {
//    	before(function(){
//    		db.painter[5].painter = 'M.A.N.E.T.';
//    	});
//
//    	it('updated property \'painter\' should be reflected in the index', function() {
//    		db.select('painter', '=', 'M.A.N.E.T.').length.should.be.eql(1);
//        });
//    });
//    
//});
//
//
//
//
