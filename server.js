const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {serveClient: false});
const {BOARD_SIZE, SOCKET_CONSTANTS} = require('./game/constants');
const GameManager = require('./game_manager');

const COMMANDS = {
    TRADE: 0,
    BUILD: 1,
    DEVELOPMENT_CARD: 2
}

const BUILDING_TYPES = {
    ROAD: 0,
    SETTLEMENT: 1,
    CITY: 2
}

const FOUR_PLAYER_SETTLEMENT_LOCATIONS = [];
const SIX_PLAYER_SETTLEMENT_LOCATIONS = [];
const FOUR_PLAYER_ROAD_LOCATIONS = [];
const SIX_PLAYER_ROAD_LOCATIONS = []; 

class Resources {
    constructor(wheat,wood,sheep,brick,stone) {
        this.wheat = wheat;
        this.wood = wood;
        this.sheep = sheep;
        this.brick = brick;
        this.stone = stone;
    }
}

class TradeParam {
    constructor(initiator, partner, give, take) {
        this.initiator = initiator;
        this.partner = partner;
        this.give = give;
        this.take = take;
        // if (give instanceof Resources) {
            
        // } else {
        //     throw new Error('Give in Trade Param is not instance of Resource');
        // }
        // if (take instanceof Resources) {
            
        // } else {
        //     throw new Error('Take in Trade Param is not instance of Resource');
        // }
    }
}

class BuildParam {
    constructor(initiator, buildingType, location) {
        this.initiator = initiator;
        this.buildingType = buildingType;
        this.location = location;
    }
}

class DevelopmentCardParam {
    constructor(initiator) {
        this.initiator = initiator;
    }
}

class Command {
    constructor(commandType, param) {
        // switch(commandType) {
        //     case COMMANDS.TRADE:
        //         if (!(param instanceof TradeParam)) {
        //             throw new Error('Trade param must be instanceof TradeParam');
        //         }
        //         break;
        //     case COMMANDS.BUILD:
        //         if (!(param instanceof TradeParam)) {
        //             throw new Error('Build param must be instanceof BuildParam');
        //         }
        //         break;
        //     case COMMANDS.DEVELOPMENT_CARD:
        //         if (!(param instanceof TradeParam)) {
        //             throw new Error('Development card param must be instanceof TradeParam');
        //         }
        //         break;
        //     default:
        //         throw new Error('Unknown Command with id ' + commandType);
        // }
        this.commandType = commandType;
        this.param = param;
    }
}
app.use(function (req, res, next) {
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === undefined || req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.get('/', (req, res) => {
    console.log('hi');
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
        console.log(callback);
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