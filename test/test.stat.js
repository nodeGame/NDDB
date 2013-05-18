var util = require('util'),
    should = require('should'),
    NDDB = require('./../nddb').NDDB;

var nddb = new NDDB();

var clients = ['a','b','c','d'];
var states = [1,2,3,4,5,6,7];
var ids = ['z','x'];//['z','x','c','v'];

for (var i=0;i<clients.length;i++) {
    for (var j=0;j<states.length;j++) {
        for (var x=0;x<ids.length;x++) {
            nddb.insert({
                player: clients[i],
                key: ids[x],
                value: Math.random(0,1),
                state: {state:states[j]},
            });
        }
    }
}

describe('Testing native NDDB statistics', function(){

    describe('#count()', function() {
        before(function() {

        });

        it('should be 56',function() {
            nddb.count().should.be.eql(56);
        });
    });

    describe('#sum()', function() {
        before(function() {

        });

        it('of all states should be 224',function() {
            nddb.sum('state.state').should.be.eql(224);
        });
    });


    describe('#mean()', function(){

        it('the mean should be equal to 4', function(){
            nddb.mean('state.state').should.equal(4);
        });

    });

    describe('#max()', function(){

        it('the max should be equal to 7', function(){
            nddb.max('state.state').should.equal(states[(states.length-1)]);
        });

    });

    describe('#min()', function(){

        it('the max should be equal to 1', function(){
            nddb.min('state.state').should.equal(states[0]);
        });

    });

});