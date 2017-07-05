const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');

var app = express();
app.use(bodyParser.json());

app.get('/top', function(req, res){
  request('https://hacker-news.firebaseio.com/v0/topstories.json', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      res.send(JSON.parse(body));
    }
  })
});
app.listen(8080);
console.log("The server is now running on port 8080.");
