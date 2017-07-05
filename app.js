const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');

var app = express();
app.use(bodyParser.json());

// Ping Server
app.get('/', (req, res) => (res.send('Hello World')))

// Get IDs of top 10 stories
app.get('/top', (req, res) => {
  request('https://hacker-news.firebaseio.com/v0/topstories.json', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      // Get array of top 10 stories from body
      const stories = JSON.parse(body).slice(0, 10);
      console.log(stories)
      res.send(stories);
    }
  })
});

app.listen(8080);
console.log("The server is now running on port 8080.");
