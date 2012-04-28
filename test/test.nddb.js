// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var db = new NDDB();

var element = {'name':'foobar'};

var clients = ['a','b','c','d'];
var states = [1,2,3,4];
var ids = ['z','x'];//['z','x','c','v'];


    
describe('NDDB', function() {  
  describe('empty NDDB', function(){
    it('should return length 0 when instantiating an empty DB', function(){
      db.size().should.equal(0);
    });
  });
  
  describe('filled NDDB', function(){
    before(function(){
      // insert a single object
      db.insert(element);
    });
    it('should return length 1 after inserting an object', function(){
      db.size().should.equal(1);
    });
  });
  
  describe('get current element NDDB', function(){
    it('should return the previously inserted element', function(){
    	db.get().should.equal(element);
    });
  });
  
  describe('get next element NDDB', function(){
    it('should return false when there is only one element', function(){
    	db.next().should.equal(false);
    });
  });
  
  describe('get previous element NDDB', function(){
    it('should return false when there is only one element', function(){
    	db.previous().should.equal(false);
    });
  });
  
  describe('get unexisting element (index out of bound) NDDB', function(){
    it('should return false', function(){
    	db.get(1).should.equal(false);
    });
  });
  
  // TODO add another element to test nddb_pointer
  
  describe('clearing the database NDDB', function(){
	before(function(){
	    db.clear(true);
	});
	it('should return length 0', function(){
    	db.size().should.equal(0);
    });
    it('should reset nddb_pointer to 0', function(){
    	db.nddb_pointer.should.equal(0);
    });
  });
  
}); 
  


 describe('default sort', function() {
	 before(function(){
		 
		
		 
		  // Simulates
		  for (var i=0;i<clients.length;i++) {
		  	for (var j=0;j<states.length;j++) {
		  		for (var x=0;x<ids.length;x++) {
		  			var gb = {
		  					player: clients[i],
		  					key: ids[x],
		  					value: Math.random(0,1),
		  					state: {state:states[j]},
		  			};
		  			
		  			db.insert(gb);
		  		}
		  	}
		  }
		 db.sort('player');
	});
	it('should sort all elements alphabetically ASC', function(){
	  db.db[1].player.should.equal(clients[0]);
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


