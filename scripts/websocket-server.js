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

function noop() {}

function heartbeat() {
    isAlive = true;
    console.log('on.pong -> heartbeat')
}

function initWSS() {
    console.log('initWSS')
    if(wss !== null){
        clearInterval(interval);
        interval = null;
    }

    wss = new WebSocket.Server({ host, port });

    wss.on('connection', (ws) => {
        console.log('on.connection')
        isAlive = true;

        ws.on('message', (data) => {
            console.log('on.message')
            // notifier.notify({
            //     title: 'TOKEN',
            //     message: data,
            //     wait: true,
            //     timeout: 100,
            // });
            ws.send("message recieved");
        });

        ws.send("Connected with kickerjoiner uberspace-Server");

        interval = setInterval(function ping() {
            wss.clients.forEach(function each(ws) {
                if (isAlive === false) return ws.terminate();
                isAlive = false;
                ws.ping(noop);
            });
        }, 30000);

        wss.on('close', () => {
            console.log('on.close')
            clearInterval(interval);
        });

        ws.on('pong', heartbeat);
    });
}

initWSS();
