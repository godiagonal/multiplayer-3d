var express = require('express');
var path = require('path');
var PlayerList = require('./classes/playerList.js');
var Player = require('./classes/player.js');
var MessageList = require('./classes/messageList.js');
var Message = require('./classes/message.js');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index', {
        title: '3D Multiplayer Demo'
    });
});

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

var sio = require('socket.io').listen(server);

var players = new PlayerList();
var messages = new MessageList();

sio.sockets.on('connection', function (socket) {

    // when new client has loaded the page
    socket.on('checkSession', function (cookieId) {
        // client has cookie
        if (cookieId.length !== 0) {
            var player = players.find(cookieId);

            // player already exists, init old session
            if (player !== null) {
                // assign the player object to the current socket
                socket.set('player', player);

                // send the player object back to the client
                socket.emit('initSelf', player.clientFormat());

                // notify other clients of the new player
                socket.broadcast.emit('newPlayer', newPlayer.clientFormat());
            } else {
                // ask for a new username
                socket.emit('checkSessionCallback', {});
            }
        } else {
            // ask for a new username
            socket.emit('checkSessionCallback', {});
        }

    });

    // when new client has chosen a name
    socket.on('initNewSession', function (name) {
        // create new player object
        var newPlayer = new Player(socket.id, name);

        // add player to player list
        players.add(newPlayer);

        // assign the player object to the current socket
        socket.set('player', newPlayer);

        // send the player object back to the client
        socket.emit('initSelf', newPlayer.clientFormat());

        // send a welcome message to the client
        socket.emit('serverResponse', {
            type: 'success',
            text: 'Welcome ' + name + '!'
        });

        // notify other clients of the new player
        socket.broadcast.emit('newPlayer', newPlayer.clientFormat());
    });

    // when new client has loaded self and world
    socket.on('initOthers', function () {
        socket.get('player', function (err, player) {
            //send array containing all players (except the recieving player)
            socket.emit('initOthersCallback', sio.sockets.getAllPlayers(player));
        });
    });

    // when player moves
    socket.on('updatePlayer', function (data) {
        var player = players.find(data.id);

        if (player !== null) {
            // update the player object on the server
            player.setPos(data.pos);
            player.setRotation(data.rotation);

            // notify other clients of the update
            socket.broadcast.emit('updatePlayer', player.clientFormat());
        }
    });

    // when user sends message
    socket.on('sendMessage', function (message) {
        socket.get('player', function (err, player) {
            if (player !== null) {
                // check if command
                if (message.substring(0, 1) === '/') {
                    // run command
                    socket.readCommand(message);
                }

                // normal message
                else if (message.length <= 200) {
                    // create new message object
                    var newMessage = new Message(message, player);

                    // add message to message list
                    messages.add(newMessage);

                    // send message to all clients (including sender)
                    sio.sockets.emit('newMessage', newMessage);
                } else {
                    socket.emit('serverResponse', {
                        type: 'error',
                        text: 'The message is too long'
                    });
                }
            }
        });
    });

    // when client disconnects
    socket.on('disconnect', function () {
        socket.get('player', function (err, player) {
            if (player !== null) {
                // remove player from player list
                players.remove(player);

                // notify other clients of the disconnected player
                sio.sockets.emit('removePlayer', player.clientFormat());
            }
        });
    });


    // route commands to the correct function
    socket.readCommand = function (str) {
        // [0] = command
        // [1] = argument
        var cmd = str.split(' ');

        // command is not valid
        if (cmd.length > 2) {
            socket.emit('serverResponse', {
                type: 'error',
                text: '"' + str + '" is not a valid command (type "/help" for a list of valid commands)'
            });
            return;
        }

        switch (cmd[0]) {
        case '/':
        case '/help':
            socket.helpResponse();
            break;

        case '/name':
            socket.changePlayerName(cmd[1]);
            break;

        default: // command not found
            socket.emit('serverResponse', {
                type: 'error',
                text: '"' + str + '" is not a valid command (type "/help" for a list of valid commands)'
            });
            break;
        }
    }

    socket.helpResponse = function () {
        socket.emit('serverResponse', {
            type: 'success',
            text: 'Type "/name" to change name'
        });
    }

    socket.changePlayerName = function (newName) {
        // cancel if invalid name
        if (!validName(newName)) {
            socket.emit('serverResponse', {
                type: 'error',
                text: '"' + newName + '" is not a valid name'
            });
            return;
        }

        socket.get('player', function (err, player) {
            if (player !== null) {
                // change name of player object
                player.name = newName;

                // notify all clients of the new name (including sender)
                sio.sockets.emit('updatePlayerName', player.clientFormat());
            }
        });
    }

});

// check if valid name
var validName = function (name) {
    if (name == 'Server')
        return false;
    else
        return true;
}

sio.sockets.getAllPlayers = function (exclude) {
    var playerObjects = [];

    for (var socketId in this.sockets) {
        this.sockets[socketId].get('player', function (err, player) {
            if (player !== exclude && player !== null)
                playerObjects.push(player.clientFormat());
        });
    }

    return playerObjects;
}