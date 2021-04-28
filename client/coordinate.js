import {BOARD_SIZE} from '../game/constants';

class Coordinate {
    constructor(param) {
        this.x = param[0];
        this.y = param[1];
    }
};

const ROOT3OVER2 = 0.86602540378;
export function generateCoordinateMap(boardSize) {
    const nodeCount = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 54 : 80;
    const widestRow = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 6 : 7;
    const result = new Map();
    let total = 0; // The total number of nodes already generated
    let cLast = 3; // The number of nodes in the last row
    let cNow = 3; // The number of nodes in the current row
    let increasing = true;
    let yCoordinate = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 5.5;
    let rowStartXCoordinate = -1.73205080757;
    while (total !== nodeCount) { 
        let ro
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
