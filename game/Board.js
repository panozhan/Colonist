const {BOARD_SIZE, PLAYER_ID, EDGE_STATE, RESOURCE_ID, CARDS} = require('./constants');

class HandDelta {
    constructor(param) {
        this.brick = param.brick;
        this.wheat = param.wheat;
        this.rock = param.rock;
        this.sheep = param.sheep;
        this.wood = param.wood;
    }
};

class Edge {
    constructor(nodeOneId, nodeTwoId) {
        this.nodeOneId = nodeOneId;
        this.nodeTwoId = nodeTwoId;
        this.state = EDGE_STATE.FREE;
    }
};

class Node {
    constructor(id, connectedTo, boardSize) {
        this.id = id;
        this.belongsTo_ = undefined;
        this.isCity = false;
        this.connectedTo = connectedTo;
        this.edges = connectedTo.map(e => new Edge(id, e));
        this.boardSize = boardSize;
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

    determineRow() {
        const widestRow = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 6 : 7;
        let row = 0;
        let rowEnd = 2;
        let rowLast = 3;
        let rowNow = 3;
        let increasing = true;
        while (this.id > rowEnd) {
            row++;
            if (rowLast === rowNow) {
                if (increasing) {
                    rowNow++;
                } else {
                    rowNow--;
                }
            } else {
                rowLast = rowNow;
                if (rowNow === widestRow) {
                    increasing = false;
                }
            }
            rowEnd += rowNow;
        }
        return row;
    }

    determineColumn() {
        const widestRow = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 6 : 7;
        let colStart = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 3: 4;
        let rowStart = 0;
        let rowEnd = 2;
        let rowLast = 3;
        let rowNow = 3;
        let increasing = true;
        while (this.id > rowEnd) {
            if (rowLast === rowNow) {
                if (increasing) {
                    rowNow++;
                    colStart--;
                } else {
                    rowNow--;
                    colStart++;
                }
            } else {
                rowLast = rowNow;
                if (rowNow === widestRow) {
                    increasing = false;
                }
            }
            rowStart = rowEnd + 1;
            rowEnd += rowNow;
        }

        return colStart + 2 * (this.id - rowStart);
    }
};

class Tile {
    constructor(id, producer, resource) {
        this.id = id;
        this.producer = producer;
        this.resource = resource;
        this.robberHere = resource === RESOURCE_ID.DESERT;
    }
};

class PlayableCard {
    constructor() {
        this.numPlayable = 1;
        this.numUnplayable = 0;
    }
};

class PlayerHand {
    constructor() {
        // Achievements
        this.hasLargestArmy = false;
        this.hasLongestRoad = false;

        // resources
        this.numBrick = 3;
        this.numWood = 2;
        this.numWheat = 1;
        this.numSheep = 1;
        this.numRock = 3;
        
        // victory point cards
        this.numChapel = 1;
        this.numPalace = 1;
        this.numMarket = 1;
        this.numLibrary = 1;

        // Playable development cards
        this.numYearOfPlenty = new PlayableCard();
        this.numRoadBuilding = new PlayableCard();
        this.monopoly = new PlayableCard();
        this.knight = new PlayableCard();

        this.numYearOfPlenty.numPlayable = 1;
        this.numYearOfPlenty.numUnplayable = 1;

        this.numRoadBuilding.numPlayable = 1;
        this.numRoadBuilding.numUnplayable = 1;

        this.monopoly.numPlayable = 1;
        this.monopoly.numUnplayable = 1;

        this.knight.numPlayable = 1;
        this.knight.numUnplayable = 1;
    }

    functor(list, num, id) {
        for (let i = 0; i < num; ++i) {
            list.push(id);
        }
    };

    getDevCardsAsList() {
        const result = [];
        this.functor(result, this.numYearOfPlenty.numPlayable, CARDS.YEAR_OF_PLENTY);
        this.functor(result, this.numRoadBuilding.numPlayable, CARDS.ROAD_BUILDING);
        this.functor(result, this.monopoly.numPlayable, CARDS.MONOPOLY);
        this.functor(result, this.knight.numPlayable, CARDS.KNIGHT);

        this.functor(result, this.numYearOfPlenty.numUnplayable, CARDS.YEAR_OF_PLENTY_USED);
        this.functor(result, this.numRoadBuilding.numUnplayable, CARDS.ROAD_BUILDING_USED);
        this.functor(result, this.monopoly.numUnplayable, CARDS.MONOPOLY_USED);
        this.functor(result, this.knight.numUnplayable, CARDS.KNIGHT_USED);

        this.functor(result, this.numChapel, CARDS.CHAPEL);
        this.functor(result, this.numPalace, CARDS.PALACE);
        this.functor(result, this.numMarket, CARDS.MARKET);
        this.functor(result, this.numLibrary, CARDS.LIBRARY);

        return result;
    }

    getResourceCardsAsList() {
        const result = [];
        this.functor(result, this.numWood, CARDS.FOREST);
        this.functor(result, this.numBrick, CARDS.BRICK);
        this.functor(result, this.numRock, CARDS.ROCK);
        this.functor(result, this.numWheat, CARDS.WHEAT);
        this.functor(result, this.numSheep, CARDS.SHEEP);
        return result;
    }

    contains(delta) {
        return delta.brick <= this.numBrick && delta.wood <= this.numWood 
            && delta.sheep <= this.numSheep && delta.wheat <= this.numWheat && delta.rock <= this.numRock;
    }

    detract(delta) {
        this.numBrick -= delta.brick;
        this.numRock -= delta.rock;
        this.numWheat -= delta.wheat;
        this.numSheep -= delta.sheep;
        this.numWood -= delta.wood;
    }

    change(delta) {
        this.numBrick += delta.brick;
        this.numRock += delta.rock;
        this.numWheat += delta.wheat;
        this.numSheep += delta.sheep;
        this.numWood += delta.wood;
    }
};

class Board {
    constructor(size) {
        this.boardSize_ = size;
        this.nodeCount_ = size === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
    }

    setNodes(nodes, isClient = false) {
        this.nodes_ = nodes;
    }

    serialize() {
        return {
            nodes: Array.from(this.nodes_.entries()),
            tiles: this.tiles_,
        }; 
    }

    deserialize(parsed) {
        this.nodes_ = new Map();
        parsed.nodes.forEach(entry => {
            const node = entry[1];
            this.nodes_.set(entry[0], new Node(node.id, node.connectedTo, node.boardSize));
        });
        this.tiles_ = parsed.tiles.map(t => new Tile(t.id, t.producer, t.resource));
        this.nodes_.forEach((val,key) => {
            console.log(key, val.determineRow(), val.determineColumn());
        })
    }

    setTiles(tiles) {
        this.tiles_ = tiles;
    }

    getNodes() {
        return this.nodes_;
    }

    getTiles() {
        return this.tiles_;
    }
    
    canBuildSettlement(player, coordinate) {
        // return true if coordinate is at least distance two away from all other settlements
        // and there is a connected road leading to this coordinate by that player
        return;
    }

    canBuildRoad(player, coordinate){
        const nodes = coordinate.split(',');
        if (nodes.length === 2) {
            // return true if node[0] or node[1] has a settlement that belong to that player
            // or if node[0] or node[1] has a road by that player bordering it
        } 
        return true;
    }

    canBuildCity(player, coordinate) {
        // return true if coordinate has a settlement that belong to that player\
        return true;
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
};

module.exports = {Board, Node, Tile, Edge, PlayerHand, HandDelta};