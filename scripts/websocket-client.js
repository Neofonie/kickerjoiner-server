const WebSocket = require("ws");
const onlineApi = 'https://kij.willy-selma.de/db';
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
    // pingTimeout = setTimeout(() => {
    //     if (socket) {
    //         console.log('heartbeatClient.terminate');
    //         socket.terminate();
    //     }
    // }, 30000 + 1000);
}

function connectToWSS() {
    console.log('connectToWSS', wsApi);
    socket = new WebSocket(wsApi);

    socket.onmessage = (event) => {
        console.log('connectToWSS.socket.onmessage', data);
        const data = JSON.parse(event.data);
        console.log(data);
        switch (data.message) {
            case 'CONNECTION_ON': // connection with server is on
                // store date && clientid
            break;
            case 'GAME_UPDATE': // joined game got an update
                // store data.gameid to compare joined game
                // ----
                // GET fetch /db/games/data.gameid
                // refresh state to rerender
            break;
            case 'GAME_READY': // four joiners in one game
                // now activate gogogo button
                // vibrate app
                // ----
                // GET fetch /db/games/data.gameid
                // refresh state to rerender
            break;
            case 'GAME_GOGOGO': // all four joiners pressed gogog in one game
                // vibrate app
                // gogogo screen
                // ----
                // GET fetch /db/games/data.gameid
                // refresh state to rerender
                // ----
                // clear state for new game
            break;
        }
    };

    // socket.send(JSON.stringify({
    //  message: 'PLUS_ONE',
    //  nick: 'joiner name',
    // }));

    // socket.send(JSON.stringify({
    //  message: 'GOGOGO',
    //  gameid: GAME_ID,
    // }));

    // connection to server
    socket.onopen = () => {
        console.log('connectToWSS.socket.onopen');
        heartbeatClient();
    };
    // connection closes
    socket.onclose = () => {
        console.log('connectToWSS.socket.onclose');
        clearTimeout(pingTimeout);
    };
    // no connection to server
    socket.onerror = (e) => {
        console.log('connectToWSS.socket.onerror', e.message);
    };
    // ping pong with server to stay in connection
    socket.onping = heartbeatClient;
}

connectToWSS();
