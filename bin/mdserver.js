#!/usr/bin/env node

'use strict';

var fs = require('fs');
var program = require('commander');

var mdserver = require('../lib/server.js');

program.parse(process.argv);

var targetPath = null;

if (program.args.length) {
  targetPath = program.args[0];
  fs.exists(targetPath, function (exists) {
    if (!exists) {
      console.log(targetPath + ' does not exists');
      process.exit();
    }
  });
} else {
  console.log('invalid options');
  process.exit();
}

mdserver(targetPath);
