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
require('./lib/fs.js');
// Static needs the format to be loaded already.
require('./lib/static.js');


// Cycle/Decycle
require('./external/cycle.js');
