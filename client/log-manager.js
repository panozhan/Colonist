export default class LogManager {
    constructor() {
        this.logPanel = document.getElementById('log-panel');
        this.logPanel.style.display = 'flex';

    }

    updateWidth(width) {
        console.log('updating menu width');
        this.logPanel.style.width = `${width}px`;
        // this.botLeftBar.style.width = `${width}px`;
        // this.rightBar.style.width = `${width - 100}px`;
    }
}