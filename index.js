const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const {BOARD_SIZE} = require('./game/constants');
const Board = require('./game/Board');
const board = new Board(BOARD_SIZE.SIZE_6_PLAYERS);

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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/game.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log('listening on *:8080');
});