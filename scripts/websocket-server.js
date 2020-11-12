const WebSocket = require("ws");
const fetch = require('node-fetch');
const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
    { name: 'type', alias: 't', type: String },
    { name: 'port', alias: 'p', type: Number },
    { name: 'db', alias: 'd', type: Number },
]);

const port = options.port;
const dbNr = options.db || '';
const host = '0.0.0.0';
const onlineApi = `https://kij.willy-selma.de/db${dbNr}`;
console.log('hi there kickerjoiner websocket', host, port, onlineApi);

let wss = null;
let interval = null;

function noop() {}

function heartbeat() {
    this.isAlive = true;
    console.log('ws.pong -> heartbeat', this.id)
}

function getTimestampNow() {
    return Math.floor(Date.now() / 1000);
}

async function db(method, url, data) {
    return await fetch(onlineApi + url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then((res) => res.json());
}

async function handlePlusOne(clientId, nickName) {
    console.log('handlePlusOne', arguments);

    let answer = {
        gameid: -1,
        message: '',
    };

    // - GET fetch active games
    const newjoiner = { client_id: clientId, nick: nickName, date: getTimestampNow(), gogogo: false };
    // get only active games, newest first
    const games = await db('GET', '/games?done=false&_sort=date&_order=desc');
    // # if running GAME -> return GAME_ID
    if (games.length !== 0) {
        let joined = false;
        games.map((game) => {
            const gogogoGamers = game.joiner.filter((gamer) => gamer.gogogo === true);
            let joiner;
            // join the game
            if (game.joiner.length < 4 && !joined) {
                joiner = [
                    ...game.joiner,
                    newjoiner,
                ];
                db('PATCH', '/games/' + game.id, {
                    joiner,
                });
                answer.gameid = game.id;
                answer.message = 'GAME_UPDATE';
                joined = true;
            }

            if (joiner.length === 4 && gogogoGamers.length === 0) {
                answer.gameid = game.id;
                answer.message = 'GAME_READY';
            }
            return game;
        });
    }
    // create new game
    // when no active game
    // no free game, max 4 joiner
    if (games.length === 0) {
        const game = await db('POST', '/games', {
            date: getTimestampNow(),
            done: false,
            joiner: [newjoiner],
        });
        answer.gameid = game.id;
        answer.message = 'GAME_UPDATE';
    }

    console.log(answer);
    return answer;
}

async function handleGoGoGo(clientId, gameId) {
    console.log('handleGoGoGo', arguments);
    const answer = {
        gameid: -1,
        message: '',
    };

    const game = await db('GET', '/games/' + gameId);
    const joiner = game.joiner.map((joiner) => {
        if (joiner.client_id === clientId) {
            joiner.gogogo = true;
        }
        return joiner;
    });
    // update joiner
    await db('PATCH', '/games/' + game.id, {
        joiner,
    });
    const gogogoGamers = joiner.filter((gamer) => gamer.gogogo === true);
    // send gogogo if all joiner are ready to go
    if (joiner.length === 4 && gogogoGamers.length === 4) {
        await db('PATCH', '/games/' + game.id, {
            done: true,
        });
        answer.message = 'GAME_GOGOGO';
        // answer with udate
    } else {
        answer.message = 'GAME_UPDATE';
    }
    answer.gameid = game.id;
    console.log(answer);
    return answer;
}

function initWSS() {
    console.log('initWSS')

    wss = new WebSocket.Server({ host, port });

    wss.on('connection', (ws) => {
        ws.id = ws._socket._handle.fd;
        ws.isAlive = true;
        console.log('wss.connection', ws.id);

        ws.on('message', async (raw) => {
            console.log('on.message', ws.id, raw);
            const data = JSON.parse(raw);
            let answer;
            switch (data.message) {
                // required: data.nick
                case 'PLUS_ONE':
                    answer = await handlePlusOne(ws.id, data.nick);
                    break;
                // required: data.gameid
                case 'GOGOGO':
                    answer = await handleGoGoGo(ws.id, data.gameid);
                    break;
            }

            if (!!answer.message) {
                // answer all clients
                wss.clients.forEach((otherClient) => {
                    otherClient.send(JSON.stringify({
                        message: answer.message,
                        gameid: answer.gameid,
                        yourClientId: otherClient.id,
                        triggeredThroughClient: ws.id,
                        date: getTimestampNow(),
                    }));
                });
            }
        });
        // send connected
        ws.send(JSON.stringify({
            message: 'CONNECTION_ON',
            date: getTimestampNow(),
            clientid: ws.id,
        }));

        ws.on('pong', heartbeat);
    });

    interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping(noop);
        });
    }, 30000);

    wss.on('close', () => {
        console.log('wss.close')
        clearInterval(interval);
    });
}

initWSS();