import {BOARD_SIZE, ROAD_SPEC} from '../game/constants';

class Coordinate {
    constructor(param) {
        this.x = param[0];
        this.y = param[1];
    }
};

const ROOT3OVER2 = 0.86602540378;
// Returns a map from nodeId to coordinate
export function generateCoordinateMap(boardSize) {
    const nodeCount = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
    const widestRow = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 6 : 7;
    const result = new Map();
    let total = 0; // The total number of nodes already generated
    let cLast = 3; // The number of nodes in the last row
    let cNow = 3; // The number of nodes in the current row
    let increasing = true;
    let yCoordinate = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4.5 : 6;
    let rowStartXCoordinate = -1.73205080757;
    while (total !== nodeCount) { 
        for (let i = 0; i < cNow; ++i) {
            result.set(total, new Coordinate([rowStartXCoordinate + ROOT3OVER2 * 2 * i,yCoordinate]));
            total++;
        }
        if (cLast === cNow) {
            yCoordinate -= 0.5;
            if (increasing) {
                rowStartXCoordinate -= ROOT3OVER2;
            } else {
                rowStartXCoordinate += ROOT3OVER2;
            }
            if (increasing) {
                cNow++;
            } else {
                cNow--;
            }
        } else {
            yCoordinate -= 1;
            cLast = cNow;
            if (cNow === widestRow) {
                increasing = false;
            }
        }
    }
    return result;
}

const ROOT3 = 1.73205080757;
export class EdgeToCoordinate {
    constructor(boardSize) {
        this.maxY = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4.5 : 6;
        this.boardSize = boardSize;
        this.coordinateMap = generateCoordinateMap(boardSize);
    }

    get(nodeOneId, nodeTwoId) {
        const nodeOneRow = this.determineRow(nodeOneId);
        const nodeOneCol = this.determineColumn(nodeOneId);
        const nodeTwoRow = this.determineRow(nodeTwoId);
        const nodeTwoCol = this.determineColumn(nodeTwoId);
        const coordinateOne = this.coordinateMap.get(nodeOneId);
        const coordinateTwo = this.coordinateMap.get(nodeTwoId);
        let rotation = 0;
        let xOffset = 0;
        let yOffset = 0;
        const rotationOffset = + 0.05;
        if (nodeOneCol === nodeTwoCol) {
            rotation = 1.5708;
            // xOffset += (ROAD_SPEC.ROAD_WIDTH / 2);
            // yOffset -= ((1 - ROAD_SPEC.ROAD_HEIGHT) / 4);
        } else if (nodeOneRow > nodeTwoRow) {
            if (nodeOneCol > nodeTwoCol) {
                rotation = -0.523599; // 30 degree in radian
                yOffset -= coordinateOne.y * ROAD_SPEC.ROAD_WIDTH / (ROOT3 * this.maxY) + rotationOffset;
                xOffset += rotationOffset;
            } else {
                rotation = 0.523599;
                yOffset -= (2 * coordinateOne.y * ROAD_SPEC.ROAD_WIDTH / (ROOT3 * this.maxY)) - rotationOffset;
                xOffset += rotationOffset;
            }
        } else {
            if (nodeTwoCol > nodeOneCol) {
                rotation = -0.523599;
                yOffset -= coordinateOne.y * ROAD_SPEC.ROAD_WIDTH / (ROOT3 * this.maxY) + rotationOffset;
                xOffset += rotationOffset;
            } else {
                rotation = 0.523599;
                yOffset -= (2 * coordinateOne.y * ROAD_SPEC.ROAD_WIDTH / (ROOT3 * this.maxY)) - rotationOffset;
                xOffset += rotationOffset;
            }
        }
        return {
            x: (coordinateOne.x + coordinateTwo.x) / 2 + xOffset,
            y: (coordinateOne.y + coordinateTwo.y) / 2 + yOffset,
            rotation: rotation,
        };
    }

    determineRow(nodeId) {
        const widestRow = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 6 : 7;
        let row = 0;
        let rowEnd = 2;
        let rowLast = 3;
        let rowNow = 3;
        let increasing = true;
        while (nodeId > rowEnd) {
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

    determineColumn(nodeId) {
        const widestRow = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 6 : 7;
        let colStart = this.boardSize_ === BOARD_SIZE.SIZE_4_PLAYERS? 3: 4;
        let rowStart = 0;
        let rowEnd = 2;
        let rowLast = 3;
        let rowNow = 3;
        let increasing = true;
        while (nodeId > rowEnd) {
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

        return colStart + 2 * (nodeId - rowStart);
    }
}