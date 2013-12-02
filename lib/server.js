'use strict';

var http = require('http');
var socket = require('socket.io');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var program = require('commander');

var VIEWER = 'viewer.html';


var mdserver = function (targetPath, options) {
  console.log('it works');
  var server = http.createServer(serverHandler);
  var io = socket.listen(server);
  io.set('log level', 1);

  server.listen(5277);
  io.sockets.on('connection', connectionHandler);


  function serverHandler(req, res) {
    fs.readFile(path.join(__dirname, VIEWER), function (err, view) {
      if (err) {
        console.log('failed to open viewer');
        process.exit();
      }

      res.writeHead(200);
      res.end(view);
    });
  }

  function connectionHandler(socket) {
    function watcherHandler(event, filename) {
      shell.exec('kramdown ' + targetPath, { silent: true }, function (code, output) {
        if (event === 'change') {
          if (code !== 0) {
            console.log('render markdown error\n', output);
            return;
          }

          socket.emit('update', output);
        }
      });
    };

    var watcher = fs.watch(targetPath, watcherHandler);

    socket.on('disconnect', function () {
      console.log('disconnected');
      watcher.close();
      process.exit();
    });

    watcherHandler('change', targetPath);
  }
};

module.exports = mdserver;
