const {Board, Tile, Node, PlayerHand, Edge} = require('./game/Board');
const {BOARD_SIZE, RESOURCE_ID, SOCKET_CONSTANTS} = require('./game/constants');
const { TradeParam } = require('./game/network');
const prettyjson = require('prettyjson');


function generateTiles(boardSize) {
    const numTiles = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 19 : 30;
    const result = new Array(numTiles);
    const fourPlayerProducer = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,11,3];
    const sixPlayerProducer = [2,5,4,6,3,9,8,11,11,10,6,3,8,4,8,10,11,12,10,5,4,9,5,9,12,6,2,3];
    const fourPlayerProducerOrder = [0,1,2,6,11,15,18,17,16,12,7,3,4,5,10,14,13,8,9];
    const sixPlayerProducerOrder = [0,1,2,6,11,17,22,26,29,28,27,23,18,12,7,3,4,5,10,16,21,25,24,19,13,8,9,15,20,14];
    const resourceChoice = [RESOURCE_ID.FOREST, RESOURCE_ID.SHEEP, RESOURCE_ID.WHEAT, RESOURCE_ID.BRICK, RESOURCE_ID.ROCK, RESOURCE_ID.DESERT]
    const maxResources = new Map([
        [RESOURCE_ID.FOREST, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
        [RESOURCE_ID.SHEEP, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
        [RESOURCE_ID.WHEAT, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
        [RESOURCE_ID.BRICK, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 3 : 5],
        [RESOURCE_ID.ROCK, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 3 : 5],
        [RESOURCE_ID.DESERT, boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 1 : 2],
    ]);
    const resourceGenerated = new Map([
        [RESOURCE_ID.FOREST, 0],
        [RESOURCE_ID.SHEEP, 0],
        [RESOURCE_ID.WHEAT, 0],
        [RESOURCE_ID.BRICK, 0],
        [RESOURCE_ID.ROCK, 0],
        [RESOURCE_ID.DESERT, 0],
    ]);
    let desertPlaced = 0;
    for (let i = 0; i < numTiles; ++i) {
        const randomNumber = Math.floor(Math.random() * resourceChoice.length);
        const choice = resourceChoice[randomNumber];
        let id;
        let producer = 0;
        if (this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS) {
            id = fourPlayerProducerOrder[i];
            if (choice !== RESOURCE_ID.DESERT){
                producer = fourPlayerProducer[i - desertPlaced];
            } else {
                desertPlaced++;
            }
        } else {
            id = sixPlayerProducerOrder[i];
            if (choice !== RESOURCE_ID.DESERT) {
                producer = sixPlayerProducer[i - desertPlaced];
            } else {
                desertPlaced++;
            }
        }
        result[id] = new Tile(id, producer, choice);
        console.log('tile', id, producer);
        resourceGenerated.set(choice, resourceGenerated.get(choice) + 1);
        if (resourceGenerated.get(choice) === maxResources.get(choice)) {
            resourceChoice.splice(randomNumber, 1);
        }
    }
    return result;
}

function generateNodes(boardSize) {
    const nodeCount = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
    const widestRow = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 6 : 7;
    const result = new Map();
    result.set(0, new Node(0, [3, 4], boardSize));
    result.set(1, new Node(1, [4, 5], boardSize));
    result.set(2, new Node(2, [5, 6], boardSize));
    let total = 3; // The total number of nodes already generated
    let cLast = 3; // The number of nodes in the last row
    let cNow = 4; // The number of nodes in the current row
    let increasing = true;
    while (total !== nodeCount) { 
        for (let i = 0; i < cNow; ++i) {
            const id = total;
            const connectedTo = [];
            if (cLast === cNow) {
                if (increasing) {
                    connectedTo.push(id + cNow);
                    connectedTo.push(id + cNow + 1);
                    connectedTo.push(id - cLast);
                } else {
                    connectedTo.push(id - cLast);
                    if (i !== 0) {
                        connectedTo.push(id + cNow - 1);
                    }
                    if (i !== cNow - 1) {
                        connectedTo.push(id + cNow);                            
                    }
                }
                
            } else {
                if (increasing) {
                    connectedTo.push(id + cNow);
                    if (i !== 0) {
                        connectedTo.push(id - cLast - 1);
                    }
                    if (i !== cNow - 1) {
                        connectedTo.push(id - cLast);
                    }
                } else {
                    // Last row doesn't have anymore bottom pointing edges
                    if (cNow !== 3) {
                        connectedTo.push(id + cNow);
                    }
                    connectedTo.push(id - cNow);
                    connectedTo.push(id - cNow - 1);
                }
            }
            result.set(id, new Node(id, connectedTo, boardSize));
            total++;
        }
        if (cLast === cNow) {
            if (increasing) {
                cNow++;
            } else {
                cNow--;
            }
        } else {
            cLast = cNow;
            if (cNow === widestRow) {
                increasing = false;
            }
        }
    }
    return result;
}

class Player {
    constructor(name, socket) {
        this.name = name;
        this.socket = socket;
        this.hand = new PlayerHand();
    }
}

let activeTradePartner = undefined;
let activeTradeInitiator = undefined;
let tradeAckCallback = undefined;
let activeTradeParams = undefined;

class GameManager {
    constructor(playerCount, creatorName, creatorSocket) {
        this.board_ = new Board();
        
        this.players_ = [];
        this.socketIdToPlayerName_ = new Map();
        this.playerNameToSocketId_ = new Map();
        
        this.boardSize_ = playerCount <= 4 ? BOARD_SIZE.SIZE_4_PLAYERS : BOARD_SIZE.SIZE_6_PLAYERS;
        this.playerCount_ = playerCount;

        this.board_.setNodes(generateNodes(this.boardSize_));
        this.board_.setTiles(generateTiles(this.boardSize_));
        
        this.started_ = false;
        this.addPlayerToGame(creatorName, creatorSocket);
    }

    isStarted() {
        return this.started_;
    }

    start() {
        if (this.started_) {
            return;
        }
        this.started_ = true;
        this.players_.forEach(player => {
            const otherPlayers = this.players_.map(p => p.creatorName);
            otherPlayers.splice(otherPlayers.indexOf(player.name), 1);
            console.log('broadcast start: ', player.name, otherPlayers);
            player.socket.emit(SOCKET_CONSTANTS.START_GAME, otherPlayers);
        });
    }

    // For now, lets just set the order as players that joined - add randomness later.
    getBuildOrder() {
        return this.players_.map(p => p.socket);
    }

    readyToStart() {
        this.players_.length === this.playerCount;
    }

    addPlayerToGame(name, socket) {
        this.players_.push(new Player(name, socket));
        this.socketIdToPlayerName_.set(socket.id, name);
        this.playerNameToSocketId_.set(name, socket.id);
        console.log('Added Trade');
        
        socket.on(SOCKET_CONSTANTS.TRADE, (data, callback) => {
            console.log(`${name} wants to trade with: ${data.partner}`);
            activeTradeParams = new TradeParam(data);
            activeTradePartner = this.players_.find(p => p.name === data.partner);
            activeTradeInitiator = this.players_.find(p => p.name === name);
            tradeAckCallback = callback;
            if (activeTradePartner.hand.contains(activeTradeParams.takeHand()) &&
                activeTradeInitiator.hand.contains(activeTradeParams.giveHand())) {
                activeTradePartner.socket.emit(SOCKET_CONSTANTS.TRADE_REQUEST, data);
            } else {                    
                callback({accept: 0});
            }
        });
        socket.on(SOCKET_CONSTANTS.DECIDE_TRADE, (data, callback) => {
            console.log(`${name} has ${data.accept === 1? 'accepted' : 'rejected'} trade with ${activeTradeInitiator.name}`);
            if (data.accept === 1) {
                activeTradePartner.hand.detract(activeTradeParams.takeHand());
                activeTradePartner.hand.change(activeTradeParams.giveHand());
                activeTradeInitiator.hand.detract(activeTradeParams.giveHand());
                activeTradeInitiator.hand.change(activeTradeParams.takeHand());
                console.log('------------------- AFTER TRADE -----------------------');
                console.log(JSON.stringify(activeTradeInitiator.hand));
                console.log(JSON.stringify(activeTradePartner.hand));
                tradeAckCallback({accept: 1});
            } else {
                tradeAckCallback({accept: 0});
            }
            callback();
            activeTradePartner = undefined;
            activeTradeInitiator = undefined;
            tradeAckCallback = undefined;
        });
    }

    getBoardRepresentation() {
        return this.board_.serialize();
    }
}

module.exports = GameManager;