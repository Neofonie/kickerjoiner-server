import WebSocket from 'ws';
import commandLineArgs from 'command-line-args';
import {EventEmitter} from 'events';

export default class KickerJoinerServer {
    constructor(options) {
        //
        this.defaults = {
            port: 61234,
            host: '0.0.0.0',
            baseURL: 'https://kij.willy-selma.de/db',
        }

        //
        this.options = {
            ...this.defaults,
            ...commandLineArgs([
                {
                    name: 'port',
                    alias: 'p',
                    type: Number
                },
            ])
        }

        this.event = new EventEmitter();
        this.engine = null;
        this.isAlive = false;
        this.interval = null;
        this.clients = [];

        this.engine = new WebSocket.Server({
            host: this.options.host,
            port: this.options.port
        });

        this.engine.on('connection', client => {
            client.id = client._socket._handle.fd;
            client.isAlive = true;

            // events
            client.on('message', raw => this.onMessage(client, raw));
            client.on('close', () => this.removeClient(client));
            client.on('pong', () => this.heartbeat(client));

            // send welcome message
            this.send(client, {
                message: 'CONNECTION_ON',
                date: this.getTimestampNow(),
                clientId: client.id,
            });

            // add client to the client stack
            this.clients.push(client);
        });

        // register messages as events
        //
        this.on('PLUS_ONE', (client, data) => {
            const message = 'GAME_UPDATE';
            const gameId = 1;

            this.sendAll({
                message,
                gameId,
                date: this.getTimestampNow(),
            });

            // - GET fetch active games
            // const game = db('GET', '/games')
            // # if running GAME -> return GAME_ID
            // gameid = game.id;
            // - PATCH /db/games/GAME_ID/joiner
            // const newjoiner = {client_id: client.id, nick: data.nick, date: getTimestampNow(), gogogo: false};
            // this.db('PATCH', '/games/'+ gameid, {joiner: [...game.joiner, newjoiner]}).then();

            // if no running GAME
            //  POST /db/games -> get GAME_ID
            //  {date: getTimestampNow(), done: false, joiner: [
            //      {client_id: client.id, nick: data.nick, date: getTimestampNow(), gogogo: false}
            //  ]}

            // message = 'GAME_UPDATE';
            // gameid = 1;

            // if joiner.gogogo === false && .length === 4
            //    MESSAGE = 'GAME_READY';
        });

        //
        this.on('GOGOGO', (client, data) => {
            const message = 'GAME_UPDATE';
            const gameId = 1;

            this.sendAll({
                message,
                gameId,
                date: this.getTimestampNow(),
            });

            // PATCH /db/games/GAME_ID/joiner/CLIENTID -> gogogo:true

            // message = 'GAME_UPDATE';
            // gameid = 1;

            // if joiner.gogogo === false && .length === 4
            //    MESSAGE = 'GAME_GOGOGO';
        });
    }

    removeClient(client) {
        this.clients = this.clients.filter(c => c.id !== client.id);
    }

    heartbeat() {
        this.isAlive = true;
        console.log('on.pong -> heartbeat');
        return "ping";
    }

    getTimestampNow() {
        return Math.floor(Date.now() / 1000);
    }

    onMessage(client, raw) {
        console.log('on.message', client.id, raw);
        const data = JSON.parse(raw);

        // elevate the message field as event
        data.message ? this.emit(data.message, client, data) : null;
    }

    send(client, data) {
        const message = JSON.stringify(data);
        client.send(message);
    }

    sendAll(data) {
        let message = JSON.stringify(data);
        this.engine.clients.forEach(client => {
            message.clientId = client.id;
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    db(method, url, data) {
        return new Promise((resolve, reject) => {
            fetch(`${this.options.baseURL}${url}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(res => resolve(res.json()))
                .catch(err => resolve(null));
        });
    }

    on() {
        this.event.on.apply(this.event, Array.from(arguments));
    }

    emit() {
        this.event.emit.apply(this.event, Array.from(arguments));
    }
}


// run it
new KickerJoinerServer({
    //...
});
