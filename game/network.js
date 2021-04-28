const { HandDelta } = require("./Board");

class TradeParam {
    constructor(params) {
        this.initiator = params.initiator;
        this.partner = params.partner;

        this.giveWood = params.giveWood;
        this.giveWheat = params.giveWheat;
        this.giveRock = params.giveRock;
        this.giveBrick = params.giveBrick;
        this.giveSheep = params.giveSheep;
        
        this.takeWood = params.takeWood;
        this.takeWheat = params.takeWheat;
        this.takeRock = params.takeRock;
        this.takeBrick = params.takeBrick;
        this.takeSheep = params.takeSheep;
    }

    takeHand() {
        return new HandDelta({
            wood: this.takeWood, 
            wheat: this.takeWheat, 
            rock: this.takeRock, 
            brick: this.takeBrick, 
            sheep: this.takeSheep, 
        });
    }

    giveHand() {
        return new HandDelta({
            wood: this.giveWood, 
            wheat: this.giveWheat, 
            rock: this.giveRock, 
            brick: this.giveBrick, 
            sheep: this.giveSheep, 
        });
    }
}

module.exports = {TradeParam}