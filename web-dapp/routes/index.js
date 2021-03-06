'use strict';

var logger = require('../logger');
var express = require('express');
var fs = require('fs');

module.exports = function (opts) {
    var router = express.Router();
    var files = fs.readdirSync(__dirname).filter(f => f !== 'index.js' && f[0] !== '_');

    logger.log('Found ' + files.length + ' route(s): ' + JSON.stringify(files));
    for (let f of files) {
        router.use('/', require('./' + f)(opts) );
    }

    return router;
};
