// Requiring and exporting JSUS
var JSUS = require('./../node_modules/JSUS').JSUS;
module.exports.JSUS = JSUS;

var util = require('util'),
fs = require('fs'),
path = require('path'),
should = require('should'),
NDDB = require('./../index').NDDB;

var db = new NDDB();

var filename = __dirname + '/data.csv';

describe('#loadCSV()', function(){

    it('should load a csv file with default options', function() {

        db.load(filename, function() {
            db.size().should.eql(4);
            db.last().should.be.eql({
                A: "10",
                B: "11",
                C: "12",
                D: "Z4"
            });

        });

    });

});



// END STRESS
//}
