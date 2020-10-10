// Generated by CoffeeScript 2.5.1
(function() {
  var app, com, config, dolaczGracza, exec, express, fs, help, http, incon, info, io, log, mineflayer, odlaczGracza, opn, players, port, restoreWorld, saveWorld, server, socketInfo, stop, term, world;

  fs = require("fs");

  opn = require("opn");

  http = require("http");

  server = http.createServer();

  io = require("socket.io")(server);

  express = require('express');

  app = express();

  term = require('terminal-kit').terminal;

  mineflayer = require('mineflayer');

  exec = function(cmd) {
    exec = require('child_process').exec;
    return new Promise(function(resolve, reject) {
      exec(cmd, function(error, stdout, stderr) {
        if (error) {
          console.warn(error);
        }
        resolve(stdout != null ? stdout : {
          stdout: stderr
        });
      });
    });
  };

  config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

  port = config["express-port"];

  app.use(express.static(__dirname + "/../client/"));

  app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-store');
    return next();
  });

  app.get("/websocket/", function(req, res) {
    return res.send(String(config["websocket-port"]));
  });

  app.get("/host/", function(req, res) {
    return res.send(String(config["host"]));
  });

  app.listen(port);

  world = {};

  saveWorld = function() {
    return fs.writeFileSync(__dirname + "/savedWorld.json", JSON.stringify(world));
  };

  restoreWorld = function() {
    return world = JSON.parse(fs.readFileSync(__dirname + '/savedWorld.json'));
  };

  restoreWorld();

  players = {};

  socketInfo = {};

  io.sockets.on("connection", function(socket) {
    socket.emit("firstLoad", world);
    socket.on("initClient", function(data) {
      socketInfo[socket.id] = data;
      return dolaczGracza(socket.id);
    });
    socket.on("playerUpdate", function(data) {
      players[socket.id] = data;
      return io.sockets.emit("playerUpdate", players);
    });
    socket.on("blockUpdate", function(block) {
      world[`${block[0]}:${block[1]}:${block[2]}`] = block[3];
      if (block[3] === 0) {
        delete world[`${block[0]}:${block[1]}:${block[2]}`];
      }
      io.sockets.emit("blockUpdate", block);
      return saveWorld();
    });
    return socket.on("disconnect", function() {
      odlaczGracza(socket.id);
      delete players[socket.id];
      return delete socketInfo[socket.id];
    });
  });

  server.listen(config["websocket-port"]);

  term.windowTitle("web-minecraft console");

  term.clear();

  term.green(fs.readFileSync(__dirname + '/../src/asciiLogo'));

  log = function(message) {
    term(`\n${message}\n`);
  };

  stop = function() {
    term.brightGreen("\nServer stopped!\n");
    process.exit();
  };

  help = function() {
    term.brightGreen("\n help\t- pomoc\n stop\t- zatrzymanie serwera\n open\t- uruchomienie przeglądarki pod adresem serwera\n copen\t- uruchamianie gry w przeglądarce chrome w wersji 'app'\n list\t- wypisuje wszystkich aktywnych użytkowników\n clear\t- czyści consolę\n info\t- wypisuje informacje o serwerze\n");
  };

  info = function() {
    term("\n");
    term.table([["Typ serwera", "Adres serwera"], ["Serwer websocket", `${config.host}:${config["websocket-port"]}`], ["Serwer express", `${config.host}:${config["express-port"]}`], ["Serwer minecraftowy", `${config.realServer.ip}:${config.realServer.port}`]], {
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: 'lightRounded',
      borderAttr: {
        color: 'blue'
      },
      textAttr: {
        bgColor: 'default'
      },
      firstRowTextAttr: {
        bgColor: 'blue'
      },
      width: 60,
      fit: true
    });
  };

  com = function(command) {
    if (command === "stop") {
      stop();
    } else if (command === "help" || command === "?") {
      help();
    } else if (command === "clear") {
      term.clear();
    } else if (command === "list") {
      Object.keys(socketInfo).forEach(function(p) {
        return term(`\n${p} (${socketInfo[p].nick})`);
      });
    } else if (command === "open") {
      opn(`http://${config["host"]}:${config["express-port"]}`);
    } else if (command === "copen") {
      exec(`google-chrome --app=http://${config["host"]}:${config["express-port"]}`);
    } else if (command === "info") {
      info();
    } else if (command !== "") {
      term.red("\nNieznana komenda. Użyj 'help' lub '?' aby uzyskać pomoc.");
    }
    incon();
  };

  incon = function() {
    term.green("\nserver> ");
    return term.inputField({
      autoComplete: ['help', 'stop', '?', 'open', 'clear', 'info', 'list', 'copen'],
      autoCompleteHint: true,
      autoCompleteMenu: true
    }, function(er, input) {
      com(input);
    });
  };

  term.on('key', function(name, matches, data) {
    if (name === 'CTRL_C') {
      stop();
    }
  });

  info();

  incon();

  dolaczGracza = function(socketid) {
    socketInfo[socketid].bot = mineflayer.createBot({
      host: config.realServer.ip,
      port: config.realServer.port,
      username: socketInfo[socketid].nick
    });
    socketInfo[socketid].bot._client.on("map_chunk", function(data) {
      io.to(socketid).emit("mapChunk", data);
    });
    socketInfo[socketid].bot.on('chat', function(username, message) {
      if (username === socketInfo[socketid].bot.username) {
        return;
      }
      socketInfo[socketid].bot.chat(message);
    });
  };

  odlaczGracza = function(socketid) {
    socketInfo[socketid].bot.end();
  };

}).call(this);