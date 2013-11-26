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

var server = http.createServer(handler);
var io = socket.listen(server);
server.listen(5277);

var VIEWER = 'viewer.html';

function handler(req, res) {
  fs.readFile(path.join(__dirname, VIEWER), function (err, view) {
    if (err) {
      console.log('failed to open viewer');
      process.exit();
    }

    render(filePath, function (content) {
      var output = view.toString().replace(/{{\s*content\s*}}/g, content);
      res.writeHead(200);
      res.end(output);
    });
  });
}

function render(filename, cb) {
  shell.exec('Markdown.pl ' + filename, { silent: true }, function (code, output) {
    if (code !== 0) {
      console.log('render markdown error\n', output);
      return;
    }

    cb(output);
  });
}

io.sockets.on('connection', function (socket) {
  var watcher = fs.watch(filePath, function (event, filename) {
    if (event === 'change') {
      console.log(filename + ' updated');

      render(filename, function (output) {
        socket.emit('update', output);
      });
    }
  });

  socket.on('disconnect', function () {
    console.log('disconnected');
    watcher.close();
    process.exit();
  });
});
