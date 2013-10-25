var http = require('http');
var socket = require('socket.io');
var fs = require('fs');
var shell = require('shelljs');

var server = http.createServer(handler);
var io = socket.listen(server);
server.listen(5277);

var FILE_NAME = 'README';
var VIEWER = 'viewer.html';

function handler(req, res) {
  fs.readFile(__dirname + '/' + VIEWER, function (err, data) {
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  var watcher = fs.watch(FILE_NAME, function (event, filename) {
    if (event === 'change') {
      console.log(filename + ' updated');
      var page = shell.exec('kramdown README').output;

      socket.emit('update', page);
    }
  });

  socket.on('disconnect', function () {
    console.log('disconnected');
    process.exit();
  });
});
