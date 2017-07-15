curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type" : "domain_whitelisting",
  "whitelisted_domains" : ["https://hacker-news-chatbot.herokuapp.com"],
  "domain_action_type": "add"
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAaxZC6wQg4gBAMbocY8ZCiuZCEeyO7nrYIrcUwiFG4MZBHREbjZAfZBvfvfH0UKDfGICzsMWj4Nyepy4Jeu3cGLtJTQlq4YwU1u65mEzGvu4kvvi6PjfBZAKPJbgNsE8SYRg9gNqnxcXX1ZCAQp75ksg0rIc62EYMAleNaOoxYV4AZDZD"