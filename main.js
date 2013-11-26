var http = require('http');
var socket = require('socket.io');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var program = require('commander');

program.parse(process.argv);

var filePath = null;

if (program.args.length) {
  filePath = program.args[0];
  fs.exists(filePath, function (exists) {
    if (!exists) {
      console.log(filePath + ' does not exists');
      process.exit();
    }
  });
} else {
  console.log('invalid options');
  process.exit();
}

var server = http.createServer(serverHandler);
var io = socket.listen(server);
server.listen(5277);

var VIEWER = 'viewer.html';

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

io.sockets.on('connection', function (socket) {
  function watcherHandler(event, filename) {
    shell.exec('Markdown.pl ' + filename, { silent: true }, function (code, output) {
      if (event === 'change') {
        console.log(filename + ' updated');
        if (code !== 0) {
          console.log('render markdown error\n', output);
          return;
        }

        socket.emit('update', output);
      }
    });
  };

  var watcher = fs.watch(filePath, watcherHandler);

  socket.on('disconnect', function () {
    console.log('disconnected');
    watcher.close();
    process.exit();
  });

  watcherHandler('change', filePath);
});
