const e = require('express');
const {BOARD_SIZE, PLAYER_ID, EDGE_STATE} = require('./constants');

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

class Board {
    constructor(size) {
        if (size !== BOARD_SIZE.SIZE_4_PLAYERS && size !== BOARD_SIZE.SIZE_6_PLAYERS) {
            throw new Error('Incorrect size passed into board constructor: ' + size);
        }
        this.nodeCount_ = size === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
        const widestRow = size === BOARD_SIZE.SIZE_4_PLAYERS ? 6 : 7;
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
        this.debug();
    }

    debug() {
        for (let i = 0; i < this.nodeCount_; ++i) {
            console.log(`Node ID: ${i}, ${this.nodes_.get(i).edges.map(e => e.nodeTwoId.toString()).toString()}`);
        }
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