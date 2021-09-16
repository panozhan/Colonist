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