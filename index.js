// @see https://www.digitalocean.com/community/tutorials/how-to-implement-caching-in-node-js-using-redis

const express = require('express');
const axios = require('axios');

/*
const redis = require('redis');

const client = redis.createClient({
  host: 'redis-server',
  port: 6379,
});
client.on('connect', () => {
  console.log(`redis-server is connected. set 'foo' to 0.`);
  client.set('foo', 0);
});
client.on('error', (error) => {
  console.error(error);
});
*/

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('hello');
  /*
    client.get('foo', (error, value) => {
        if(error) {
            console.error(error);
            res.send(`There is something wrong when redis client tried to get 'foo'`);
            return;
        }

        res.send(`'foo': ${value} on redis-server will be increased each time you refresh this page.`); 

        client.set('foo', parseInt(value, 10) + 1);
    });
    */
});

app.get('/fish/:species', getSpeciesData);

app.listen(port, () => {
  console.log(`Express App Listening on port ${port}`);
});

async function getSpeciesData(req, res) {
  const species = req.params.species;
  let results;

  try {
    results = await fetchApiData(species);
    if (results.length === 0) {
      throw 'API returned an empty array';
    }

    res.send({
      fromCache: false,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send('Data unavailable');
  }
}

async function fetchApiData(species) {
  const apiResponse = await axios.get(`https://www.fishwatch.gov/api/species/${species}`);
  console.log('Request sent to the API');
  return apiResponse.data;
}
