export default class MenuManager {
    constructor(buildButtonAction) {
        this.topLeftPanel = document.getElementById('top-left-panel');
        this.buildButton = document.getElementById('build-button');
        this.tradeButton = document.getElementById('trade-button');
        this.developButton = document.getElementById('develop-button');
        this.endTurnButton = document.getElementById('end-turn-button');
        this.topLeftPanel.style.display = 'flex';

        this.isBuildButtonClicked = false;

        this.buildButton.addEventListener('click', () => {
            buildButtonAction(this.isBuildButtonClicked);
        });

        this.hideButtons();
    }

    hideButtons() {
        this.topLeftPanel.style.display = 'none';
    }

    showButtons() {
        this.topLeftPanel.style.display = 'flex';
    }

    updateBuildButtonClickState(state) {
        if (state === 0) {
            this.tradeButton.style.opacity = '50%';
            this.developButton.style.opacity = '50%';
            this.endTurnButton.style.opacity = '50%';
            this.tradeButton.disabled = true;
            this.developButton.disabled = true;
            this.endTurnButton.disabled = true;
            this.buildButton.innerText = 'Cancel';
            this.isBuildButtonClicked = true;
        } else {
            this.tradeButton.style.opacity = '100%';
            this.developButton.style.opacity = '100%';
            this.endTurnButton.style.opacity = '100%';
            this.tradeButton.disabled = false;
            this.developButton.disabled = false;
            this.endTurnButton.disabled = false;
            this.buildButton.innerText = 'Build';
            this.isBuildButtonClicked = false;
        }
        
    }

    updateWidth(width) {
        console.log('updating menu width');
        this.topLeftPanel.style.width = `${width}px`;
        // this.botLeftBar.style.width = `${width}px`;
        // this.rightBar.style.width = `${width - 100}px`;
    }
}