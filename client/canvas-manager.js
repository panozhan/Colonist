import {BOARD_SIZE, PLAYER_ID, EDGE_STATE, RESOURCE_ID, CARDS, SOCKET_CONSTANTS, CLICKABLE_ELEMENT_TYPE, ROAD_SPEC, BUILD_TYPES} from '../game/constants';
import {generateCoordinateMap, EdgeToCoordinate} from './coordinate';
import * as THREE from 'three';
import {Board, PlayerHand} from '../game/Board';
import MenuManager from './menu-manager';
import LogManager from './log-manager';
import CardManager from './card-manager';

const playerColors = ['./dist/parchment-small-1.jpg', './dist/parchment-small-2.jpg', './dist/parchment-small-3.jpg', './dist/parchment-small-4.jpg', './dist/parchment-small-5.jpg'];
const RADIAN90 = 1.5708;
const RADIAN30 = 0.523599;
const cameraZPosition = 5.5;
const TAN50DEG = 1.19175359259;
const HEXAGON_LEG = 0.86602540378;

function getAspectRatio(canvas) {
    return canvas.width / canvas.height;
}

// Gets half of the game unit width
function getGameUnitHeight() {
    return TAN50DEG * cameraZPosition;
}

// Gets half of the game unit width
function getGameUnitWidth(canvas) {
    return getGameUnitHeight() * getAspectRatio(canvas);
}

const raycaster = new THREE.Raycaster();
const FOV = 100;
const ASPECT = 2;  // the canvas default
const NEAR = 0.1;
const FAR = 5.5;
let hoveredClickableObject = undefined;

export default class CanvasManager {
    constructor(canvas, socket) {
        this.playerMaterials = new Map([
            [0, {building: new THREE.MeshPhongMaterial({color: 0x8f0c03}), 
                edge: new THREE.MeshPhongMaterial({color: 0x8f0c03})}],
            [1, {building: new THREE.MeshPhongMaterial({color: 0x1830a3}), 
                edge: new THREE.MeshPhongMaterial({color: 0x1830a3})}],
            [2, {building: new THREE.MeshPhongMaterial({color: 0xcc8500}), 
                edge: new THREE.MeshPhongMaterial({color: 0xcc8500})}],
            [3, {building: new THREE.MeshPhongMaterial({color: 0xc7c7c7}), 
                edge: new THREE.MeshPhongMaterial({color: 0xc7c7c7})}],
            [4, {building: new THREE.MeshPhongMaterial({color: 0x633300}), 
                edge: new THREE.MeshPhongMaterial({color: 0x633300})}],
            [5, {building: new THREE.MeshPhongMaterial({color: 0x038f32}), 
                edge: new THREE.MeshPhongMaterial({color: 0x038f32})}],
        ]);
        //, boardSize, boardData
        this.socket = socket;
        this.canvas = canvas;
        
        this.playerHand = new PlayerHand();
        this.renderer = new THREE.WebGLRenderer({canvas, antialias:true});
        this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        this.scene = new THREE.Scene();
        this.textureLoader = new THREE.TextureLoader();
        //TODO: customize this geometry
        this.settlementGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.settlementWireframeGeometry = new THREE.EdgesGeometry(
            this.settlementGeometry
        );
        this.roadGeometry = new THREE.BoxGeometry(ROAD_SPEC.ROAD_HEIGHT, ROAD_SPEC.ROAD_WIDTH, 0.1);
        this.roadWireframeGeometry = new THREE.EdgesGeometry(
            this.roadGeometry
        );
        this.buildableGuideEdgeMaterial = new THREE.LineBasicMaterial( { color: 0xc1c1c1} );
        this.buildableGuideMeshMaterial = new THREE.MeshPhongMaterial({color: 0xc1c1c1, transparent:true, opacity: 0.3});
        this.buildableGuideMeshHoveredMaterial = new THREE.MeshPhongMaterial({color: 0xc1c1c1, transparent:true, opacity: 0.6});
        
        this.camera.position.z = cameraZPosition;
        this.menuManager = new MenuManager(this.manageBuildableTargets.bind(this));
        
        this.logManager = new LogManager();
        this.clickableElements = [];
        this.clickableElementsMeshGroup = new THREE.Group();
        this.clickableElementsEdgeGroup = new THREE.Group();
        this.socket.on(SOCKET_CONSTANTS.START_GAME, (data, callback) => {
            console.log('Start Game', data.playerId, data.otherPlayerNames);
            this.playerId = data.playerId;
            this.otherPlayerNames = this.otherPlayerNames;
            this.cardManager = new CardManager();
            this.cardManager.updatePlayerHand(this.playerHand);
            callback();
        });
        this.initialBuiltSettlement = undefined;
        this.socket.on(SOCKET_CONSTANTS.TELL_BUILD_SETTLEMENT, (_, callback) => {
            console.log('being told to build settlement');
            const buildableLocations = this.board.getInitialPlacementSettlementLocations();
            this.callbackForInitialSettlementBuild = callback;
            for (const location of buildableLocations) {
                const result = this.makeSettlement(location, this.buildableGuideEdgeMaterial, this.buildableGuideMeshMaterial);
                const edge = result[0];
                const mesh = result[1];
                this.clickableElementsEdgeGroup.add(edge);
                this.clickableElementsMeshGroup.add(mesh);
                this.meshIdToEntityMap_.set(mesh.id, {
                    type: CLICKABLE_ELEMENT_TYPE.SETTLEMENT, 
                    entity: [location],
                });
            }
            this.scene.add(this.clickableElementsMeshGroup);
            this.scene.add(this.clickableElementsEdgeGroup);
        });
        this.socket.on(SOCKET_CONSTANTS.TELL_BUILD_ROAD, (_, callback) => {
            console.log('being told to build road');
            const buildableLocations = this.board.getInitialPlacementRoadLocations(this.initialBuiltSettlement);
            this.callbackForInitialRoadBuild = callback;
            for (const location of buildableLocations) {
                const result = this.makeRoad(location, this.buildableGuideEdgeMaterial, this.buildableGuideMeshMaterial);
                const edge = result[0];
                const mesh = result[1];
                this.clickableElementsEdgeGroup.add(edge);
                this.clickableElementsMeshGroup.add(mesh);
                this.meshIdToEntityMap_.set(mesh.id, {
                    type: CLICKABLE_ELEMENT_TYPE.ROAD, 
                    entity: [location[0], location[1]],
                });
            }
            this.scene.add(this.clickableElementsMeshGroup);
            this.scene.add(this.clickableElementsEdgeGroup);
        });
        this.socket.on(SOCKET_CONSTANTS.NOTIFY_BUILD, (data, callback) => {
            console.log(`server notified that player with id ${data.id} built in location ${data.coordinate}`);
            const materials = this.playerMaterials.get(data.id);
            if (data.type === BUILD_TYPES.SETTLEMENT) {
                const settlements = this.makeSettlement(data.coordinate, materials.building, materials.edge);
                this.scene.add(settlements[0]);
                this.scene.add(settlements[1]);
                this.board.buildSettlement(data.id, data.coordinate);
            } else if (data.type === BUILD_TYPES.ROAD) {
                const roadId = data.coordinate.split(',').map(e => parseInt(e));
                const roads = this.makeRoad(roadId, materials.building, materials.edge);
                this.scene.add(roads[0]);
                this.scene.add(roads[1]);
                this.board.buildRoad(data.id, roadId);
            } else {
                // const settlements = this.makeSettlement(data.coordinate, materials.building, materials.edge);
                // this.scene.add(settlements[0]);
                // this.scene.add(settlements[1]);
            }
            
            
            callback();
        });
        this.socket.on(SOCKET_CONSTANTS.TELL_TAKE_CARDS, (data) => {
            console.log('being told to take cards: ', data.join(' '));
        });
        // Map<Integer, {type:enum, entity: Array}>
        this.meshIdToEntityMap_ = new Map();
        this.callbackForInitialSettlementBuild = undefined;
        this.callbackForInitialRoadBuild = undefined;
        // (mesh, node id)
        canvas.addEventListener('click', e => {
           const mouse = new THREE.Vector2();
            mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
            raycaster.setFromCamera( mouse, this.camera );
            const intersects = raycaster.intersectObjects(this.clickableElementsMeshGroup.children);
            if (intersects.length === 1) {
                const clickedEntity = this.meshIdToEntityMap_.get(intersects[0].object.id);
                const materials = this.playerMaterials.get(this.playerId);
                switch (clickedEntity.type) {
                    case CLICKABLE_ELEMENT_TYPE.SETTLEMENT:
                        const nodeId = clickedEntity.entity[0];
                        if (this.callbackForInitialSettlementBuild !== undefined) {
                            this.deleteBuildableGuides();
                            this.callbackForInitialSettlementBuild(nodeId);
                            this.callbackForInitialSettlementBuild = undefined;
                            this.initialBuiltSettlement = nodeId;
                        } else {
                            this.socket.emit(SOCKET_CONSTANTS.BUILD, 
                                {type: BUILD_TYPES.SETTLEMENT, param: nodeId}, (res) => {
                                console.log('server acknowledged');
                                this.completeBuildCommand();
                            });
                        }
                        this.board.buildSettlement(this.playerId, nodeId);
                        const coordinate = nodeId;
                        const settlements = this.makeSettlement(coordinate, materials.building, materials.edge);
                        this.scene.add(settlements[0]);
                        this.scene.add(settlements[1]);
                        break;
                    case CLICKABLE_ELEMENT_TYPE.ROAD:
                        console.log('road clicked', clickedEntity.entity);
                        const roadId = clickedEntity.entity.join(',');
                        if (this.callbackForInitialRoadBuild !== undefined) {
                            this.deleteBuildableGuides();
                            this.callbackForInitialRoadBuild(roadId);
                            this.callbackForInitialRoadBuild = undefined;
                        } else {
                            this.socket.emit(SOCKET_CONSTANTS.BUILD, 
                                {type: BUILD_TYPES.ROAD, param: roadId}, (res) => {
                                console.log('server acknowledged');
                                this.completeBuildCommand();
                            });
                        }
                        this.board.buildRoad(this.playerId, clickedEntity.entity);
                        const roads = this.makeRoad(clickedEntity.entity, materials.building, materials.edge);
                        this.scene.add(roads[0]);
                        this.scene.add(roads[1]);
                        
                        console.log(`road clicked at location: ${clickedEntity.entity}`);
                        break;
                    case CLICKABLE_ELEMENT_TYPE.CITY:
                        this.socket.emit(SOCKET_CONSTANTS.BUILD, 
                            {type: BUILD_TYPES.CITY, param: clickedEntity.entity[0]}, (res) => {
                            console.log('server acknowledged');
                            this.completeBuildCommand();
                            this.board.buildCity(this.playerId, clickedEntity.entity[0]);

                        });
                        console.log(`city clicked at location: ${clickedEntity.entity}`);
                        break;
                }
            } else if (intersects.length > 0) {
                console.log('WARNING: clicked on two clickable elements at once; Taking no action');
            }
        });
        canvas.addEventListener('mousemove', e => {
            const mouse = new THREE.Vector2();
            mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.clickableElementsMeshGroup.children);

            if (hoveredClickableObject !== undefined) {
                hoveredClickableObject.material = this.buildableGuideMeshMaterial;
                hoveredClickableObject = undefined;
            }
            if (intersects.length === 1) {
                intersects[0].object.material = this.buildableGuideMeshHoveredMaterial;
                hoveredClickableObject = intersects[0].object;
            }
        });
    }

    startGame(boardSize, boardData) {
        this.boardSize = boardSize;
        this.board = new Board(boardSize);
        this.board.deserialize(boardData);
        this.settlementCoordinateMap = generateCoordinateMap(boardSize);
        this.edgeCoordinateMap = new EdgeToCoordinate(boardSize);
        this.drawStatic();
        requestAnimationFrame(this.render.bind(this));
    }

    calculateSettlementCoordinate(nodeId) {
        const coordinate = this.settlementCoordinateMap.get(nodeId);
        // since we are using a (0.3 x 0.3 x 0.3) for a settlement right now,
        // this calculation is correct. It needs to be changed if we use a more
        // sophisticated geometry
        return {
            topLeftX: coordinate.x - 0.3,
            topLeftY: coordinate.y + 0.3,
            botRightX: coordinate.x + 0.3,
            botRightY: coordinate.y - 0.3,
        };
    }

    deleteBuildableGuides() {
        while (this.clickableElements.length > 0) {
            this.clickableElements.pop();
        }
        this.scene.remove(this.clickableElementsMeshGroup);
        this.scene.remove(this.clickableElementsEdgeGroup);
        this.clickableElementsMeshGroup.clear();
        this.clickableElementsEdgeGroup.clear();
        hoveredClickableObject = undefined;
    }

    completeBuildCommand() {
        console.log('remove buildable targets', this);
        this.deleteBuildableGuides();
        this.menuManager.updateBuildButtonClickState(1);
    }

    // location is a nodeId value 
    makeSettlement(location, edgeMaterial, meshMaterial) {
        const settlementEdge = new THREE.LineSegments(this.settlementWireframeGeometry, edgeMaterial);
        const settlementMesh = new THREE.Mesh(this.settlementGeometry, meshMaterial);
        const coordinate = this.settlementCoordinateMap.get(location);
        const setPosition = (obj) => {
            obj.position.x = coordinate.x;
            // move it up
            obj.position.y = coordinate.y;
            obj.position.z = 0.2;
            obj.rotation.z = 0.785398;
        };
        setPosition(settlementEdge);
        setPosition(settlementMesh);

        return [settlementEdge, settlementMesh];
    }

    // Array<int>
    makeRoad(coordinates, edgeMaterial, meshMaterial) {
        console.log('make roade', coordinates);
        const roadEdge = new THREE.LineSegments(this.roadWireframeGeometry, edgeMaterial);
        const roadMesh = new THREE.Mesh(this.roadGeometry, meshMaterial);
        const coordinate = this.edgeCoordinateMap.get(coordinates[0], coordinates[1]);
        const setPosition = (obj) => {
            obj.position.x = coordinate.x;
            // move it up
            obj.position.y = coordinate.y;
            obj.position.z = 0.2;
            obj.rotation.z = coordinate.rotation;
        };
        setPosition(roadEdge);
        setPosition(roadMesh);

        return [roadEdge, roadMesh];
    }

    // If the parameter reset is true, it means the user changed his mind about building
    // So we erase the indicators for buildable areas.
    manageBuildableTargets(reset) {
        if (!reset) {
            console.log('draw buildable targets');
            this.menuManager.updateBuildButtonClickState(0);
            const settlementLocations = this.board.getBuildableSettlementLocationsFor(this.playerId);
            for (const location of settlementLocations) {
                const result = this.makeSettlement(location, this.buildableGuideEdgeMaterial, this.buildableGuideMeshMaterial);
                const edge = result[0];
                const mesh = result[1];
                this.clickableElementsEdgeGroup.add(edge);
                this.clickableElementsMeshGroup.add(mesh);
                this.meshIdToEntityMap_.set(mesh.id, {
                    type: CLICKABLE_ELEMENT_TYPE.SETTLEMENT, 
                    entity: [location],
                });
            }
            const roadLocations = this.board.getBuildableRoadLocationsFor(this.playerId);
            for (const location of roadLocations) {
                const result = this.makeRoad(location, this.buildableGuideEdgeMaterial, this.buildableGuideMeshMaterial);
                const edge = result[0];
                const mesh = result[1];
                this.clickableElementsEdgeGroup.add(edge);
                this.clickableElementsMeshGroup.add(mesh);
                this.meshIdToEntityMap_.set(mesh.id, {
                    type: CLICKABLE_ELEMENT_TYPE.ROAD, 
                    entity: [location[0], location[1]],
                });
            }
            this.scene.add(this.clickableElementsMeshGroup);
            this.scene.add(this.clickableElementsEdgeGroup);
        } else {
            this.completeBuildCommand();
        }
    }

    drawStatic() {
        const tileGeometry = new THREE.CylinderGeometry(1, 1, 0.01, 6);
        const resourceMarkerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.01, 12);
        const resourceMaterial = new Map([
            [RESOURCE_ID.BRICK, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/brick.jpg')})],
            [RESOURCE_ID.SHEEP, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/sheep.jpg')})],
            [RESOURCE_ID.FOREST, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/forest.jpg')})],
            [RESOURCE_ID.WHEAT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/wheat.jpg')})],
            [RESOURCE_ID.ROCK, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/rock.jpg')})],
            [RESOURCE_ID.DESERT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/desert.jpg')})],
            [RESOURCE_ID.SEA, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/sea.jpg')})],
            [RESOURCE_ID.BRICK_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/brick-harbor.jpg')})],
            [RESOURCE_ID.SHEEP_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/sheep-harbor.jpg')})],
            [RESOURCE_ID.WOOD_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/wood-harbor.jpg')})],
            [RESOURCE_ID.WHEAT_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/wheat-harbor.jpg')})],
            [RESOURCE_ID.ROCK_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/rock-harbor.jpg')})],
            [RESOURCE_ID.ANY_PORT, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/any-harbor.jpg')})],
        ]);
        const resourceMarkerMaterial = new Map([
            [2, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-2.jpg')})],
            [3, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-3.jpg')})],
            [4, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-4.jpg')})],
            [5, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-5.jpg')})],
            [6, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-6.jpg')})],
            [8, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-8.jpg')})],
            [9, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-9.jpg')})],
            [10, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-10.jpg')})],
            [11, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-11.jpg')})],
            [12, new THREE.MeshBasicMaterial({map: this.textureLoader.load('./dist/number-12.jpg')})],
        ]);
        function makeTile(material, x, y) {
            const tile = new THREE.Mesh(tileGeometry, material);
            tile.rotation.x = RADIAN90;
            tile.rotation.y = Math.floor(Math.random() * 6) * 1.0472;
            tile.position.x = x;
            tile.position.y = y;
            return tile;
        }
        function makeHarborTile(material, x, y,  yRotation) {
            const tile = new THREE.Mesh(tileGeometry, material);
            tile.rotation.x = RADIAN90;
            tile.rotation.y =  yRotation * 1.0472;
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
        
        const TILE_TOP_ROW_Y_POS = this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 3.5 : 5;
        let robber;
        const widestRow = this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 5 : 6;
        const tiles = this.board.getTiles();
        tiles.sort((i,j) => i.id - j.id);
        let rowWidth = 3;
        let rowYPosition = TILE_TOP_ROW_Y_POS;
        let rowXStartPosition = -2 * HEXAGON_LEG;
        let increasing = true;
        let totalTilesPlaced = 0;
        let robberCreated = false;
        let row = 0;

        if (this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS) {
            this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[0]), 
                rowXStartPosition - HEXAGON_LEG, rowYPosition + 1.5, 3));
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), 
                rowXStartPosition - HEXAGON_LEG + 2 * HEXAGON_LEG, rowYPosition + 1.5));
            this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[1]), 
                rowXStartPosition - HEXAGON_LEG + 4 * HEXAGON_LEG, rowYPosition + 1.5, 0));
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA),
                rowXStartPosition - HEXAGON_LEG + 6 * HEXAGON_LEG, rowYPosition + 1.5));
        } else {
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), 
                rowXStartPosition - HEXAGON_LEG, rowYPosition + 1.5, 3));
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), 
                rowXStartPosition - HEXAGON_LEG + 2 * HEXAGON_LEG, rowYPosition + 1.5));
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA),
                rowXStartPosition - HEXAGON_LEG + 4 * HEXAGON_LEG, rowYPosition + 1.5));
            this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[0]), 
                rowXStartPosition - HEXAGON_LEG + 6 * HEXAGON_LEG, rowYPosition + 1.5, 0));
        }
        for (let i = 0; i < 3; ++i) {
            this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), 
                rowXStartPosition - HEXAGON_LEG + 2 * i * HEXAGON_LEG, rowYPosition + 1.5));
        }
        while (totalTilesPlaced !== tiles.length) {
            if (this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS) {
                switch(row) {
                    case 1:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[3]), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 1));
                        break;
                    case 3:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[5]), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 2));
                        break;
                    default:
                        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition));
                }
            } else {
                switch(row) {
                    case 0:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[1]), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 1));
                        break;
                    case 3:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[3]), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 2));
                        break;
                    case 5:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[5]), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 2));
                        break;
                    default:
                        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition));
                }
            }
            for (let i = 0; i < rowWidth; ++i) {
                const tileData = tiles[totalTilesPlaced];
                const xPos = rowXStartPosition + 2 * i * HEXAGON_LEG;
                this.scene.add(makeTile(resourceMaterial.get(tileData.resource), xPos, rowYPosition));
                console.log('tile: ', tileData.producer, tileData.resource);
                if (tileData.resource !== RESOURCE_ID.DESERT) {
                    this.scene.add(makeResourceMarker(resourceMarkerMaterial.get(tileData.producer), xPos, rowYPosition));
                } else if (!robberCreated) {
                    const robberGeometry = new THREE.OctahedronGeometry(0.3, 2);
                    robber = new THREE.Mesh(robberGeometry, new THREE.MeshPhongMaterial({color: 0x787878}));
                    robber.position.set(xPos, rowYPosition);
                    this.scene.add(robber);
                    robberCreated = true;
                }
                totalTilesPlaced++;
            }
            if (this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS) {
                switch(row) {
                    case 0:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[2]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 0));
                        break;
                    case 2:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[4]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 5));
                        break;
                    case 4:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[6]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 5));
                        break;
                    default:
                        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition));
                }
            } else {
                switch(row) {
                    case 1:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[2]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 0));
                        break;
                    case 4:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[4]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 5));
                        break;
                    case 6:
                        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[6]), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition, 5));
                        break;
                    default:
                        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), rowXStartPosition + 2 * rowWidth * HEXAGON_LEG, rowYPosition));
                }
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
            row++;
        }
        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[7]), 
            rowXStartPosition - 2 * HEXAGON_LEG, rowYPosition, 3));
        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA), 
            rowXStartPosition - 2 * HEXAGON_LEG + 2 * HEXAGON_LEG, rowYPosition));
        this.scene.add(makeHarborTile(resourceMaterial.get(this.board.getPorts()[8]), 
            rowXStartPosition - 2 * HEXAGON_LEG + 4 * HEXAGON_LEG, rowYPosition, 4));
        this.scene.add(makeTile(resourceMaterial.get(RESOURCE_ID.SEA),
            rowXStartPosition - 2 * HEXAGON_LEG + 6 * HEXAGON_LEG, rowYPosition));

        const light = new THREE.DirectionalLight(0xFFFFFF, 1);
        light.position.set(0, 0, 4);
        this.scene.add(light);

        const light2 = new THREE.AmbientLight(0xFFFFFF, 1);
        light2.position.set(0, -3, 0.2);
        this.scene.add(light2);
    }

    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    render() {
        if (this.resizeRendererToDisplaySize(this.renderer)) {
            this.camera.aspect = getAspectRatio(this.canvas);
            this.camera.updateProjectionMatrix();
            const gameUnitHexagonWidth = this.boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 
                5 * HEXAGON_LEG : 6 * HEXAGON_LEG;
            console.log('canvas width', this.canvas.width);
            // Notes for deriving this formula is in my notebook 
            const menuWidth = (getAspectRatio(this.canvas) * cameraZPosition * TAN50DEG - gameUnitHexagonWidth) * this.canvas.width /
                (2 * getAspectRatio(this.canvas) * cameraZPosition * TAN50DEG) - 10;
            this.menuManager.updateWidth(menuWidth);
            this.logManager.updateWidth(menuWidth);
        }
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }
};

  

// const coordinateMap = generateCoordinateMap(6);
// 
//     function makeCity(material, node) {
//         const geometry = new THREE.DodecahedronGeometry(0.25);
//         const city = new THREE.Mesh(geometry, material);
//         const coordinate = coordinateMap.get(node);
//         city.position.x = coordinate.x;
//         city.position.y = coordinate.y;
//         city.position.z = 0.1;
//         staticSpinnables.push(city);
//         scene.add(city);
//         const settlement = settlements.get(node);
//         scene.remove(settlement);
//     }

//     coordinateMap.forEach((val, key) => {
//         if(Math.floor(Math.random() * 2) < 1) {
//             makeCity(material, key);
//         }
//     });

//     function decideOrientation(edge) {
//         const nodeOne = this.board.getNodes().get(edge.nodeOneId);
//         const nodeTwo = board.getNodes().get(edge.nodeTwoId);
//         const rowOne = nodeOne.determineRow();
//         const rowTwo = nodeTwo.determineRow();
//         const colOne = nodeOne.determineCol();
//         const colTwo = nodeTwo.determineCol();
//         const yCoordinate = boardSize === BOARD_SIZE.SIZE_4_PLAYERS ? 4 : 5.5;

//         if (colOne === colTwo) {
//             return [RADIAN90, ]
//         } else {
//             const smallerCol = Math.min(colOne, colTwo);
//             if (boardSize === BOARD_SIZE.SIZE_4_PLAYERS) {
//                 if (smallerCol % 2 === 0) {
//                     return [RADIAN30];
//                 } else {
//                     return [-1 * RADIAN30];
//                 }
//             } else {
//                 if (smallerCol % 2 === 1) {
//                     return [RADIAN30];
//                 } else {
//                     return [-1 * RADIAN30];
//                 }
//             }
            
//         }
//     }
//     let road;
//     function makeRoad(material, id) {
//         const geometry = new THREE.BoxGeometry(0.7, 0.15, 0.1);
//         road = new THREE.Mesh(geometry, material);
//         road.position.z = 0.1;
//         road.position.y = 1;
//         road.rotation.z = RADIAN30;
//         scene.add(road);
//     }

//     makeRoad(material);