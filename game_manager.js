const {Board, Tile, Node, PlayerHand, Edge} = require('./game/Board');
const {BOARD_SIZE, RESOURCE_ID, SOCKET_CONSTANTS, BUILD_TYPES} = require('./game/constants');
const EventEmitter = require('events');

function generateTiles(boardSize) {
    const numTiles = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 19 : 30;
    const result = new Array(numTiles);
    const fourPlayerProducer = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,11,3];
    const sixPlayerProducer = [2,5,4,6,3,9,8,11,11,10,6,3,8,4,8,10,11,12,10,5,4,9,5,9,12,6,2,3];
    const fourPlayerProducerOrder = [.20,1,2,6,11,15,18,17,16,12,7,3,4,5,10,14,13,8,9];
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

function generatePorts() {
    const options = [RESOURCE_ID.WOOD_PORT, RESOURCE_ID.ANY_PORT, RESOURCE_ID.WHEAT_PORT, RESOURCE_ID.ANY_PORT, 
        RESOURCE_ID.ROCK_PORT, RESOURCE_ID.ANY_PORT, RESOURCE_ID.BRICK_PORT, RESOURCE_ID.ANY_PORT, RESOURCE_ID.SHEEP_PORT];
    const result = [];
    while (options.length !== 0) {
        const choice = Math.floor(Math.random() * options.length);
        result.push(options[choice]);
        options.splice(choice, 1);
    }
    return result;
}

class Player {
    constructor(id, name, socket) {
        this.id = id;
        this.name = name;
        this.socket = socket;
        this.hand = new PlayerHand();
    }
}

let activeTradePartner = undefined;
let activeTradeInitiator = undefined;
let tradeAckCallback = undefined;
let activeTradeParams = undefined;

class AcknowledgeTracker extends EventEmitter {
    constructor(players) {
        super();
        // list of player ids
        this.players = players;
        // Map <int,bool>
        this.tracker = new Map(players.map(p => [p, false]));
        // counter for number of acknowledges received
        this.counter = 0;
    }

    acknowledge(playerId) {
        if (this.tracker.get(playerId)) {
            return;
        }
        this.tracker.set(playerId, true);
        this.counter++;
        if (this.counter === this.players.length) {
            this.emit('complete');
        }
    }
};

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
        this.board_.setPorts(generatePorts());
        
        this.started_ = false;
        this.addPlayerToGame(creatorName, creatorSocket);

        // Map<Int, Boolean>
        this.acknowledgeTracker = new Map();
        this.turnEnder = new EventEmitter();
        this.gameQueue = [];
    }

    start() {
        const ack = new AcknowledgeTracker(this.players_);
        ack.on('complete', this.startGameLoop.bind(this));
        this.players_.forEach(player => {
            const otherPlayers = this.players_.map(p => p.name);
            otherPlayers.splice(otherPlayers.indexOf(player.name), 1);
            console.log('broadcast start: ', player.name, otherPlayers);
            player.socket.emit(SOCKET_CONSTANTS.START_GAME, {playerId: player.id, otherPlayerNames: otherPlayers},
                () => {
                    console.log(`player ${player.name} acknowledged`)
                    ack.acknowledge(player.id);
                });
        });
    }

    async startGameLoop() {
        console.log('starting game loop');
        const turnOrder = [];
        const set = new Set();
        for (let i = 0; i < this.players_.length; ++i) {
            let randomNum = Math.floor((this.players_.length - i) * Math.random());
            while (set.has(randomNum)) {
                randomNum++;
            }
            turnOrder.push(this.players_[randomNum]);
            set.add(randomNum);
        }
        for (let i = 0; i < turnOrder.length; ++i) {
            await this.tellPlayerToBuild(turnOrder[i]);
        }
        this.board_.recordBuiltSettlements = true;
        for (let i = turnOrder.length - 1; i >= 0; --i) {
            await this.tellPlayerToBuild(turnOrder[i]);
        }
        this.board_.recordBuiltSettlements = false;

        const initialHand = this.board_.calculateInitialHand();
        initialHand.forEach((resources, player) => {
            console.log('telling player ', player, 'to take', resources.join(' '));
            this.players_[player].socket.emit(SOCKET_CONSTANTS.TELL_TAKE_CARDS, resources);
        });
        let playerTurn = 0;
        while (this.board_.getVictoriousPlayer() === undefined) {
            const diceRollResult = Math.floor(6 * Math.random()) + Math.floor(6 * Math.random()) + 2;
            if (diceRollResult === 7) {

            } else {
                
            }
            turnOrder[playerTurn].socket.emit(SOCKET_CONSTANTS.TELL_TURN_START)
            await new Promise(resolve => {
                this.turnEnder.on('end-turn', id => {
                    if (id === turnOrder[playerTurn].id)  {
                        playerTurn++;
                        resolve();
                    }
                });
            }) 
        }
    }

    // tells a player to build a settlement and a road
    async tellPlayerToBuild(player) {
        return new Promise(resolve => {
            player.socket.emit(SOCKET_CONSTANTS.TELL_BUILD_SETTLEMENT, undefined, async (data) => {
                console.log(`received player ${player.id}'s settlement location: ${data}`);
                await this.notifyBuilt(player.id, BUILD_TYPES.SETTLEMENT, data);
                player.socket.emit(SOCKET_CONSTANTS.TELL_BUILD_ROAD, undefined, async (data) => {
                    console.log(`received player ${player.id}'s road location: ${data}`);
                    await this.notifyBuilt(player.id, BUILD_TYPES.ROAD, data);
                    resolve();
                });
            });
        });
    }

    /**
     * 
     * @param {number} playerId 
     * @param {BUILD_TYPES} buildType 
     * @param {number | string} coordinate string if it's a road, otherwise number 
     */
    notifyBuilt(playerId, buildType, coordinate) {
        const otherPlayers = this.players_.map(p => p.id);
        otherPlayers.splice(otherPlayers.indexOf(playerId), 1);
        const ack = new AcknowledgeTracker(otherPlayers);
        const promise = new Promise(resolve => {
            ack.on('complete', () => {
                switch (buildType) {
                    case BUILD_TYPES.ROAD:
                        this.board_.buildRoad(playerId, coordinate.split(',').map(e => parseInt(e)));
                        break;
                    case BUILD_TYPES.SETTLEMENT:
                        this.board_.buildSettlement(playerId, coordinate);
                        break;
                    case BUILD_TYPES.CITY:
                        this.board_.buildCity(playerId, coordinate);
                        break;
                }
                console.log('ack completed resolving notify build');
                resolve();
            });
        });
        otherPlayers.forEach(id => {
            const player = this.players_.find(p => p.id === id);
            player.socket.emit(SOCKET_CONSTANTS.NOTIFY_BUILD, {id: playerId, type: buildType, coordinate: coordinate}, () => {
                console.log(`player with ${player.id} acknowledged the build action by player ${playerId}`);
                ack.acknowledge(id);
            });
        });
        return promise;
    }

    finishGame() {
        this.players_.forEach(player => {
            player.socket.disconnect(true);
        });
    }

    // For now, lets just set the order as players that joined - add randomness later.
    getBuildOrder() {
        return this.players_.map(p => p.socket);
    }

    readyToStart() {
        // TODO: After testing, fix this
        return this.players_.length === 2;
    }

    addPlayerToGame(name, socket) {
        this.players_.push(new Player(this.players_.length, name, socket));
        this.socketIdToPlayerName_.set(socket.id, name);
        this.playerNameToSocketId_.set(name, socket.id);
        
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
                activeTradePartner.hand.add(activeTradeParams.giveHand());
                activeTradeInitiator.hand.detract(activeTradeParams.giveHand());
                activeTradeInitiator.hand.add(activeTradeParams.takeHand());
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
        socket.on(SOCKET_CONSTANTS.BUILD, (data, callback) => {
            console.log('build received', data);
            callback({success: 1});
        });
        socket.on(SOCKET_CONSTANTS.END_TURN, () => {
            this.turnEnder.emit('end-turn', this.players_.length);
        });
    }

    getBoardRepresentation() {
        return this.board_.serialize();
    }
}

module.exports = GameManager;