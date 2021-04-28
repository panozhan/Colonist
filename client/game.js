import * as THREE from 'three';
import {Board, PlayerHand} from '../game/Board';
import {BOARD_SIZE, PLAYER_ID, EDGE_STATE, RESOURCE_ID, CARDS, SOCKET_CONSTANTS} from '../game/constants';
import {TradeParam} from '../game/network';
import {generateCoordinateMap} from './coordinate';

class ClickableElement {
    constructor(coordinates, action){
        this.topLeftX = coordinates.topLeftX;
        this.topLeftY = coordinates.topLeftY;
        this.botRightX = coordinates.botRightX;
        this.botRightY = coordinates.botRightY;
        this.action = action;
    }

    // params are in game units
    isInBound(mouseX, mouseY) {
        return mouseX >= this.topLeftX && mouseX <= this.botRightY && 
            mouseY <= this.topLeftY && mouseY >= this.botRightY;
    }
}

let playerNames = ['a', 'c', 'player3', 'john smith', 'will grose'];
const playerColors = ['./dist/parchment-small-1.jpg', './dist/parchment-small-2.jpg', './dist/parchment-small-3.jpg', './dist/parchment-small-4.jpg', './dist/parchment-small-5.jpg'];
const buildingColors = [0x8f0c03, 0x1830a3, 0xcc8500, 0xc7c7c7, 0x633300, 0x038f32];
const RADIAN90 = 1.5708;
const RADIAN30 = 0.523599;
export default function runGame(canvas, data, socket, myName) {
    socket.on(SOCKET_CONSTANTS, (names) => {
        playerNames = names;
    });
    // Todo: move this to when we know how many players there are
    const coordinateMap = generateCoordinateMap(6);
    let needRerenderUI = false;
    let requestTradeParam = undefined;
    const myHand = new PlayerHand();
    const extraUiNode = document.getElementById('extra-ui');
    const tradePartnersContainerOne = document.getElementById('trade-partner-containers-1');
    const tradePartnersContainerTwo = document.getElementById('trade-partner-containers-2');
    const tradeSliders = document.getElementById('trade-resource-sliders');
    
    const giveWoodIndicator = document.getElementById('give-wood-indicator');
    const giveWheatIndicator = document.getElementById('give-wheat-indicator');
    const giveRockIndicator = document.getElementById('give-rock-indicator');
    const giveBrickIndicator = document.getElementById('give-brick-indicator');
    const giveSheepIndicator = document.getElementById('give-sheep-indicator');
    
    const takeWoodIndicator = document.getElementById('take-wood-indicator');
    const takeWheatIndicator = document.getElementById('take-wheat-indicator');
    const takeRockIndicator = document.getElementById('take-rock-indicator');
    const takeBrickIndicator = document.getElementById('take-brick-indicator');
    const takeSheepIndicator = document.getElementById('take-sheep-indicator');

    const giveWoodRange = document.getElementById('give-wood-range');
    const giveWheatRange = document.getElementById('give-wheat-range');
    const giveRockRange = document.getElementById('give-rock-range');
    const giveBrickRange = document.getElementById('give-brick-range');
    const giveSheepRange = document.getElementById('give-sheep-range');
    
    const takeWoodRange = document.getElementById('take-wood-range');
    const takeWheatRange = document.getElementById('take-wheat-range');
    const takeRockRange = document.getElementById('take-rock-range');
    const takeBrickRange = document.getElementById('take-brick-range');
    const takeSheepRange = document.getElementById('take-sheep-range');

    const decideTradeRequest = document.getElementById('decide-trade-request');
    const sendTradeRequestButton = document.getElementById('send-trade-request');

    const acceptTradeRequest = document.getElementById('accept-trade');
    acceptTradeRequest.onclick = () => {
        socket.emit(SOCKET_CONSTANTS.DECIDE_TRADE, {accept: 1}, () => {
            myHand.detract(requestTradeParam.takeHand());
            myHand.change(requestTradeParam.giveHand());
            needRerenderUI = true;
        });
        extraUiNode.style.display = 'none';
    };
    const rejectTradeRequest = document.getElementById('reject-trade');
    rejectTradeRequest.onclick = () => {
        socket.emit(SOCKET_CONSTANTS.DECIDE_TRADE, {accept: 0}, () => {
            console.log('reject acknowledged');
        });
        extraUiNode.style.display = 'none';
    };

    const tradeMessage = document.getElementById('trade-message');

    const addListenerToRange = (range, indicator) => {
        range.addEventListener('input', (e) => {
            indicator.innerText = e.target.value;
        });
    };

    addListenerToRange(giveWoodRange, giveWoodIndicator);
    addListenerToRange(giveWheatRange, giveWheatIndicator);
    addListenerToRange(giveRockRange, giveRockIndicator);
    addListenerToRange(giveBrickRange, giveBrickIndicator);
    addListenerToRange(giveSheepRange, giveSheepIndicator);

    addListenerToRange(takeWoodRange, takeWoodIndicator);
    addListenerToRange(takeWheatRange, takeWheatIndicator);
    addListenerToRange(takeRockRange, takeRockIndicator);
    addListenerToRange(takeBrickRange, takeBrickIndicator);
    addListenerToRange(takeSheepRange, takeSheepIndicator);

    const setRangeToZero = ()=>{
        giveWoodRange.value = 0;
        giveWheatRange.value = 0;
        giveRockRange.value = 0;
        giveBrickRange.value = 0;
        giveSheepRange.value = 0;
        
        takeWoodRange.value = 0;
        takeWheatRange.value = 0;
        takeRockRange.value = 0;
        takeBrickRange.value = 0;
        takeSheepRange.value = 0;

        giveWoodIndicator.innerHTML = '0';
        giveWheatIndicator.innerHTML = '0';
        giveRockIndicator.innerHTML = '0';
        giveBrickIndicator.innerHTML = '0';
        giveSheepIndicator.innerHTML = '0';
    
        takeWoodIndicator.innerHTML = '0';
        takeWheatIndicator.innerHTML = '0';
        takeRockIndicator.innerHTML = '0';
        takeBrickIndicator.innerHTML = '0';
        takeSheepIndicator.innerHTML = '0';
    }
    
    let tradePartnerName;
    const tradePlayerHandler = (player) => {
        tradePartnersContainerOne.style.display = 'none';
        tradePartnersContainerTwo.style.display = 'none';
        tradeSliders.style.display = 'flex';
        giveWoodRange.max = myHand.numWood;
        giveWheatRange.max = myHand.numWheat;
        giveRockRange.max = myHand.numRock;
        giveBrickRange.max = myHand.numBrick;
        giveSheepRange.max = myHand.numSheep;
        tradePartnerName = player;
        tradeMessage.innerHTML = `To ${player}: I will trade`;
        sendTradeRequestButton.style.display = 'flex';
        decideTradeRequest.style.display = 'none'
        console.log('trading with ' + player + '! yay!');
    };
    
    playerNames.forEach((player, index) => {
        const ele = document.createElement('div');
        ele.classList.add('trade-partner');
        ele.id = player;
        ele.innerText = `Trade with: ${player}`
        ele.style.backgroundImage = `url("${playerColors[index]}")`;
        if (index < 2) {
            tradePartnersContainerOne.appendChild(ele);
        } else {
            tradePartnersContainerTwo.appendChild(ele);
        }
        ele.onclick = () => {
            tradePlayerHandler(player);
        };
    });

    sendTradeRequestButton.onclick = () => {
        console.log('Sending trade request');
        const tradeParam = new TradeParam({
            initiator: myName,
            partner: tradePartnerName,
            giveWood: parseInt(giveWoodRange.value),
            giveWheat: parseInt(giveWheatRange.value),
            giveRock: parseInt(giveRockRange.value),
            giveBrick: parseInt(giveBrickRange.value),
            giveSheep: parseInt(giveSheepRange.value),
        
            takeWood: parseInt(takeWoodRange.value),
            takeWheat: parseInt(takeWheatRange.value),
            takeRock: parseInt(takeRockRange.value),
            takeBrick: parseInt(takeBrickRange.value),
            takeSheep: parseInt(takeSheepRange.value),
        });
        socket.emit(SOCKET_CONSTANTS.TRADE, tradeParam, (data)=>{
            console.log('response trade. partner decision:', data.accept === 1);
            if (data.accept === 1) {
                myHand.detract(tradeParam.giveHand());
                myHand.change(tradeParam.takeHand());
                needRerenderUI = true;
            }
            extraUiNode.style.display = 'none';
        });
    };

    socket.on(SOCKET_CONSTANTS.TRADE_REQUEST, (data) => {
        extraUiNode.style.display = 'block';
        tradeSliders.style.display = 'flex';
        const toHide = document.getElementsByClassName('trade-column');
        for (let i = 0; i < toHide.length; ++i) {
            toHide[i].style.display = 'none';
        }
        sendTradeRequestButton.style.display = 'none';
        decideTradeRequest.style.display = 'flex'
        tradeMessage.innerHTML = `${data.initiator} wants to trade:`;
        requestTradeParam = new TradeParam(data);
        console.log(`Received a trade request from ${data.initiator}`, data);
    });

    const boardSize = 6; // TODO: make this dynamicc
    const board = new Board(6);
    board.deserialize(data);

    const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    function getAspectRatio() {
        return canvas.width / canvas.height;
    }
    const fov = 100;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 5.5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const cameraZPosition = 5.5;
    camera.position.z = cameraZPosition;
    
   // camera.position.y = 0.5;
    const scene = new THREE.Scene();
    const loader = new THREE.TextureLoader();

    const HEXAGON_LEG = 0.86602540378;
    const TILE_TOP_ROW_Y_POS = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 3 : 4.5;
    let robber;
    // Setup tiles
    {
        const tileGeometry = new THREE.CylinderGeometry(1, 1, 0.01, 6);
        const resourceMarkerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.01, 12);
        
        const resourceMaterial = new Map([
            [RESOURCE_ID.BRICK, new THREE.MeshBasicMaterial({map: loader.load('./dist/brick.jpg')})],
            [RESOURCE_ID.SHEEP, new THREE.MeshBasicMaterial({map: loader.load('./dist/sheep.jpg')})],
            [RESOURCE_ID.FOREST, new THREE.MeshBasicMaterial({map: loader.load('./dist/forest.jpg')})],
            [RESOURCE_ID.WHEAT, new THREE.MeshBasicMaterial({map: loader.load('./dist/wheat.jpg')})],
            [RESOURCE_ID.ROCK, new THREE.MeshBasicMaterial({map: loader.load('./dist/rock.jpg')})],
            [RESOURCE_ID.DESERT, new THREE.MeshBasicMaterial({map: loader.load('./dist/desert.jpg')})],
        ]);
        const resourceMarkerMaterial = new Map([
            [2, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-2.jpg')})],
            [3, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-3.jpg')})],
            [4, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-4.jpg')})],
            [5, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-5.jpg')})],
            [6, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-6.jpg')})],
            [8, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-8.jpg')})],
            [9, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-9.jpg')})],
            [10, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-10.jpg')})],
            [11, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-11.jpg')})],
            [12, new THREE.MeshBasicMaterial({map: loader.load('./dist/number-12.jpg')})],
        ]);
        function makeTile(material, x, y) {
            const tile = new THREE.Mesh(tileGeometry, material);
            tile.rotation.x = RADIAN90;
            tile.rotation.y = Math.floor(Math.random() * 6) * 1.0472;
            tile.position.x = x;
            tile.position.y = y;
            return tile;
        }
        function makeResourceMarker(material, x, y) {
            const marker = new THREE.Mesh(resourceMarkerGeometry, material);
            marker.rotation.x = RADIAN90;
            marker.rotation.y = RADIAN90;
            marker.position.x = x;
            marker.position.y = y;
            // slightly higher up from the tiles so this always get shown
            marker.position.z = 0.1;
            return marker;
        }
        const widestRow = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 5 : 6;
        const tiles = board.getTiles();
        tiles.sort((i,j) => i.id - j.id);
        let rowWidth = 3;
        let rowYPosition = TILE_TOP_ROW_Y_POS;
        let rowXStartPosition = -2 * HEXAGON_LEG;
        let increasing = true;
        let totalTilesPlaced = 0;
        let robberCreated = false;
        while (totalTilesPlaced !== tiles.length) {
            for (let i = 0; i < rowWidth; ++i) {
                const tileData = tiles[totalTilesPlaced];
                const xPos = rowXStartPosition + 2 * i * HEXAGON_LEG;
                scene.add(makeTile(resourceMaterial.get(tileData.resource), xPos, rowYPosition));
                console.log('tile: ', tileData.producer, tileData.resource);
                if (tileData.resource !== RESOURCE_ID.DESERT) {
                    scene.add(makeResourceMarker(resourceMarkerMaterial.get(tileData.producer), xPos, rowYPosition));
                } else if (!robberCreated) {
                    const robberGeometry = new THREE.OctahedronGeometry(0.3, 2);
                    robber = new THREE.Mesh(robberGeometry, new THREE.MeshPhongMaterial({color: 0x787878}));
                    robber.position.set(xPos, rowYPosition);
                    scene.add(robber);
                    robberCreated = true;
                }
                totalTilesPlaced++;
            }
            if (increasing) {
                rowWidth++;
                rowXStartPosition -= HEXAGON_LEG;
                if (rowWidth === widestRow) {
                    increasing = false;
                }
            } else {
                rowWidth--;
                rowXStartPosition += HEXAGON_LEG;
            }
            rowYPosition -= 1.5;
        }
    }

    // Gets half of the game unit width
    function getGameUnitHeight() {
        return 1.19175359259 * cameraZPosition;
    }

    // Gets half of the game unit width
    function getGameUnitWidth() {
        return getGameUnitHeight() * getAspectRatio();
    }

    function pixelToGameCooridnate(clientX,clientY) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pixelFarthestTopLeftX = Math.floor(canvasWidth / 2);
        const pixelFarthestTopLeftY = Math.floor(canvasHeight / 2);
        const frameShiftedClientX = clientX - pixelFarthestTopLeftX;
        const frameShiftedClientY = pixelFarthestTopLeftY - clientY;

        // Note: this is actually half of the width
        const gameUnitHeight = getGameUnitHeight();
        const gameUnitWidth = getGameUnitWidth();
        
        return {
            gameX: frameShiftedClientX * gameUnitWidth / pixelFarthestTopLeftX, 
            gameY: frameShiftedClientY * gameUnitHeight / pixelFarthestTopLeftY
        };
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect = getAspectRatio();
        camera.updateProjectionMatrix();
    }

    const material = new THREE.MeshPhongMaterial({color: 0x44aa88});  // greenish blue
    const staticSpinnables = [];
    const settlements = new Map();
    function makeSettlement(material, node) {
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const settlement = new THREE.Mesh(geometry, material);
        settlements.set(node, settlement);
        const coordinate = coordinateMap.get(node);
        settlement.position.x = coordinate.x;
        settlement.position.y = coordinate.y;
        settlement.position.z = 0.1;
        scene.add(settlement);
    }
    coordinateMap.forEach((val, key) => {
        makeSettlement(material, key);
    });
    function makeCity(material, node) {
        const geometry = new THREE.DodecahedronGeometry(0.25);
        const city = new THREE.Mesh(geometry, material);
        const coordinate = coordinateMap.get(node);
        city.position.x = coordinate.x;
        city.position.y = coordinate.y;
        city.position.z = 0.1;
        staticSpinnables.push(city);
        scene.add(city);
        const settlement = settlements.get(node);
        scene.remove(settlement);
    }

    coordinateMap.forEach((val, key) => {
        if(Math.floor(Math.random() * 2) < 1) {
            makeCity(material, key);
        }
    });

    function decideOrientation(edge) {
        const nodeOne = board.getNodes().get(edge.nodeOneId);
        const nodeTwo = board.getNodes().get(edge.nodeTwoId);
        const rowOne = nodeOne.determineRow();
        const rowTwo = nodeTwo.determineRow();
        const colOne = nodeOne.determineCol();
        const colTwo = nodeTwo.determineCol();
        const yCoordinate = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 5.5;

        if (colOne === colTwo) {
            return [RADIAN90, ]
        } else {
            const smallerCol = Math.min(colOne, colTwo);
            if (boardSize === BOARD_SIZE.SIZE_4_PLAYERS) {
                if (smallerCol % 2 === 0) {
                    return [RADIAN30];
                } else {
                    return [-1 * RADIAN30];
                }
            } else {
                if (smallerCol % 2 === 1) {
                    return [RADIAN30];
                } else {
                    return [-1 * RADIAN30];
                }
            }
            
        }
    }
let road;
    function makeRoad(material, id) {
        const geometry = new THREE.BoxGeometry(0.7, 0.15, 0.1);
        road = new THREE.Mesh(geometry, material);
        road.position.z = 0.1;
        road.position.y = 1;
        road.rotation.z = RADIAN30;
        scene.add(road);
    }

    makeRoad(material);
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(0, 0, 4);
    scene.add(light);
    /*
    code to remove an object:
        const object = scene.getObjectByProperty( 'uuid', i );

        object.geometry.dispose();
        object.material.dispose();
        scene.remove( object );

    */
    const boardHalfWidth = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4.33012701892 : 5.19615242271;
    const buildMaterial = new THREE.MeshBasicMaterial({
        map: loader.load('./dist/build.jpg'),
    });
    const tradeMaterial = new THREE.MeshBasicMaterial({
        map: loader.load('./dist/trade.jpg'),
    });
    const developMaterial = new THREE.MeshBasicMaterial({
        map: loader.load('./dist/develop.jpg'),
    });
    let buttons = [];
    
    const buttonMap = new Map([
        [buildMaterial, () => {
            console.log('build clicked'); 
        }],
        [tradeMaterial, () => {
            console.log('trade clicked');
            extraUiNode.style.display = 'block';
            tradePartnersContainerOne.style.display = 'flex';
            tradePartnersContainerTwo.style.display = 'flex';
            tradeSliders.style.display = 'none';
            const toShow = document.getElementsByClassName('trade-column');
            for (let i = 0; i < toShow.length; ++i) {
                toShow[i].style.display = 'flex';
            }
            setRangeToZero();
        }],
        [developMaterial, () => {
            console.log('develop clicked');
        }],
    ]);
    let clickableElements = [];
    function makeButtons() {
        if (buttons.length !== 0) {
            buttons.forEach(button => {
                scene.remove(button);
            });
            buttons = [];
        }
        const buttonPadding = 0.5;
        const gameUnitWidth = getGameUnitWidth();
        clickableElements = [];
        
        const buttonWidth = Math.min(gameUnitWidth - boardHalfWidth - 2 * buttonPadding, 4.5);
        console.log('make', buttonWidth);
        const buttonRatio = 4.44444444444;
        const buttonHeight = buttonWidth / buttonRatio;

        const buttonGeometry = new THREE.PlaneGeometry(buttonWidth, buttonHeight);
        let height = TILE_TOP_ROW_Y_POS;
        buttonMap.forEach((action, material) => {
            const button = new THREE.Mesh(buttonGeometry, material);
            button.position.x = -1 * gameUnitWidth + buttonPadding + (buttonWidth / 2);
            button.position.y = height;
            clickableElements.push(new ClickableElement({
                topLeftX: -1 * gameUnitWidth + buttonPadding,
                topLeftY: height + (buttonHeight / 2),
                botRightX: -1 * gameUnitWidth + buttonPadding + buttonWidth,
                botRightY: height - (buttonHeight / 2),
            }, action));
            height -= (buttonHeight + buttonPadding);
            scene.add(button);
            buttons.push(button);
        });
    }
    const cards = [];
    const cardTextures = new Map([
        [CARDS.CHAPEL, new THREE.MeshBasicMaterial({map: loader.load('./dist/chapel.jpg')})],
        [CARDS.LIBRARY, new THREE.MeshBasicMaterial({map: loader.load('./dist/library.jpg')})], 
        [CARDS.MARKET, new THREE.MeshBasicMaterial({map: loader.load('./dist/market.jpg')})], 
        [CARDS.PALACE, new THREE.MeshBasicMaterial({map: loader.load('./dist/palace.jpg')})], 
        [CARDS.KNIGHT, new THREE.MeshBasicMaterial({map: loader.load('./dist/knight.jpg')})], 
        [CARDS.MONOPOLY, new THREE.MeshBasicMaterial({map: loader.load('./dist/monopoly.jpg')})],
        [CARDS.YEAR_OF_PLENTY, new THREE.MeshBasicMaterial({map: loader.load('./dist/year_of_plenty.jpg')})], 
        [CARDS.ROAD_BUILDING, new THREE.MeshBasicMaterial({map: loader.load('./dist/road_building.jpg')})], 
        [CARDS.KNIGHT_USED, new THREE.MeshBasicMaterial({map: loader.load('./dist/knight-used.jpg')})], 
        [CARDS.MONOPOLY_USED, new THREE.MeshBasicMaterial({map: loader.load('./dist/monopoly-used.jpg')})],
        [CARDS.YEAR_OF_PLENTY_USED, new THREE.MeshBasicMaterial({map: loader.load('./dist/year_of_plenty-used.jpg')})], 
        [CARDS.ROAD_BUILDING_USED, new THREE.MeshBasicMaterial({map: loader.load('./dist/road_building-used.jpg')})], 
        [CARDS.FOREST, new THREE.MeshBasicMaterial({map: loader.load('./dist/forest-card.jpg')})], 
        [CARDS.SHEEP, new THREE.MeshBasicMaterial({map: loader.load('./dist/sheep-card.jpg')})], 
        [CARDS.BRICK, new THREE.MeshBasicMaterial({map: loader.load('./dist/brick-card.jpg')})], 
        [CARDS.WHEAT, new THREE.MeshBasicMaterial({map: loader.load('./dist/wheat-card.jpg')})], 
        [CARDS.ROCK, new THREE.MeshBasicMaterial({map: loader.load('./dist/rock-card.jpg')})], 
    ]);
    function drawCards() {
        if (cards.length !== 0) {
            cards.forEach(card => {
                scene.remove(card);
            });
        }
        const resourceCardsToDisplay = myHand.getResourceCardsAsList();
        const devCardsToDisplay = myHand.getDevCardsAsList();

        const sectionPadding = 0.5;
        const cardPadding = 0.2;
        const gameUnitWidth = getGameUnitWidth();
        const rowWidth = gameUnitWidth - boardHalfWidth - 2 * sectionPadding;
        const cardWidth = 1;
        const cardHeight = 1.54609929078;
        const cardsPerRow = 1 + Math.floor((rowWidth - cardWidth) / (cardWidth + cardPadding));
        const cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
        
        const numResourceRow = Math.floor((resourceCardsToDisplay.length + cardsPerRow - 1)/ cardsPerRow);
        const firstCardInRowPosX = boardHalfWidth + sectionPadding + (cardWidth / 2);
        let firstRowPosY = TILE_TOP_ROW_Y_POS;
        for (let i = 0; i < numResourceRow; ++i) {
            for (let j = 0; j < cardsPerRow; ++j) {
                if (i * cardsPerRow + j < resourceCardsToDisplay.length) {
                    const cardType = resourceCardsToDisplay[i * cardsPerRow + j];
                    const card = new THREE.Mesh(cardGeometry, cardTextures.get(cardType));
                    card.position.x = firstCardInRowPosX + j * (cardWidth + cardPadding);
                    card.position.y = firstRowPosY - i * (cardHeight + cardPadding);
                    cards.push(card);
                    scene.add(card);
                }
            }
        }

        const numDevCardRow = Math.floor((devCardsToDisplay.length + cardsPerRow - 1)/ cardsPerRow);
        firstRowPosY = TILE_TOP_ROW_Y_POS - (numResourceRow * (cardHeight + cardPadding));
        for (let i = 0; i < numDevCardRow; ++i) {
            for (let j = 0; j < cardsPerRow; ++j) {
                if (i * cardsPerRow + j < devCardsToDisplay.length) {
                    const cardType = devCardsToDisplay[i * cardsPerRow + j];
                    const card = new THREE.Mesh(cardGeometry, cardTextures.get(cardType));
                    card.position.x = firstCardInRowPosX + j * (cardWidth + cardPadding);
                    card.position.y = firstRowPosY - i * (cardHeight + cardPadding);
                    cards.push(card);
                    scene.add(card);
                }
            }
        }
    }

    makeButtons();
    drawCards();
    let lastRedrawUiTime = 0;
    function render(time) {
        const REMAKE_UI_ONCE_PER = 0.5;
        const timeInSeconds = time * 0.001;
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = getAspectRatio();
            camera.updateProjectionMatrix();
            needRerenderUI = true;
        }
        if (needRerenderUI && timeInSeconds > lastRedrawUiTime + REMAKE_UI_ONCE_PER) {
            makeButtons();
            drawCards();
            lastRedrawUiTime = timeInSeconds;
            needRerenderUI = false;
        }
        renderer.render(scene, camera);
        staticSpinnables.forEach(e => {
            e.rotation.x = timeInSeconds;
            e.rotation.y = timeInSeconds;
        });
        settlements.forEach((mesh) => {
            mesh.rotation.x = timeInSeconds;
            mesh.rotation.y = timeInSeconds;
        })

        requestAnimationFrame(render);
    }
    canvas.addEventListener('click', (e) => { 
      //  plane.rotation.x +=0.523599;
        const gameCoordinate = pixelToGameCooridnate(e.clientX, e.clientY);
        console.log(`pixel: ${e.clientX}, ${e.clientY}. game: ${gameCoordinate.gameX}, ${gameCoordinate.gameY}`);
        clickableElements.forEach(e => {
            if (e.isInBound(gameCoordinate.gameX, gameCoordinate.gameY)) {
                e.action();
            }
        });
    });
    requestAnimationFrame(render);
}

