// @see https://www.digitalocean.com/community/tutorials/how-to-implement-caching-in-node-js-using-redis

const express = require('express');
const { createClient } = require('redis');
const axios = require('axios');

let redisClient;

(async () => {
  redisClient = await createClient({ port: 6379 });
  redisClient
    .on('connect', () => {
      console.log(`redis-server is connected`);
    })
    .on('error', (error) => {
      console.error(error);
    })
    .connect();
})();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('hello, redis practice');
});

app.get('/fish/:species', cacheData, getSpeciesData);

app.listen(port, () => {
  console.log(`Express App Listening on port ${port}`);
});

async function cacheData(req, res, next) {
  const { species } = req.params;

  try {
    // return redis cache
    const cacheResults = await redisClient.get(species);
    if (cacheResults) {
      res.send({
        fromCache: true,
        data: JSON.parse(cacheResults),
      });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404);
  }
}

async function getSpeciesData(req, res) {
  const { species } = req.params;
  console.log('species :', species);

  try {
    const results = await fetchApiData(species);
    if (!results?.length) {
      throw 'API returned an empty array';
    }

    // set redis cache
    // @see https://www.npmjs.com/package/redis#redis-commands
    // @see https://www.digitalocean.com/community/tutorials/how-to-implement-caching-in-node-js-using-redis#step-4-implementing-cache-validity
    await redisClient.set(species, JSON.stringify(results), {
      EX: 30, // accepts a value with the cache duration in seconds.
      NX: true, // when set to true, it ensures that the set() method should only set a key that doesn’t already exist in Redis.
    });

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

/*
async function getSpeciesData(req, res) {
  const { species } = req.params;
  let results;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(species);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
    } else {
      results = await fetchApiData(species);
      if (results.length === 0) {
        throw 'API returned an empty array';
      }

      // @see https://www.npmjs.com/package/redis#redis-commands
      // @see https://www.digitalocean.com/community/tutorials/how-to-implement-caching-in-node-js-using-redis#step-4-implementing-cache-validity
      await redisClient.set(species, JSON.stringify(results), {
        EX: 30, // accepts a value with the cache duration in seconds.
        NX: true, // when set to true, it ensures that the set() method should only set a key that doesn’t already exist in Redis.
      });
    }

    res.send({
      fromCache: isCached,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send('Data unavailable');
  }
}
*/
