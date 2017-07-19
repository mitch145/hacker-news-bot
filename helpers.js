// Vendor Dependencies
const rp = require('request-promise');

const getStories = (index, amount, endpoint) => {
  return rp(`https://hacker-news.firebaseio.com/v0/${endpoint}stories.json`)
    .then((body) => {
      const stories = JSON.parse(body).slice(index, index + amount);
      return getStoriesFromIDs(stories)
    })
    .catch((error) => (console.log(error)))
}

const getStoriesFromIDs = stories => {
  return Promise.all(
    stories.map(
      (story) => (rp(`https://hacker-news.firebaseio.com/v0/item/${story}.json`)
        .then((data) => (JSON.parse(data)))
      )
    )
  )
}

module.exports = {
  getStories: getStories,
}