// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];

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

describe('NDDB Basic Operations:', function() {
    
	var element = {
	        painter: "Picasso",
	        title: "Les Demoiselles d'Avignon",
	        year: 1907
	};
	
    describe('An empty database', function(){
        it('should return size 0 when querying an empty DB', function(){
            db.size().should.equal(0);
        });
    });
    
    describe('Insert an object', function(){
        before(function(){
            db.insert(element);
        });
        it('should return size 1 after having inserted an object', function(){
            db.size().should.equal(1);
        });
    });
    
    describe('Get current element', function(){
        it('should return the previously inserted element', function(){
        	db.get().should.equal(element);
        });
      });
      
	  describe('get next element', function(){
	    it('should return false when there is only one element', function(){
	    	db.next().should.equal(false);
	    });
	  });
	  
	  describe('get previous element', function(){
	    it('should return false when there is only one element', function(){
	    	db.previous().should.equal(false);
	    });
	  });
	  
	  describe('get unexisting element (index out of bound)', function(){
	    it('should return false', function(){
	    	db.get(1).should.equal(false);
	    });
	  });
	    
	  describe('clearing the database', function() {
	  	before(function(){
	  	    db.clear(true);
	  	});
	  	it('should return length 0', function() {
	    	db.size().should.equal(0);
	    });
	  });
	  
	  describe('Insert a collection of object', function(){
	        before(function(){
	            db.import(items);
	        });
	        it('should return size 5 after having imported an object collection', function(){
	            db.size().should.equal(5);
	        });
	    });
	    
});

describe('Iterator', function() {
	describe('calling first()', function(){
	    it(' should return the first element of the inserted collection', function(){
	        db.first().should.equal(items[0]);
	    });
	});
	
	describe('calling last()', function(){
	    it(' should return the last element of the inserted collection', function(){
	        db.last().should.equal(items[4]);
	    });
	});
});

describe('NDDB sorting', function(){

	
	  describe('Default sorting', function() {
		  
        it('should not change the order of the elements (it sorts by nddbid)', function(){
       	  db.first().should.equal(items[0]);
       	});
       });
	         
	         //console.log('Default sort');
	         //var out = nddb.sort();
	         //console.log(out.toString());
	         //
	         //
	         //console.log('Reverse');
	         //out = nddb.reverse();
	         //console.log(out.toString());
	         //
	         //console.log('Sort by Player');
	         //nddb.sort('player');
	         //console.log(out.toString());
	         //
	         //console.log('Sort by State');
	         //out = nddb.sort('state');
	         //console.log(out.toString());
	         //
	         //console.log('Sort by Key');
	         //out = nddb.sort('key');
	         //console.log(out.toString());

	         //console.log('Get by value');
	         //out = nddb.sort('value');
	         //console.log(out.toString());

	       //  console.log('Select Key');
	       //  out = nddb.select('key','=','x');
	       //  console.log(out.toString());

	         //console.log('Select !Key');
	         //out = nddb.select('key','!=','x');
	         //console.log(out.toString());
	         //
	         //console.log('Select State');
	         //out = nddb.select('state','>', new GameState({state: 1}));
	         //console.log(out.toString());

	         //console.log('Join State');
	         //out = nddb.join('state','state', 'joined');
	         //console.log(out.fetch());

	         //console.log('Join State Selective');
	         //out = nddb.join('state','state', 'joined', ['key']);
	         ////console.log(out.fetch());
	         //
	         //console.log('Get First');
	         //console.log(out.first());
	         //
	         //console.log('Get Last');
	         //console.log(out.last());
	         //
	         //console.log('Limit 1');
	         //console.log(out.limit(1));
	         //
	         //console.log('Limit -1');
	         //console.log(out.limit(-1));

	         //nddb.clear(true);
	         //console.log(nddb.fetch());

	        
	    	// TODO add another element to test nddb_pointer
	    	//    it('should reset nddb_pointer to 0', function(){
	    	//   	db.nddb_pointer.should.equal(0);
	    	//    });

	
	
});



describe('Selecting', function() {
//	 it('should select all painting from Dali', function(){
//         db.select('painter', '=', 'Dali').db.length.should.equal(2); 
//      });
//      it('should select all portraits', function(){
//          db.select('portrait').db.length.should.equal(1);
//      });
//      it('should select all paintings from Dali that are from before 1928', function(){
//         db.select('painter', '=', 'Dali').select('year', '<', 1928).db.length.should.equal(1); 
//      });
//      it('should select all painting of the beginning of the XX centuries', function(){
//         db.select('year', '><', [1900, 1910]).db.length.should.equal(1); 
//      });
//      after(function(){
//         db = new NDDB(); 
//      });
});

//describe('default sort', function() {
// 	 before(function(){
// 		 
// 		
// 		 
// 		  // Simulates
// 		  for (var i=0;i<clients.length;i++) {
// 		  	for (var j=0;j<states.length;j++) {
// 		  		for (var x=0;x<ids.length;x++) {
// 		  			var gb = {
// 		  					player: clients[i],
// 		  					key: ids[x],
// 		  					value: Math.random(0,1),
// 		  					state: {state:states[j]},
// 		  			};
// 		  			
// 		  			db.insert(gb);
// 		  		}
// 		  	}
// 		  }
// 		 db.sort('player');
// 	});
// 	it('should sort all elements alphabetically ASC', function(){
// 	  db.db[1].player.should.equal(clients[0]);
// 	});
// });
   
   //console.log('Default sort');
   //var out = nddb.sort();
   //console.log(out.toString());
   //
   //
   //console.log('Reverse');
   //out = nddb.reverse();
   //console.log(out.toString());
   //
   //console.log('Sort by Player');
   //nddb.sort('player');
   //console.log(out.toString());
   //
   //console.log('Sort by State');
   //out = nddb.sort('state');
   //console.log(out.toString());
   //
   //console.log('Sort by Key');
   //out = nddb.sort('key');
   //console.log(out.toString());

   //console.log('Get by value');
   //out = nddb.sort('value');
   //console.log(out.toString());

 //  console.log('Select Key');
 //  out = nddb.select('key','=','x');
 //  console.log(out.toString());

   //console.log('Select !Key');
   //out = nddb.select('key','!=','x');
   //console.log(out.toString());
   //
   //console.log('Select State');
   //out = nddb.select('state','>', new GameState({state: 1}));
   //console.log(out.toString());

   //console.log('Join State');
   //out = nddb.join('state','state', 'joined');
   //console.log(out.fetch());

   //console.log('Join State Selective');
   //out = nddb.join('state','state', 'joined', ['key']);
   ////console.log(out.fetch());
   //
   //console.log('Get First');
   //console.log(out.first());
   //
   //console.log('Get Last');
   //console.log(out.last());
   //
   //console.log('Limit 1');
   //console.log(out.limit(1));
   //
   //console.log('Limit -1');
   //console.log(out.limit(-1));

   //nddb.clear(true);
   //console.log(nddb.fetch());


