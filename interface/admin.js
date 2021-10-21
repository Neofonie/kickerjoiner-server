let settings;
let myClientId = -1;

function HRDate(timestamp) {
    const a = new Date(timestamp * 1000);
    const year = a.getFullYear();
    const month = (a.getMonth() + 1).toString().padStart(2, '0');
    const day = a.getDate().toString().padStart(2, '0');
    const hour = a.getHours().toString().padStart(2, '0');
    const min = a.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${min}`;
}

async function deleteGame(gameID) {
    await db('DELETE', '/games/' + gameID);

    sendMessage({
        message: 'GAME_UPDATE',
        gameid: gameID,
        reason: 'delete game',
    });
}

async function deleteJoiner(joinerID, gameID) {
    const game = await db('GET', '/games/' + gameID);
    const filteredJoiner = game.joiner.filter((player) => (player.id !== joinerID));
    await db('PATCH', '/games/' + gameID, {
        joiner: filteredJoiner,
    });

    sendMessage({
        message: 'GAME_UPDATE',
        gameid: gameID,
        joinerid: joinerID,
        reason: 'delete joiner',
    });
}

async function setGOGOGO(joinerID, gameID) {
    sendMessage({
        message: 'GOGOGO',
        gameid: gameID,
        joinerid: joinerID,
    });
}

async function getSettings() {
    settings = await db('GET', '/settings/');
}

async function getGames() {
    // donedate = 0 // no gogogo happens
    // donedate = 1605959577 // gogogo happens
    //const showLastHourGames = Math.floor(Date.now() / 1000) - 3600; // 3600 = 1h in sec
    //const games = await db('GET', `/games?donedate_gte=${showLastHourGames}&_sort=date&_order=desc`);
    const games = await db('GET', `/games?_sort=date&_order=desc`);
    const $games = document.querySelector('.games .templates');
    // reset
    $games.innerHTML = '';
    if (games.length === 0) {
        $games.innerHTML = '<span empty>No Games available. Join one!</spanempty>';
    } else {
        games.map((game) => {
            const html = tplGame(game, settings);
            $games.innerHTML += html;
        });
    }
}

async function updateClients(clients) {
    if (clients) {
        const $clients = document.querySelector('.clients .templates');
        $clients.innerHTML = '';
        if (!clients || clients.length === 0) {
            $clients.innerHTML = '<tr><td colspan="100" empty center>No Clients available.</td></tr>';
        } else {
            clients.map((client) => {
                client.isThisYou = client.id === myClientId;
                const html = tplClient(client);
                $clients.innerHTML += html;
            });
        }
    }
}

async function init() {
    await getSettings();
    await getGames();

    connectToWSS((data) => {
        console.log('connectToWSS refresh', data)
        switch (data.message) {
            case 'CONNECTION_ON': // connection with server is on
                myClientId = data.clientid;
                const lsNickName = localStorage.getItem('nickname');
                if (lsNickName !== null) {
                    document.querySelector('.clients input[name=clientnick]').value = lsNickName;
                    document.querySelector('.joiner input[name=nick]').value = lsNickName;
                    sendClientNick(lsNickName);
                }
                break;
            case 'GAME_UPDATE': // joined game got an update
                getGames();
                break;
            case 'GAME_READY': // four joiners in one game
                getGames();
                break;
            case 'GAME_GOGOGO': // all four joiners pressed gogogo in one game
                getGames();
                break;
            case 'CLIENT_UPDATE':
                updateClients(data.clients);
                break;
            case 'ERROR':
                document.querySelector('#error').innerHTML = JSON.stringify(data, null, 2);
                break;
            case 'CLOSE':
                break;
        }
    });
}

init();
