const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rp = require('request-promise');

var app = express();
app.use(bodyParser.json());

// Ping Server
app.get('/', (req, res) => (res.send('Hello World')))

// Get IDs of top 10 stories
app.get('/top', (req, res) => {
  rp('https://hacker-news.firebaseio.com/v0/topstories.json')
    .then((body) => {
      const stories = JSON.parse(body).slice(0, 10);
      res.send(stories);
    })
    .catch((error) => (console.log(error)))
});

app.listen(8080);
console.log("The server is now running on port 8080.");