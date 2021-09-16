export default class CardManager {
    constructor() {
        this.cardPanel = document.getElementById('card-panel');
        this.cardPanel.style.display = 'flex';
        this.detailedCard = document.createElement('div');
        this.detailedCard.style = 'width: 282px; height: 436px; background-size: cover; position: absolute; top:50%; left:50%; margin-top: -50px; margin-left: -141px; margin-top: -218px; display:none;';
        document.getElementsByTagName('body')[0].appendChild(this.detailedCard);
        this.darkenedOverlay = document.getElementById('darkened-overlay');
        
    }

    // param: PlayerHand
    updatePlayerHand(hand) {
        const addCards = (num, img) => {
            // width to height ratio
            const ratio = 0.646789;
            const cardWidth = this.cardPanel.offsetHeight * ratio;
            for (let i = 0; i < num; ++i) {
                const card = document.createElement('div');
                card.style = `background-image: url("${img}"); background-size: cover; width: ${cardWidth}px; height:100%; display:inherit;`;
                this.cardPanel.appendChild(card);
                card.addEventListener('mouseover', () => {
                    this.detailedCard.style.display = 'block';
                    this.detailedCard.style.backgroundImage = `url(${img})`;
                    this.darkenedOverlay.style.display = 'block';
                });
                card.addEventListener('mouseout', () => {
                    this.detailedCard.style.display = 'none';
                    this.darkenedOverlay.style.display = 'none';
                });
            }
        }
        addCards(hand.numBrick, './dist/brick-card.jpg');
        addCards(hand.numWood, './dist/forest-card.jpg');
        addCards(hand.numWheat, './dist/wheat-card.jpg');
        addCards(hand.numSheep, './dist/sheep-card.jpg');
        addCards(hand.numRock, './dist/rock-card.jpg');
        addCards(hand.numYearOfPlenty, './dist/year_of_plenty.jpg');
        addCards(hand.numRoadBuilding, './dist/road_building.jpg');
        addCards(hand.monopoly, './dist/monopoly.jpg');
        addCards(hand.knight, './dist/knight.jpg');
        addCards(hand.numChapel, './dist/chapel.jpg');
        addCards(hand.numPalace, './dist/palace.jpg');
        addCards(hand.numMarket, './dist/market.jpg');
        addCards(hand.numLibrary, './dist/library.jpg');
    }

    updateMenuWidth(width) {
        console.log('updating menu width');
        this.topLeftPanel.style.width = `${width}px`;
        // this.botLeftBar.style.width = `${width}px`;
        // this.rightBar.style.width = `${width - 100}px`;
    }
}