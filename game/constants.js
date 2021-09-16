const BOARD_SIZE = {
    SIZE_4_PLAYERS: 4,
    SIZE_6_PLAYERS: 6,
};

const CLICKABLE_ELEMENT_TYPE = {
    ROAD: 0,
    SETTLEMENT: 1,
    CITY: 2,
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

const OCCUPATION_STATE = {
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
    // The below are only used in client side
    SEA: 6,
    WOOD_PORT: 7,
    SHEEP_PORT: 8,
    WHEAT_PORT: 9,
    BRICK_PORT: 10,
    ROCK_PORT: 11,
    ANY_PORT: 12,
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
    BUILD: 'build',
    // notify a build action by another player
    NOTIFY_BUILD: 'notify-build',

    // Tell builds
    TELL_BUILD_SETTLEMENT: 'tb-0',
    TELL_BUILD_ROAD: 'tb-1',

    TELL_TURN_START: 'tt-s',

    TELL_TAKE_CARDS: 'tt-c',
};

const BUILD_TYPES = {
    ROAD: 0,
    SETTLEMENT: 1,
    CITY: 2,
};

const ROAD_SPEC = {
    ROAD_WIDTH: 0.15,
    ROAD_HEIGHT: 0.65
};

module.exports = {
    BUILD_TYPES,
    BOARD_SIZE,
    PLAYER_ID,
    OCCUPATION_STATE,
    RESOURCE_ID,
    SOCKET_CONSTANTS,
    CARDS,
    CLICKABLE_ELEMENT_TYPE,
    ROAD_SPEC,
};