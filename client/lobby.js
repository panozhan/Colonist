import {SOCKET_CONSTANTS} from '../game/constants';
import CanvasManager from './canvas-manager';

function changeGames(games, onclick) {
    const container = document.getElementById('games-container');
    // Remove all the existing games from our list
    const existingGames = container.getElementsByClassName('existing-game-room');
    for (let i = 0; i < existingGames.length; ++i) {
        container.removeChild(existingGames[i]);
    }
    games.forEach(game => {
        const ele = document.createElement('div');
        ele.classList.add('game-room');
        ele.classList.add('existing-game-room');
        ele.innerText = `Join Existing Game: "${game}"`
        ele.onclick = () => {
            onclick(game);
        };
        container.appendChild(ele);
    });
}

function startGame(boardSize, data, canvasManager) {
    const canvas = document.getElementById('game-canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.getElementById('games-container').style.display = 'none';
    document.getElementById('username').style.display = 'none';
    document.getElementsByTagName('body')[0].style.padding = '0px';
    canvasManager.startGame(boardSize, data);
}

export default function setupLobby(socket) {
    const canvas = document.getElementById('game-canvas');
    const canvasManager = new CanvasManager(canvas, socket);
    socket.on(SOCKET_CONSTANTS.EXISTING_GAMES, (games) => {
        console.log('change games:', games);
        changeGames(games, gameName => {
            console.log('Join game clicked: ' + gameName);
            const username = document.getElementById('username-input').value;
            if (!username) {
                document.getElementById('username-prompt').style.color = 'red';
            } else {
                socket.emit(SOCKET_CONSTANTS.JOIN_GAME, {gameName: gameName, username: username}, (res) => {
                    startGame(6, res.data, canvasManager);
                });
            }
        });
    });

    document.getElementById('new-game').addEventListener('submit', (e) => {
        console.log('submitted');
        e.preventDefault();
        const username = document.getElementById('username-input').value;
        if (!username) {
            document.getElementById('username-prompt').style.color = 'red';
        }
        if (input.value && username) {
            
            socket.emit(SOCKET_CONSTANTS.CREATE_GAME, {gameName: input.value, username: username}, (res) => {
                if (res.success === 1) {
                    startGame(6, res.data, canvasManager);
                } else {
                    document.getElementById('new-game-instruction')
                        .innerText = 'Sorry the game name is already taken. Please choose another name.'
                }
            });
        }
    });
}