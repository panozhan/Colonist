const {BOARD_SIZE, PLAYER_ID, OCCUPATION_STATE, RESOURCE_ID, CARDS} = require('./constants');

const tileToNodeIdMap6 = new Map([
    [0, [0,3,4,7,8,12]],
    [1, [1,4,5,8,9,13]],
    [2, [2,5,6,9,10,14]],
    [3, [7,11,12,16,17,22]],
    [4, [8,12,13,17,18,23]],
    [5, [9,13,14,18,19,24]],
    [6, [10,14,15,19,20,25]],
    [7, [16,21,22,27,28,34]],
    [8, [17,22,23,28,29,35]],
    [9, [18,23,24,29,30,36]],
    [10, [19,24,25,30,31,37]],
    [11, [20,25,26,31,32,38]],
    [12, [27,33,34,40,41,47]],
    [13, [28,34,35,41,42,48]],
    [14, [29,35,36,42,43,49]],
    [15, [30,36,37,43,44,50]],
    [16, [31,37,38,44,45,51]],
    [17, [32,38,39,45,46,52]],
    [18, [41,47,48,53,54,59]],
    [19, [42,48,49,54,55,60]],
    [20, [43,49,50,55,56,61]],
    [21, [44,50,51,56,57,62]],
    [22, [45,51,52,57,58,63]],
    [23, [54,59,60,64,65,69]],
    [24, [55,60,61,65,66,70]],
    [25, [56,61,62,66,67,71]],
    [26, [57,62,63,67,68,72]],
    [27, [65,69,70,73,74,77]],
    [28, [66,70,71,74,75,78]],
    [29, [67,71,72,75,76,79]],
]);

const tileToNodeIdMap4 = new Map([
    [0, [0,3,4,7,8,12]],
    [1, [1,4,5,8,9,13]],
    [2, [2,5,6,9,10,14]],
    [3, [7,11,12,16,17,22]],
    [4, [8,12,13,17,18,23]],
    [5, [9,13,14,18,19,24]],
    [6, [10,14,15,19,20,25]],
    [7, [16,21,22,27,28,33]],
    [8, [17,22,23,28,29,34]],
    [9, [18,23,24,29,30,35]],
    [10, [19,24,25,30,31,36]],
    [11, [20,25,26,31,32,37]],
    [12, [28,33,34,38,39,43]],
    [13, [29,34,35,39,40,44]],
    [14, [30,35,36,40,41,45]],
    [15, [31,36,37,41,42,46]],
    [16, [39,43,44,47,48,51]],
    [17, [40,44,45,48,49,52]],
    [18, [41,45,46,49,50,53]],
]);

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
        this.occupiedBy = OCCUPATION_STATE.FREE;
    }
};

class Node {
    constructor(id, connectedTo, boardSize) {
        this.id = id;
        this.occupiedBy = OCCUPATION_STATE.FREE;
        this.isCity = false;
        this.connectedTo = connectedTo;
        // Array<Edge> edges are two way
        this.edges = connectedTo.map(e => new Edge(id, e));
        this.boardSize = boardSize;
        this.resources = [];
    }

    isTaken() {
        return this.occupiedBy === undefined;
    }

    // Returns the player id that this node belongs to.
    // If it's not taken, return undefined
    settlementBelongsTo() {
        if (this.isTaken()) {
            return this.occupiedBy;
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
        // todo fix this
        this.robberHere = resource === RESOURCE_ID.DESERT;
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
        this.numYearOfPlenty = 1;
        this.numRoadBuilding = 1;
        this.monopoly = 1;
        this.knight = 1;
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

    add(delta) {
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
        // Map<integer, Node>
        this.nodes_ = null;
        this.ports_ = null;
        // Array<Tile>
        this.tiles_ = null;
        this.recordBuiltSettlements = false;
        this.recorded = [];
    }

    setNodes(nodes, isClient = false) {
        this.nodes_ = nodes;
    }

    setPorts(ports) {
        this.ports_ = ports;
    }

    getPorts() {
        return this.ports_;
    }

    serialize() {
        return {
            nodes: Array.from(this.nodes_.entries()),
            tiles: this.tiles_,
            ports: this.ports_,
        }; 
    }

    // return Map<int, Array<int>>
    calculateInitialHand() {
        let result = new Map();
        const tilesMap = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS ? tileToNodeIdMap4 : tileToNodeIdMap6;
        tilesMap.forEach((nodes, tileId) => {
            nodes.forEach(node => {
                const playerOnNode = this.nodes_.get(node).occupiedBy;
                const resource = this.tiles_[tileId].resource;
                if (playerOnNode !== OCCUPATION_STATE.FREE && resource !== RESOURCE_ID.DESERT
                    && this.recorded.indexOf(node) !== -1) {
                    if (result.has(playerOnNode)) {
                        result.get(playerOnNode).push(resource);
                    } else {
                        result.set(playerOnNode, [resource]);
                    }
                }
            }); 
        });

        return result;
    }

    // Returns Node Ids
    getBuildableSettlementLocationsFor(player) {
        return [0, 1, 2];
    }

    // returns Set<int>
    getInitialPlacementSettlementLocations() {
        const result = new Set();
        this.nodes_.forEach((node, id) => {
            if (node.occupiedBy === OCCUPATION_STATE.FREE) {
                let shouldAddNodeToResult = true;
                for (const edge of node.edges) {
                    if (this.nodes_.get(edge.nodeTwoId).occupiedBy !== OCCUPATION_STATE.FREE) {
                        shouldAddNodeToResult = false;
                        break;
                    }
                }
                if (shouldAddNodeToResult) {
                    result.add(id);
                }
            }
        });
        return result;
    }

    getInitialPlacementRoadLocations(settlementLocation) {
        console.log(this.nodes_.get(settlementLocation).edges);
        return this.nodes_
            .get(settlementLocation)
            .edges
            .filter(e => e.occupiedBy === OCCUPATION_STATE.FREE)
            .map(e => [settlementLocation, e.nodeTwoId]);
    }

    // Returns a list of pairs of Node Ids
    getBuildableRoadLocationsFor(player) {
        return [[0,3], [3,7], [0,4]];
    }

    getBuildableCityLocationsFor(player) {
        
    }

    calculateTileToResource() {

    }

    deserialize(parsed) {
        this.nodes_ = new Map();
        parsed.nodes.forEach(entry => {
            const node = entry[1];
            this.nodes_.set(entry[0], new Node(node.id, node.connectedTo, node.boardSize));
        });
        this.tiles_ = parsed.tiles.map(t => new Tile(t.id, t.producer, t.resource));
        this.calculateTileToResource();
        this.ports_ = parsed.ports;
    }

    setTiles(tiles) {
        this.tiles_ = tiles;
        this.calculateTileToResource();
    }

    getNodes() {
        return this.nodes_;
    }

    getTiles() {
        return this.tiles_;
    }
    
    // player: integer, coordinate: integer
    buildSettlement(player, coordinate) {
        this.nodes_.get(coordinate).occupiedBy = player;
        if (this.recordBuiltSettlements) {
            this.recorded.push(coordinate);
        }
    }

    // player: integer, coordinates: Array [Integer, Integer]
    buildRoad(player, coordinates) {
        this.nodes_
            .get(coordinates[0])
            .edges
            .find(e => e.nodeTwoId === coordinates[1])
            .occupiedBy = player;
        this.nodes_
            .get(coordinates[1])
            .edges
            .find(e => e.nodeTwoId === coordinates[0])
            .occupiedBy = player;
    }

    // player: integer, coordinate: integer
    buildCity(player, coordinate) {
        this.nodes_.get(coordinate).isCity = true;
    }

    getVictoriousPlayer() {
        return undefined;
    }
};

module.exports = {Board, Node, Tile, Edge, PlayerHand, HandDelta};