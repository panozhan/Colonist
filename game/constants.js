const BOARD_SIZE = {
    SIZE_4_PLAYERS: 4,
    SIZE_6_PLAYERS: 6,
};

const PLAYER_ID = {
    PLAYER_ONE: 0,
    PLAYER_TWO: 1,
    PLAYER_THREE: 2,
    PLAYER_FOUR: 3,
    PLAYER_FIVE: 4,
    PLAYER_SIX: 5,
    BANK: 6
};

const EDGE_STATE = {
    FREE: -1,
    PLAYER_ONE: 0,
    PLAYER_TWO: 1,
    PLAYER_THREE: 2,
    PLAYER_FOUR: 3,
    PLAYER_FIVE: 4,
    PLAYER_SIX: 5,
};

module.exports = {
    BOARD_SIZE,
    PLAYER_ID,
    EDGE_STATE
};