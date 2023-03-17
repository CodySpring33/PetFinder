  module.exports = {
    mongodb: {
      username: 'your_username',
      password: 'your_password',
      getUri: function() {
        return `mongodb+srv://${this.username}:${this.password}@cluster0./*YOUR CLUSTER ID HERE*/.mongodb.net/?retryWrites=true&w=majority`;
      },
      dbName: 'PetFinder',
    },
    saltRounds: 10 /*number of salting rounds 10-15 recommended*/,
  };
