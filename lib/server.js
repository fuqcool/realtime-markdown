'use strict';

var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var mustache = require('mustache');
var io = require('socket.io').listen(5277);
io.set('log level', 1);

var defaultDir = process.cwd();

var markdown = function (req, res, next) {
  if (req.url.match(/.*\.md/)) {
    console.log('request', req.url);

    var filePath = path.join(defaultDir, req.url);
    io.of(req.url).on('connection', mdserver(filePath));

    fs.readFile(__dirname + '/../lib/viewer.html', function (err, content) {
      res.writeHead(200);
      res.end(content.toString().replace('{{ url }}', req.url));
    });
  } else {
    next();
  }
};

var mdserver = function (targetPath, options) {
  return function (socket) {
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
      watcher.close();
    });

    watcherHandler('change', targetPath);
  }
};

module.exports = markdown;
