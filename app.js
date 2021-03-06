// Vendor Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rp = require('request-promise');
const config = require('./config');

// Custom Dependencies
const helpers = require('./helpers');
const apiai = require('./apiai')

const app = express();
app.use(bodyParser.json());

// Ping Server
app.get('/', (req, res) => (res.send('Hello World')))

// Get IDs of top 10 stories
app.get('/v0/new', (req, res) => {
  helpers.getStories(0, 3, 'new')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
});

app.get('/v0/new/:id', (req, res) => {
  helpers.getStories(parseInt(req.params.id), 1, 'new')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/new/:id/redirect', (req, res) => {
  helpers.getStories(req.params.id, 1, 'new')
    .then((mappedStories) => (res.redirect(mappedStories[0].url)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/top', (req, res) => {
  helpers.getStories(0, 3, 'top')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
});

app.get('/v0/top/:id', (req, res) => {
  helpers.getStories(parseInt(req.params.id), 1, 'top')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/top/:id/redirect', (req, res) => {
  helpers.getStories(req.params.id, 1, 'top')
    .then((mappedStories) => (res.redirect(mappedStories[0].url)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/best', (req, res) => {
  helpers.getStories(0, 3, 'best')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
});

app.get('/v0/best/:id', (req, res) => {
  helpers.getStories(parseInt(req.params.id), 1, 'best')
    .then((mappedStories) => (res.send(mappedStories)))
    .catch((error) => (console.log(error)))
})

app.get('/v0/best/:id/redirect', (req, res) => {
  helpers.getStories(req.params.id, 1, 'best')
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

  const messageText = message.text;

  var request = app.textRequest(messageText, {
    sessionId: senderID
  });

  request.on('response', (response) => {
    console.log(response.result.parameters.type);
    if (response.result.metadata.intentName === 'send_stories') {
      if (response.result.parameters.type) {
        switch (response.result.parameters.type) {
          case 'New':
            sendListMessage(senderID, 'new');
            break;
          case 'Top':
            sendListMessage(senderID, 'top');
            break;
          case 'Best':
            sendListMessage(senderID, 'best');
            break;
          default:
            console.log('Not Found')
            break;
        }
      }
    } else {
      console.log('This case needs to be accounted for')
    }
  });

  request.on('error', (error) => {
    console.log(error);
  });

  request.end();

  if (messageText) {
    switch (messageText) {
      case 'new':
        sendListMessage(senderID, 'new');
        break;
      case 'top':
        sendListMessage(senderID, 'top');
        break;
      case 'best':
        sendListMessage(senderID, 'best');
        break;

      default:
        console.log('Not Found')
        break;
    }
  }
}

const sendListMessage = (recipientId, endpoint) => {
  helpers.getStories(0, 3, endpoint)
    .then((mappedStories) => {

      const messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              top_element_style: "compact",
              template_type: "list",
              elements: mappedStories.map((story, index) => (
                {
                  title: story.title,
                  subtitle: `${story.score} points by ${story.by}`,
                  default_action: {
                    type: "web_url",
                    url: `https://hacker-news-chatbot.herokuapp.com/v0/${endpoint}/${index}/redirect`,
                    messenger_extensions: true,
                    webview_height_ratio: "tall",
                  }
                }
              ))
            }
          }
        }
      };

      // messageData.message.attachment.payload.elements.image_url = "http://www.htmlcsscolor.com/preview/gallery/FF6600.png";

      callSendAPI(messageData);
    })
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