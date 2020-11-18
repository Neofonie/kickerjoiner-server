let settings;

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
    const game = await db('GET', '/games/' + gameID);
    const gogogoPlayer = game.joiner.map((player) => {
        if (player.id === joinerID) {
            player.gogogo = true;
        }
        return player;
    });
    await db('PATCH', '/games/' + gameID, {
        joiner: gogogoPlayer,
    });

    sendMessage({
        message: 'GAME_UPDATE',
        gameid: gameID,
        joinerid: joinerID,
        reason: 'gogogo joiner',
    });
}

async function getSettings() {
    settings = await db('GET', '/settings/');
}

async function getGames() {
    const games = await db('GET', '/games?done=false&_sort=date&_order=desc');
    const $games = document.querySelector('.games .templates');
    // reset
    $games.innerHTML = '';
    if (games.length === 0) {
        $games.innerHTML = '<span empty>No Games available. Join one!</spanempty>';
    } else {
        games.map((game) => {
            let isGogogo = false;
            if (game.joiner.length === settings.maxjoiner) {
                isGogogo = true;
            }
            const html = tplGame(game, isGogogo);
            $games.innerHTML += html;
        });
    }
}

async function setClients(clients) {
    const $clients = document.querySelector('.clients .templates');
    $clients.innerHTML = '';
    console.log(clients)
    if (!clients || clients.length === 0) {
        $clients.innerHTML = '<tr><td colspan="100" empty center>No Clients available.</td></tr>';
    } else {
        clients.map((client) => {
            const html = tplClient(client);
            $clients.innerHTML += html;
        });
    }
}

async function init() {

    await getSettings();
    await getGames();

    connectToWSS((data) => {
        console.log('connectToWSS refresh', data)
        switch (data.message) {
            case 'CONNECTION_ON': // connection with server is on
                if (data.clients) {
                    setClients(data.clients);
                }
                break;
            case 'GAME_UPDATE': // joined game got an update
                getGames();
                if (data.clients) {
                    setClients(data.clients);
                }
                break;
            case 'GAME_READY': // four joiners in one game
                getGames();
                break;
            case 'GAME_GOGOGO': // all four joiners pressed gogog in one game
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