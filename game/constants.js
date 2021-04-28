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

const RESOURCE_ID = {
    FOREST: 0,
    SHEEP: 1,
    BRICK: 2,
    WHEAT: 3,
    ROCK: 4,
    DESERT: 5,
};

const CARDS = {
    CHAPEL: 0,
    LIBRARY: 1,
    MARKET: 2,
    PALACE: 3,
    KNIGHT: 4,
    MONOPOLY: 5,
    YEAR_OF_PLENTY: 6,
    ROAD_BUILDING: 7,
    KNIGHT_USED: 8,
    MONOPOLY_USED: 9,
    YEAR_OF_PLENTY_USED: 10,
    ROAD_BUILDING_USED: 11,
    FOREST: 12,
    SHEEP: 13,
    BRICK: 14,
    WHEAT: 15,
    ROCK: 16,
};

const SOCKET_CONSTANTS = {
    // Server sends the client a list of existing game IDs
    EXISTING_GAMES: 'existing-games',
    // Server tells a player another player wants to trade
    TRADE_REQUEST: 'trade-request',
    // Client tells the server that window loaded as been called
    LOADED: 'loaded',
    CREATE_GAME: 'create-game',
    START_GAME: 'start-game',
    JOIN_GAME: 'join-game',
    // A player initiates a trade
    TRADE: 'trade',
    DECIDE_TRADE: 'decide-trade',
}

module.exports = {
    BOARD_SIZE,
    PLAYER_ID,
    EDGE_STATE,
    RESOURCE_ID,
    SOCKET_CONSTANTS,
    CARDS,
};