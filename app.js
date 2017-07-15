const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rp = require('request-promise');
const config = require('./config');

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

app.get('/webhook', function (req, res) {
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
    data.entry.forEach(function (entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function (event) {
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
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'list':
        sendListMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "hhttps://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "hhttps://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendListMessage(recipientId) {
  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "list",
          "elements": [{
              "title": "Element One",
              "image_url": "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
              "subtitle": "See all our colors",
              "default_action": {
                "type": "web_url",
                "url": "https://www.facebook.com/HN-Chatbot-101586460489989",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://www.facebook.com/HN-Chatbot-101586460489989"
              },
              "buttons": [{
                "title": "View",
                "type": "web_url",
                "url": "https://www.facebook.com/HN-Chatbot-101586460489989",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://www.facebook.com/HN-Chatbot-101586460489989"
              }]
            },
            {
              "title": "Element Two",
              "image_url": "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
              "subtitle": "See all our colors",
              "default_action": {
                "type": "web_url",
                "url": "https://www.facebook.com/HN-Chatbot-101586460489989",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://www.facebook.com/HN-Chatbot-101586460489989"
              },
              "buttons": [{
                "title": "View",
                "type": "web_url",
                "url": "https://www.facebook.com/HN-Chatbot-101586460489989",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://www.facebook.com/HN-Chatbot-101586460489989"
              }]
            },
          ],
          "buttons": [{
            "title": "View More",
            "type": "postback",
            "payload": "payload"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: config.pageAccessToken
    },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
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