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

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'thisisatoken') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }  
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function receivedMessage(event) {
  // Putting a stub for now, we'll expand it in the following steps
  console.log("Message data: ", event.message);
}

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