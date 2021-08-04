/**
 * # NDDB: N-Dimensional Database
 * Copyright(c) 2021 Stefano Balietti
 * MIT Licensed
 */
const NDDB = require('./nddb.js');
NDDB.lineBreak = require('os').EOL;
module.exports = NDDB;

const path = require('path');

// Lib
require(path.resolve('lib', 'static.js'));
require(path.resolve('lib', 'util.js'));
require(path.resolve('lib', 'fs.js'));

// Cycle/Decycle
require(path.resolve('external', 'cycle.js'));
