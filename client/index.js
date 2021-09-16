import io from 'socket.io-client';
import setupLobby from './lobby';

const games = ['Alex test game - with a very freaking long name lol xyz'];

window.onload = event => {
    // socket.emit('chat message', input.value);
    const socket = io({autoConnect: false});
    setupLobby(socket);
    socket.connect();
}