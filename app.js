const config = require('./config');
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');


const app = express();
app.use(cookieParser());
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const uri = config.mongodb.getUri();
const dbName = config.mongodb.dbName;


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/register', (req, res) =>{
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    // Connect to MongoDB
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection('users');
  
      // Check if username or email already exist in the database
      const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        res.status(400).send('Username or email already exists');
        return;
      }
  
      // Hash the password
      const saltRounds = config.saltRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Save the user data to MongoDB
      const newUser = {
        username,
        email,
        password: hashedPassword,
      };
  
      await usersCollection.insertOne(newUser);
      res.send('User registered successfully');
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
        const client = new MongoClient(uri, { useUnifiedTopology: true });
  
        await client.connect(); // Wait for the connection to be established
  
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
  
        const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) });
  
        if (user) {
          // If the user is found, send a success response and terminate the request
  
          return res.redirect('/');
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
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  });
  
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Find the user by email in the MongoDB database
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
  
        const user = await usersCollection.findOne({ email });
  
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
        const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
  
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // Set JWT as an HTTP-only cookie
        
        
        res.redirect('/?loginSuccessful=true');
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Error during login');
    } finally {
      await client.close();
    }
  });



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
