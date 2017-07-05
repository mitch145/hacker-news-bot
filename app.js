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
  // Get top story IDs
  rp('https://hacker-news.firebaseio.com/v0/topstories.json')
    .then((body) => {
      // Only keep top 10 stories
      const stories = JSON.parse(body).slice(0, 10);
      // Get story objects from stories array
      getStories(stories)
        .then((mappedStories) => (res.send(mappedStories)))
        .catch((error) => (console.log(error)))
    })
    .catch((error) => (console.log(error)))
});

// Take array of story IDs and return array of story objects
const getStories = stories => {
  return Promise.all(
    stories.map(
      (story) => (rp(`https://hacker-news.firebaseio.com/v0/item/${story}.json`)
        .then((data) => (JSON.parse(data)))
      )
    )
  )
}

app.listen(process.env.PORT || 8080);
console.log("The server is now running on port 8080.");