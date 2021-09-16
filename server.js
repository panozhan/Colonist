const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {serveClient: false});
const {BOARD_SIZE, SOCKET_CONSTANTS} = require('./game/constants');
const GameManager = require('./game_manager');

app.use(function (req, res, next) {
    if (process.env.NODE_ENV === undefined || req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dist/index.html');
});

app.use('/dist', express.static(__dirname  + '/dist'));

const allActiveGames = new Map([['alex fake test game', {}]]);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on(SOCKET_CONSTANTS.CREATE_GAME, (data, callback) => {
        console.log('new game: ' + data.gameName);
        if (allActiveGames.has(data.gameName)) {
            callback({success: 0});
        } else {
            const manager = new GameManager(BOARD_SIZE.SIZE_6_PLAYERS, data.username, socket);
            allActiveGames.set(data.gameName, manager);
            callback({
                success: 1,
                data: manager.getBoardRepresentation()
            });
        } 
    });

    socket.on(SOCKET_CONSTANTS.JOIN_GAME, (data, callback) => {
        console.log('Server join game: ', data.gameName, data.username);
        const manager = allActiveGames.get(data.gameName);
        manager.addPlayerToGame(data.username, socket);
        callback({success:1, data: manager.getBoardRepresentation()});
        if (manager.readyToStart()) {
            manager.start();
        }
    });

    socket.emit(SOCKET_CONSTANTS.EXISTING_GAMES, Array.from(allActiveGames.keys()));
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log('listening on *:8080');
});