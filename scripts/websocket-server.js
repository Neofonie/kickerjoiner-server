const WebSocket = require("ws");
const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
    { name: 'port', alias: 'p', type: Number },
]);
const port = options.port;
const host = '0.0.0.0';
console.log('hi there kickerjoiner websocket', host, port);

let wss = null;
let isAlive = false;
let interval = null;

function noop() {
}

function heartbeat() {
    isAlive = true;
    console.log('on.pong -> heartbeat')
    return "ping";
}

function getTimestampNow() {
    return Math.floor(Date().now / 1000);
}

function initWSS() {
    console.log('initWSS')
    if (wss !== null) {
        clearInterval(interval);
        interval = null;
    }

    wss = new WebSocket.Server({ host, port });

    wss.on('connection', (client) => {
        // set id
        client.id = client._socket._handle.fd;
        console.log('on.connection')
        client.isAlive = true;

        client.on('message', (data) => {
            console.log('on.message', client.id)
            const msg = JSON.parse(data);
            let message = '';
            let gameid = -1;
            switch (msg.type) {
                // required: msg.nick
                case 'PLUS_ONE':
                    // GET fetch
                    // if running GAME -> return GAME_ID
                    //  POST /db/games/GAME_ID/joiner
                    //  {client_id: client.id, nick: msg.nick, date: getTimestampNow(), gogogo: false}

                    // if no running GAME
                    //  POST /db/games -> get GAME_ID
                    //  {date: getTimestampNow(), done: false, joiner: [
                    //      {client_id: client.id, nick: msg.nick, date: getTimestampNow(), gogogo: false}
                    //  ]}

                    message = 'GAME_UPDATE';
                    gameid = 1;

                    // if joiner.gogogo === false && .length === 4
                    //    MESSAGE = 'GAME_READY';
                    break;
                case 'GOGOGO':
                    // PATCH /db/games/GAME_ID/joiner/CLIENTID -> gogogo:true

                    message = 'GAME_UPDATE';
                    gameid = 1;

                    // if joiner.gogogo === false && .length === 4
                    //    MESSAGE = 'GAME_GOGOGO';
                    break;
            }

            if (!!message) {
                // answer all clients
                wss.clients.forEach((otherClient) => {
                    client.send(JSON.stringify({
                        message,
                        gameid,
                        date: getTimestampNow(),
                    }));
                });
            }
        });
        // send connected
        client.send(JSON.stringify({
            message: 'CONNECTION_ON',
            date: getTimestampNow(),
            clientid: client.id,
        }));

        // keep alive heartbeat
        // interval = setInterval(function ping() {
        //     wss.clients.forEach(function each(otherClient) {
        //         if (client.isAlive === false) {
        //             return otherClient.terminate();
        //         }
        //         otherClient.isAlive = false;
        //         otherClient.ping(noop);
        //     });
        // }, 30000);

        wss.on('close', () => {
            console.log('on.close')
            //clearInterval(interval);
        });

        client.on('pong', heartbeat);
    });
}

initWSS();
