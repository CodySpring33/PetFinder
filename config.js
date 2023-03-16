  module.exports = {
    mongodb: {
      username: 'your_username',
      password: 'your_password',
      getUri: function() {
        return `mongodb+srv://${this.username}:${this.password}@cluster0.qnz1h.mongodb.net/?retryWrites=true&w=majority`;
      },
      dbName: 'petFinder',
    },
  };
