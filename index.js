const express = require('express');
const redis = require('redis');

const client = redis.createClient({
    host:'redis-server',
    port: 6379
});
client.on('connect', () => {
    console.log(`redis-server is connected. set 'foo' to 0.`);
    client.set('foo', 0);
});
client.on('error', (error) => {
    console.error(error);
});

const app = express();
app.get('/', (req, res) => {
    client.get('foo', (error, value) => {
        if(error) {
            console.error(error);
            res.send(`There is something wrong when redis client tried to get 'foo'`);
            return;
        }

        res.send(`'foo': ${value} on redis-server will be increased each time you refresh this page.`); 

        client.set('foo', parseInt(value, 10) + 1);
    });
});

app.listen(8080, () => {
    console.log('Listening on port 8080');
});