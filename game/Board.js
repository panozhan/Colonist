const e = require('express');
const {BOARD_SIZE, PLAYER_ID, EDGE_STATE, RESOURCE_ID} = require('./constants');
const prettyjson = require('prettyjson');

class Edge {
    constructor(nodeOneId, nodeTwoId) {
        this.nodeOneId = nodeOneId;
        this.nodeTwoId = nodeTwoId;
        this.state = EDGE_STATE.FREE;
    }
};

class Node {
    constructor(id, connectsTo) {
        this.id = id;
        this.belongsTo_ = undefined;
        this.isCity = false;
        this.edges = [];
        connectsTo.forEach(e => {
            this.edges.push(new Edge(id, e));
        });
    }

    isTaken() {
        return this.belongsTo_ === undefined;
    }

    // Returns the player id that this node belongs to.
    // If it's not taken, return undefined
    settlementBelongsTo() {
        if (this.isTaken()) {
            return this.belongsTo_;
        }
        return undefined;
    }

    isCity() {  
        return this.isCity_;
    }
};

class Tile {
    constructor(id, producer, resource) {
        this.id = id;
        this.producer = producer;
        this.resource = resource;
        this.robberHere = resource === RESOURCE_ID.DESERT;
    }
}

class Board {
    constructor(size) {
        if (size !== BOARD_SIZE.SIZE_4_PLAYERS && size !== BOARD_SIZE.SIZE_6_PLAYERS) {
            throw new Error('Incorrect size passed into board constructor: ' + size);
        }
        this.boardSize_ = size;
        this.generateNodes();
        this.generateTiles();
        if (!process.env.NODE_ENV) {
            this.debug();
        }
    }

    generateNodes() {
        this.nodeCount_ = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
        const widestRow = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 6 : 7;
        // Generate Map
        this.nodes_ = new Map();
        this.nodes_.set(0, new Node(0, [3, 4]));
        this.nodes_.set(1, new Node(1, [4, 5]));
        this.nodes_.set(2, new Node(2, [5, 6]));
        let total = 3; // The total number of nodes already generated
        let cLast = 3; // The number of nodes in the last row
        let cNow = 4; // The number of nodes in the current row
        let increasing = true;
        while (total !== this.nodeCount_) { 
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
                this.nodes_.set(id, new Node(id, connectedTo));
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
    }

    serialize() {
        return JSON.stringify({
            nodes: Array.from(this.nodes_.entries()),
            tiles: this.tiles_,
        });
    }

    generateTiles() {
        const numTiles = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 19 : 30;
        this.tiles_ = new Array(numTiles);
        const fourPlayerProducer = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,11,3];
        const sixPlayerProducer = [2,5,4,6,3,9,8,11,11,10,6,3,8,4,8,10,11,12,10,5,4,9,5,9,12,6,2,3];
        const fourPlayerProducerOrder = [0,1,2,6,11,15,18,17,16,12,7,3,4,5,10,14,13,8,9];
        const sixPlayerProducerOrder = [0,1,2,6,11,17,22,26,29,28,27,23,18,12,7,3,4,5,10,16,21,25,24,19,13,8,9,15,20,14];
        const resourceChoice = [RESOURCE_ID.FOREST, RESOURCE_ID.SHEEP, RESOURCE_ID.WHEAT, RESOURCE_ID.BRICK, RESOURCE_ID.ROCK, RESOURCE_ID.DESERT]
        const maxResources = new Map([
            [RESOURCE_ID.FOREST, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
            [RESOURCE_ID.SHEEP, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
            [RESOURCE_ID.WHEAT, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 6],
            [RESOURCE_ID.BRICK, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 3 : 5],
            [RESOURCE_ID.ROCK, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 3 : 5],
            [RESOURCE_ID.DESERT, this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? 1 : 2],
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
                    producer = fourPlayerProducer[id - desertPlaced];
                } else {
                    desertPlaced++;
                }
            } else {
                id = sixPlayerProducerOrder[i];
                if (choice !== RESOURCE_ID.DESERT) {
                    producer = sixPlayerProducer[id - desertPlaced];
                } else {
                    desertPlaced++;
                }
            }
            console.log('id chosen is: ' + id, fourPlayerProducer.length, sixPlayerProducer.length, fourPlayerProducerOrder.length, sixPlayerProducerOrder.length);
            this.tiles_[id] = new Tile(id, producer, choice);
            resourceGenerated.set(choice, resourceGenerated.get(choice) + 1);
            if (resourceGenerated.get(choice) === maxResources.get(choice)) {
                resourceChoice.splice(randomNumber, 1);
            }
        }
    }

    debug() {
        for (let i = 0; i < this.nodeCount_; ++i) {
            console.log(`Node ID: ${i}: ${this.nodes_.get(i).edges.map(e => e.nodeTwoId.toString()).toString()}`);
        }
        for (let i = 0; i < this.tiles_.length; ++i) {
            let resourceString;
            switch(this.tiles_[i].resource) {
                case RESOURCE_ID.FOREST:
                    resourceString = 'FOREST'
                    break;
                case RESOURCE_ID.SHEEP:
                    resourceString = 'SHEEP'
                    break;
                case RESOURCE_ID.WHEAT:
                    resourceString = 'WHEAT'
                    break;
                case RESOURCE_ID.BRICK:
                    resourceString = 'BRICK'
                    break;
                case RESOURCE_ID.ROCK:
                    resourceString = 'ROCK'
                    break;
                case RESOURCE_ID.DESERT:
                    resourceString = 'DESERT'
                    break;
            };
            console.log(`Tile ID: ${i}: ${resourceString}. Producer is: ${this.tiles_[i].producer}`);
        }

        console.log('Board is serialized as: ');
        const serialization = this.serialize();
        console.log(prettyjson.render(JSON.parse(serialization)));
    }
    
    canBuildSettlement(player, coordinate) {
        // return true if coordinate is at least distance two away from all other settlements
        // and there is a connected road leading to this coordinate by that player
    }

    canBuildRoad(player, coordinate){
        const nodes = coordinate.split(',');
        if (nodes.length === 2) {
            // return true if node[0] or node[1] has a settlement that belong to that player
            // or if node[0] or node[1] has a road by that player bordering it
        } else {
            throw new Error('Wrong coordinate string passed into canBuildRoad: ' + coordinate);
        }
    }

    canBuildCity(player, coordinate) {
        // return true if coordinate has a settlement that belong to that player
    }

    buildSettlement(player, coordinate) {

    }

    buildRoad(player, coordinate) {
        // attempts to build a road. returns true if successful
        if (this.canBuildRoad(player,coordinate)){
            // build road here
            return true;
        }
        return false;
    }

    buildCity(player, coordinate) {
        if (this.canBuildCity(player, coordinate)) {
            // build city here
            return true;
        }
        return false;
    }

    buildRoad(player, coordinate) {
        if (this.canBuildRoad(player,coordinate)) {
            return true;
        }
        return false;
    }
}

module.exports = Board;