require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const oauth = require('oauth-1.0a');
const twitter = require('twitter');
const fs = require('fs');
const path = require('path');

const trackDir = 'track';
const framesDir = './frames';
const lastFrameNr = 31701;
const tweetUrl = 'https://api.twitter.com/2/tweets';

const oauthClient = oauth({
  consumer: { key: process.env.CONSUMERKEY, secret: process.env.CONSUMERSECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const mediaClient = new twitter({
  consumer_key: process.env.CONSUMERKEY,
  consumer_secret: process.env.CONSUMERSECRET,
  access_token_key: process.env.ACCESSTOKEN,
  access_token_secret: process.env.ACCESSSECRET,
});

let trackNr = fs.readFileSync(path.resolve(__dirname, trackDir), 'utf8', (err) => {
  if (err) throw err;
}).replace(/[\n]/g, "");

if (+trackNr > lastFrameNr) throw 'Koniec klatek';

fs.writeFileSync(path.resolve(__dirname, trackDir), (+trackNr + 1).toString(), (err) => {
  if (err) throw err;
});

const imageData = fs.readFileSync(path.resolve(__dirname, `${framesDir}/${trackNr}.jpg`));

mediaClient.post('media/upload', { media: imageData }, (err, res) => {
  if (err) throw err;
  const tweetData = {
    url: tweetUrl,
    method: 'POST',
    data: {
      text: `${trackNr} of ${lastFrameNr}`,
      media: {
        media_ids: [`${res.media_id_string}`],
      },
    },
  };

  const postTweet = axios({
    headers: oauthClient.toHeader(oauthClient.authorize({ includeBodyHash: true, ...tweetData }, { key: process.env.OAUTHTOKEN, secret: process.env.OAUTHSECRET })),
    ...tweetData,
  }).then((res) => {
    console.log(res.data);
  });
});
