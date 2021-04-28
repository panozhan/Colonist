import io from 'socket.io-client';
import setupLobby from './lobby';
import runGame from './game';

const games = ['Alex test game - with a very freaking long name lol xyz'];

window.onload = event => {
    // socket.emit('chat message', input.value);
    const socket = io({autoConnect: false});
    setupLobby(socket, runGame);
    socket.connect();
}