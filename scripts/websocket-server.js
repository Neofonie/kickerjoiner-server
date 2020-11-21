const WebSocket = require("ws");
const fetch = require('node-fetch');
const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
    { name: 'type', alias: 't', type: String },
    { name: 'port', alias: 'p', type: Number },
    { name: 'db', alias: 'd', type: Number },
]);
const maxJoiner = 4;
const port = options.port;
const dbNr = options.db || '';
const host = '0.0.0.0';
const onlineApi = `https://kij.willy-selma.de/db${dbNr}`;
console.log('hi there kickerjoiner websocket', host, port, onlineApi);

let wss = null;
let interval = null;

function noop() {
}

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

const createNewGame = async (newjoiner) => {
    return await db('POST', '/games', {
        date: getTimestampNow(),
        done: false,
        donedate: 0,
        joiner: [newjoiner],
    });
}

async function handlePlusOne(clientId, nickName) {
    console.log('handlePlusOne', arguments);

    let answer = {
        gameid: -1,
        message: '',
    };

    // - GET fetch active games
    let newjoiner = { id: 1, clientid: clientId, nick: nickName, date: getTimestampNow(), gogogo: false };
    // get only active games, newest first
    const games = await db('GET', '/games?done=false&_sort=date&_order=desc');
    let noFreeGames = false;
    // # if running GAME -> return GAME_ID
    if (games.length !== 0) {
        let joined = false;
        let freeGames = 0;
        games.map((game) => {
            const gogogoGamers = game.joiner.filter((gamer) => gamer.gogogo === true);
            let joiner;
            // join the game via +1
            if (game.joiner.length < maxJoiner && !joined) {
                // add unique id
                newjoiner.id = game.joiner[game.joiner.length - 1].id + 1;
                // merge them together
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
            // all joiner set +1
            if (joiner && joiner.length === maxJoiner && gogogoGamers.length === 0) {
                answer.gameid = game.id;
                answer.message = 'GAME_READY';
            }

            if (game.joiner.length < maxJoiner) {
                freeGames++;
            }
            return game;
        });

        if (freeGames === 0) {
            noFreeGames = true;
        }
    }
    // create new game
    // when no active game
    // no free game, max 4 joiner
    if (games.length === 0 || noFreeGames) {
        const game = await createNewGame(newjoiner);
        answer.gameid = game.id;
        answer.message = 'GAME_UPDATE';
    }

    console.log(answer);
    return answer;
}

async function handleGoGoGo(joinerId, gameId) {
    console.log('handleGoGoGo', arguments);
    const answer = {
        gameid: -1,
        message: '',
    };

    const game = await db('GET', '/games/' + gameId);
    const joiner = game.joiner.map((joiner) => {
        if (joiner.id === joinerId) {
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
    if (joiner.length === maxJoiner && gogogoGamers.length === maxJoiner) {
        await db('PATCH', '/games/' + game.id, {
            done: true,
            donedate: getTimestampNow(),
        });
        answer.message = 'GAME_GOGOGO';
    } else {
        answer.message = 'GAME_UPDATE';
    }
    answer.gameid = game.id;
    return answer;
}

async function handleGameUpdate(joinerId, data) {
    console.log('handleGameUpdate', arguments);
    const answer = {
        ...data,
    };
    return answer;
}

function initWSS() {
    console.log('initWSS')

    wss = new WebSocket.Server({ host, port });

    wss.on('connection', (ws) => {
        ws.id = ws._socket._handle.fd;
        ws.isAlive = true;
        ws.date = getTimestampNow();
        console.log('wss.connection', ws.id);

        ws.on('message', async (raw) => {
            console.log('on.message', ws.id, raw);
            const data = JSON.parse(raw);
            let answer;
            switch (data.message) {
                case 'PLUS_ONE':
                    answer = await handlePlusOne(ws.id, data.nick);
                    break;
                case 'GOGOGO':
                    answer = await handleGoGoGo(data.joinerid, data.gameid);
                    break;
                case 'GAME_UPDATE':
                    answer = await handleGameUpdate(ws.id, data);
                    break;
            }

            if (answer.message !== '') {
                // answer all clients
                wss.clients.forEach((otherClient) => {
                    otherClient.send(JSON.stringify({
                        ...answer,
                        yourClientId: otherClient.id,
                        triggeredThroughClient: ws.id,
                        date: getTimestampNow(),
                    }));
                });
            }
        });
        // const clients = [];
        // wss.clients.forEach((ws, index) => {
        //     clients.push({
        //         id: ws.id,
        //         isAlive: ws.isAlive,
        //     });
        // });
        // send connected
        ws.send(JSON.stringify({
            message: 'CONNECTION_ON',
            date: getTimestampNow(),
            clientid: ws.id,
            //clients,
        }));

        ws.on('pong', heartbeat);
    });

    interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            ws.date = getTimestampNow();
            if (ws.isAlive === false) {
                return ws.terminate();
            }
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