const WebSocket = require("ws");

const onlineApi = 'http://kij.willy-selma.de/db';
const wsApi = 'wss://kij.willy-selma.de/ws';

let pingTimeout = null;
let socket;

function heartbeatClient() {
    console.log('heartbeatClient');
    if (pingTimeout !== null) {
        clearTimeout(pingTimeout);
    }

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    pingTimeout = setTimeout(() => {
        if (socket) {
            console.log('heartbeatClient.terminate');
            socket.terminate();
        }
    }, 30000 + 1000);
}

function connectToWSS() {
    console.log('connectToWSS', wsApi);
    socket = new WebSocket(wsApi);

    socket.onmessage = (event) => {
        const data = event.data;
        console.log('connectToWSS.socket.onmessage', data);
    };

    socket.onopen = () => {
        console.log('connectToWSS.socket.onopen');
        heartbeatClient();
    };
    socket.onclose = () => {
        console.log('connectToWSS.socket.onclose');
        clearTimeout(pingTimeout);
    };
    socket.onerror = (e) => {
        console.log('connectToWSS.socket.onerror', e.message);
    };
    socket.onping = heartbeatClient;
}

connectToWSS();
