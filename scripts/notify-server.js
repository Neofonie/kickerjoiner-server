// https://serviceworke.rs/push-clients_server_doc.html
const webPush = require('web-push');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const onlineApi = 'https://kij.willy-selma.de/notify';// /subscriptions

/*
await db('PATCH', '/games/' + game.id, {
    joiner,
});
*/

const yargs = require('yargs');
const port = yargs.argv.port;

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

process.env.VAPID_PUBLIC_KEY = 'BDRLaN4vBaYK7WpWutqi-nDFVFLNuu8K1GJKaoA_cd3Rjkd1uSwhHvL3e_MyYPYZ1ZNhmANpKu4pLA7du9_gkmQ';
process.env.VAPID_PRIVATE_KEY = 'IJi-sOAF0wWXUI0jB-ZXoca9fqz8rU8oSWEiRzs2MAI';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY ' +
        'environment variables. You can use the following ones:');
    console.log(webPush.generateVAPIDKeys());
    return;
}

console.log('web push started')

webPush.setVapidDetails(
    'https://kij.willy-selma.de/push/',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();

app.use(express.json())

app.get('/vapidPublicKey', function (req, res) {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

app.post('/register', cors(), async function (req, res) {
    const subscription = req.body.subscription;

    const dbsubscription = await db('POST', '/subscriptions', {
        date: getTimestampNow(),
        subscription,
    });

    // if (!subscriptions[subscription.endpoint]) {
    console.log('Subscription registered', dbsubscription);
    //     subscriptions[subscription.endpoint] = subscription;
    // }

    res.send(JSON.stringify(dbsubscription));
    res.sendStatus(201);
});

app.post('/unregister', cors(), async function (req, res) {
    const subscriptionID = req.body.subscriptionID;

    await db('DELETE', '/subscriptions/' + subscriptionID);

    // if (subscriptions[subscription.endpoint]) {
        console.log('Subscription unregistered', subscriptionID);
        // delete subscriptions[subscription.endpoint];
    // }

    res.sendStatus(201);
});

app.post('/sendNotification', cors({
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    'preflightContinue': false,
    'optionsSuccessStatus': 204
}), async function (req, res) {
    // {"subscription":{"endpoint":"https://fcm.googleapis.com/fcm/send/d_HQmozfajA:APA91bG6F9wTLKNNljdSkvQC9Ltn59ieA8ysE9U6CU9slLKwPv7jqRBXG-EVeyZcC6FMBKQQXA_m8fpS6RkVLijcXPzTwwHOjoerh-WPTRSkXF6UBvX5gWw6YgY6nKZ0TCef2pLbNElK","expirationTime":null,"keys":{"p256dh":"BGQGigvdBNnMmtuT6rrGzqYH7Z9ygnqMhJd-82Twdyg5AcVGR5ojIaVjeFJNpIHJADdmjm5aSRaDluZSfn_W6Zc","auth":"biWhMdqhbuoBQZcoya2ibQ"}},"payload":"commit junge","delay":10,"ttl":86400}
    console.log('sendNotification.req.body', JSON.stringify(req.body))
    const payload = req.body.payload;
    const options = {
        TTL: req.body.ttl || 24 * 60 * 60,
    };
    const subscriptions = await db('GET', '/subscriptions/');

    if (subscriptions !== null) {
        subscriptions.forEach((db) => {
            webPush.sendNotification(db.subscription, payload, options)
                .then(function () {
                    console.log('sendNotification sended', db.id, payload);
                })
                .catch(function (error) {
                    console.error('sendNotification error', error);
                });

        });
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log('[✔] web push --port ' + port);
    console.log('   https://kij.willy-selma.de/push/*');
    console.log('   vapidPublicKey|register|unregister|sendNotification');
});
