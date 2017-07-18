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

app.get('/top/:id', (req, res) => {
  rp('https://hacker-news.firebaseio.com/v0/topstories.json')
    .then((body) => {
      // Get requested story
      const story = JSON.parse(body).splice(req.params.id, 1);

      // Get Story and send it
      getStories(story)
        .then((mappedStories) => (res.send(mappedStories)))
        .catch((error) => (console.log(error)))
    })
    .catch((error) => (console.log(error)))
})

app.get('/top/:id/redirect', (req, res) => {
  rp('https://hacker-news.firebaseio.com/v0/topstories.json')
    .then((body) => {
      // Get requested story
      const story = JSON.parse(body).splice(req.params.id, 1);

      // Get Story and send it
      getStories(story)
        .then((mappedStories) => (res.redirect(mappedStories[0].url)))
        .catch((error) => (console.log(error)))
    })
    .catch((error) => (console.log(error)))
})

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
      case 'top':
        sendListMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
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
              "title": "Seeing AI for iOS",
              "subtitle": "173 points by kmather73 4 hours ago",
              "image_url": "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/19732093_101899587125343_5108999219740115062_n.jpg?oh=d276f55295a2b37a9fc20ed860e01f85&oe=5A0C9BA0",
              "default_action": {
                "type": "web_url",
                "url": "https://hacker-news-chatbot.herokuapp.com/top/0/redirect",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
              },
            },
            {
              "title": "Gpu.js – GPU Accelerated JavaScript",
              "subtitle": "149 points by olegkikin 4 hours ago",
              "default_action": {
                "type": "web_url",
                "url": "https://hacker-news-chatbot.herokuapp.com/top/1/redirect",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
              },
            },
            {
              "title": "Google is releasing 20M bacteria-infected mosquitoes in Fresno",
              "subtitle": "294 points by chriskanan 7 hours ago",
              "default_action": {
                "type": "web_url",
                "url": "https://hacker-news-chatbot.herokuapp.com/top/2/redirect",
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

function sendTopStories(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          elements: [{
              title: "Classic T-Shirt Collection",
              image_url: "https://peterssendreceiveapp.ngrok.io/img/collection.png",
              subtitle: "See all our colors",
              default_action: {
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/shop_collection",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              },
              buttons: [{
                title: "View",
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/collection",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              }]
            },
            {
              title: "Classic White T-Shirt",
              image_url: "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
              subtitle: "100% Cotton, 200% Comfortable",
              default_action: {
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/view?item=100",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              },
              buttons: [{
                title: "Shop Now",
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/shop?item=100",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              }]
            },
            {
              title: "Classic Blue T-Shirt",
              image_url: "https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png",
              subtitle: "100% Cotton, 200% Comfortable",
              default_action: {
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/view?item=101",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              },
              buttons: [{
                title: "Shop Now",
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/shop?item=101",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              }]
            },
            {
              title: "Classic Black T-Shirt",
              image_url: "https://peterssendreceiveapp.ngrok.io/img/black-t-shirt.png",
              subtitle: "100% Cotton, 200% Comfortable",
              default_action: {
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/view?item=102",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              },
              buttons: [{
                title: "Shop Now",
                type: "web_url",
                url: "https://peterssendreceiveapp.ngrok.io/shop?item=102",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://peterssendreceiveapp.ngrok.io/"
              }]
            }
          ],
          buttons: [{
            title: "View More",
            type: "postback",
            payload: "payload"
          }]
        }
      }
    }
  }
}

// function callSendAPI(messageData) {
//   rp({
//     uri: 'https://graph.facebook.com/v2.6/me/messages',
//     qs: {
//       access_token: config.pageAccessToken
//     },
//     method: 'POST',
//     json: messageData

//   }, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       var recipientId = body.recipient_id;
//       var messageId = body.message_id;

//       console.log("Successfully sent generic message with id %s to recipient %s",
//         messageId, recipientId);
//     } else {
//       console.error("Unable to send message.");
//       console.error(response);
//       console.error(error);
//     }
//   });
// }

const sendTextMessage = (recipientId, messageText) => {
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