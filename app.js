// Vendor Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rp = require('request-promise');
const config = require('./config');

// Custom Dependencies
const helpers = require('./helpers');

const app = express();
app.use(bodyParser.json());

// Ping Server
app.get('/', (req, res) => (res.send('Hello World')))

// Get IDs of top 10 stories
app.get('/v0/top', (req, res) => {
  helpers.getTopStories(0, 3)
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
});

app.get('/v0/top/:id', (req, res) => {
  helpers.getTopStories(parseInt(req.params.id), 1)
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/top/:id/redirect', (req, res) => {
  helpers.getTopStories(req.params.id, 1)
    .then((mappedStories) => (res.redirect(mappedStories[0].url)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === 'thisisatoken') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/v0/webhook', (req, res) => {
  const data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach((entry) => {
      const pageID = entry.id;
      const timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach((event) => {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});

receivedMessage = (event) => {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  const messageId = message.mid;

  const messageText = message.text.toLowerCase();

  if (messageText) {
    switch (messageText) {
      case 'top':
        sendListMessage(senderID);
        break;

      default:
        console.log('Not Found')
        break;
    }
  }
}

const sendListMessage = (recipientId) => {
  const messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "list",
          "elements": [{
            "title": "Seeing AI for iOS",
            "subtitle": "173 points by kmather73 4 hours ago",
            "image_url": "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
            "default_action": {
              "type": "web_url",
              "url": "https://hacker-news-chatbot.herokuapp.com/v0/top/0/redirect",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
            },
          },
          {
            "title": "Gpu.js – GPU Accelerated JavaScript",
            "subtitle": "149 points by olegkikin 4 hours ago",
            "default_action": {
              "type": "web_url",
              "url": "https://hacker-news-chatbot.herokuapp.com/v0/top/1/redirect",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
            },
          },
          {
            "title": "Google is releasing 20M bacteria-infected mosquitoes in Fresno",
            "subtitle": "294 points by chriskanan 7 hours ago",
            "default_action": {
              "type": "web_url",
              "url": "https://hacker-news-chatbot.herokuapp.com/v0/top/2/redirect",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
            },
          },
          ],
        }
      }
    }
  };

  callSendAPI(messageData);
}


// Call Facebook send API
const callSendAPI = messageData => {
  rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: config.pageAccessToken
    },
    method: 'POST',
    json: messageData

  })
    .catch((error) => (console.error(error)))
}

app.listen(process.env.PORT || 8080);
console.log("The server is now running on port 8080.");