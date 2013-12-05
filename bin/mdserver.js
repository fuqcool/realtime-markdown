#!/usr/bin/env node

'use strict';

var fs = require('fs');
var connect = require('connect');
var path = require('path');

var markdown = require('../lib/server.js');

var defaultDir = process.cwd();

var app = connect()
  .use(markdown)
  .use(connect.static(defaultDir))
  .use(connect.directory(defaultDir));

var server = require('http').createServer(app);

server.listen(8000);

