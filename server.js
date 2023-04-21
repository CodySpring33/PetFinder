require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const ejs = require('ejs');

const app = express();
app.use(cookieParser());
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//use bootstrap
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
//for bootstrap
// app.use(express.static("public")); 


const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);

// Set up EJS as the view engine
app.engine('ejs', ejs.renderFile);

// Set the views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const jwtCookie = req.cookies.jwt;
  if (jwtCookie) {

    try {
      // Verify the JWT using the JWT_SECRET key
      const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
      const decodedToken = jwt.verify(jwtCookie, jwtSecret);

      // Find the user by ID in the MongoDB database
      const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });

      await client.connect(); // Wait for the connection to be established

      const db = client.db(MONGODB_DBNAME);
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) });

      if (user) {
        // If the user is found, send a success response and terminate the request

        return res.redirect('/content');
      } else {
        // If the user is not found, send an error response and terminate the request

        return res.status(401).send('Invalid token');

      }
    } catch (err) {
      // If the JWT is invalid, ignore it and proceed with the login flow
      console.error(err);
    }
  }

  // If no valid JWT cookie is present in the request, send the login page
  res.render('index');
});

app.get('/content', (req, res) => {
  res.render('content');
});
app.get('/home', (req, res) => {
  res.render('content');
});
app.get('/register', (req, res) =>{
  res.render('register')
});

app.get('/morepets', (req, res) =>{
  res.render('morepets')
});

app.get('/allpets', async (req, res) => {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();

    const db = client.db(MONGODB_DBNAME);
    const collection = db.collection('posts');


  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while connecting to the database.');
  } finally {
    await client.close();
  }
});

app.get('/posts', async (req, res) => {
    const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    try {
      await client.connect();
  
      const db = client.db(MONGODB_DBNAME);
      const collection = db.collection('posts');
  
      const posts = await collection.find().sort({ _id: -1 }).limit(10).toArray();
  
      if (posts.length === 0) {
        res.status(404).send('No posts found.');
        return;
      }
  
      // Send the requested post to the client
      const index = parseInt(req.query.index);
      if (index >= 0 && index < posts.length) {
        const currentPost = posts[index];
        res.json(currentPost);
      } else {
        res.json({ message: "No posts left" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while connecting to the database.');
    } finally {
      await client.close();
    }
  });
  
  app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(MONGODB_DBNAME);
      const usersCollection = db.collection('users');
  
      // Check if username or email already exist in the database
      const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        res.status(400).send('Username or email already exists');
        return;
      }
  
      // Hash the password
      const saltRounds = SALT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Save the user data to MongoDB
      const newUser = {
        username,
        email,
        password: hashedPassword,
        isAdmin: false,
      };
  
      await usersCollection.insertOne(newUser);
  
      // Log the user in after registration
      const user = await usersCollection.findOne({ email });
      const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
      res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // Set JWT as an HTTP-only cookie
      res.redirect('/content');
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Error registering user');
    } finally {
      await client.close();
    }
  });
  
  app.get('/login', async (req, res) => {
    // Check if a valid JWT cookie is present in the request
    const jwtCookie = req.cookies.jwt;
    if (jwtCookie) {
  
      try {
        // Verify the JWT using the JWT_SECRET key
        const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
        const decodedToken = jwt.verify(jwtCookie, jwtSecret);
  
        // Find the user by ID in the MongoDB database
        const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  
        await client.connect(); // Wait for the connection to be established
  
        const db = client.db(MONGODB_DBNAME);
        const usersCollection = db.collection('users');
  
        const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) });
  
        if (user) {
          // If the user is found, send a success response and terminate the request
  
          return res.redirect('/content');
        } else {
          // If the user is not found, send an error response and terminate the request
  
          return res.status(401).send('Invalid token');
  
        }
      } catch (err) {
        // If the JWT is invalid, ignore it and proceed with the login flow
        console.error(err);
      }
    }
  
    // If no valid JWT cookie is present in the request, send the login page
    res.render('login');
  });
  
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Find the user by email in the MongoDB database
    const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(MONGODB_DBNAME);
      const usersCollection = db.collection('users');
  
      const user = await usersCollection.findOne({email });

      if (!user) {
        return res.status(401).send('Invalid email or password');
      }
      
      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).send('Invalid email or password');
      }
      
      // If the password matches, the login is successful
      // If the password matches, generate a JWT token
      const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
      
      res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // Set JWT as an HTTP-only cookie
      
      
      res.redirect('/content?loginSuccessful=true');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error during login');
      } finally {
      await client.close();
      }
      });
      
      app.post('/logout', (req, res) => {
      res.clearCookie('jwt'); // Clear the JWT cookie
      res.redirect('/');
      });

      app.use(express.static('public'));
      
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      });        