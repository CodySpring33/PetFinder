require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const { MongoClient, ObjectId, MONGO_CLIENT_EVENTS } = require('mongodb');
const ejs = require('ejs');
// Image storing
const multer = require('multer')
const multerS3 = require('multer-s3-v2')
const {s3, getImageStream} = require('./s3.js')

// S3 functions

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: function(req, file, cb) {
    cb(null, { originalname: file.originalname });
  },
  key: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
// 
const upload = multer({ 
  storage: storage, 
  limits:{fileSize:1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb)
  }
}).any()


function checkFileType (file, cb) {
  const fileTypes = /jpeg|png|jpg/
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = fileTypes.test(file.mimetype)

  if (mimetype && extname){
    return cb(null, true)
  }
  else{
    cb("Please upload images only")
  }
}

// End of S3 functions

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
app.get('/register', (req, res) => {
  res.render('register')
});

//add grid items
app.get('/additems', async (req, res) => {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(MONGODB_DBNAME);
  const collection = db.collection('posts');
  const page_size = 9 // 
  const last_id = req.query.last_id; // Get 'last_id' from query parameter
  let cursor;
  let filters = {};
  
  for(key in req.query){
    if(key !== "last_id"){
      const value = req.query[key].split(',');

      const category = key;
      
      if (filters[category]) {
        filters[category].push(value);
      } else {
        filters[category] = value;
      }
    }
  }

  let query = {}; 
  // Build the query object based on the filters
  for (const category in filters) {
    query[category] = { $in: filters[category] };
  }

  if (!last_id) {
    // When it is the first page
    cursor = collection.find(query).limit(page_size);
  } else {
    query["_id"] = { '$gt': new ObjectId(last_id) };
    cursor = collection.find(query).limit(page_size);
  }

  // Get the data
  const data = await cursor.toArray();
  if (!data.length) {
    // No documents left
    return res.json({ data: null, last_id: null });
  }

  // Since documents are naturally ordered with _id, last document will have max id.
  const new_last_id = data[data.length - 1]._id.toString();

  // Return data and new_last_id
  return res.json({ data, last_id: new_last_id });
});

app.get('/morepets', async (req, res) => {
  const searchTerm = req.query.q;
  
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    
    const db = client.db(MONGODB_DBNAME);
    const collection = db.collection('posts');
    
    let posts = [];
    
    if (searchTerm) {
      posts = await collection.aggregate([
        {
          $search: {
            index: "search",
            text: {
              query: searchTerm,
              path: {
                wildcard: "*"
              }
            }
          }
        }
      ]).toArray();
    }
        
    res.render('morepets', { posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while connecting to the database.');
  } finally {
    await client.close();
  }
});

// Post
app.get('/post', async (req, res) =>{
  const jwtCookie = req.cookies.jwt;
  let images = []
  res.render('post', {images: images})  
});



app.post("/upload", async(req, res) =>{
  const jwtCookie = req.cookies.jwt;
  if(jwtCookie){

    var currentUser = null;
    try {
      // Verify the JWT using the JWT_SECRET key
      const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
      const decodedToken = jwt.verify(jwtCookie, jwtSecret);
      // Find the user by ID in the MongoDB database
      const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
      await client.connect() // Wait for the connection to be established
      const db = client.db(MONGODB_DBNAME)
      const usersCollection = db.collection('users')
      const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) });
      if (user) {
        // If the user is found, send a success response and terminate the request
        currentUser = new ObjectId(decodedToken.userId)
      } 

    } catch (err) {
      // If the JWT is invalid, ignore it and proceed with the login flow
      console.error(err)
    }
    upload(req, res, (err) =>{

      
      if(!err && req.files != ""){
        // update database here
        saveFieldsInDB(req.body, currentUser).then(function(result){
          saveImagesInDB(req.files, currentUser,result)
        })
        res.status(200).send()
      }
      else if(!err && req.files ==""){
        res.statusMessage = "Please select an image to upload"
        res.status(400).end()
      }
      else{
        res.statusMessage == (err === "Please upload images only") ? err : "Photo exceed limit of 1 MB"
        res.status(400).end()
      }
    })
  }
})

async function saveImagesInDB(images, currentUser, postPromise){
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true })
  await client.connect();
      const db = client.db(MONGODB_DBNAME);
      const usersCollection = db.collection('images');
  for(let i = 0; i < images.length; i++){
    try {
      
      const key = images[i].key
      const url = images[i].location
      
      const userid = currentUser
      // Check if image key already exists in dabase
      const existingimage = await usersCollection.findOne({ $or: [{ key}] });
      if (existingimage) {
        return;
      }
      const postid = postPromise.insertedId
      // Save the user data to MongoDB
      const image = {
        postid,
        userid,
        key,
        url
      };
      await usersCollection.insertOne(image);
    } catch (err) {
      console.error(err);
      // res.status(500).send('Error inserting image to db:',key);
    } 
  }
  await client.close();
}

async function saveFieldsInDB(fields, currentUser){
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true })
  await client.connect();
  const db = client.db(MONGODB_DBNAME);
  const usersCollection = db.collection('posts');
  const userid = currentUser
  const petType = fields.petType
  const petName = fields.petName
  const breed = fields.breed
  const color = fields.color
  const availability = fields.availability
  const coat = fields.coat
  var goodWithAnimals = false
  if(fields.goodWithAnimals){
    goodWithAnimals = true
  }
  var goodWithChildren = false
  if(fields.goodWithChildren){
    goodWithChildren = true
  }
  var mustLeash = false
  if(fields.mustLeash){
    mustLeash = true
  }
  const location = fields.location
  const activity = fields.activity
  const birthdate = fields.birthdate
  const health = fields.health
  const fee = parseFloat(fields.fee)
  const description = fields.description
  
  var post
  // Save the user data to MongoDB
  if(fields.petType=="Dog"){
    post = {
      userid,
      breed,
      availability,
      petType,
      petName,
      breed,
      color,
      coat,
      goodWithAnimals,
      goodWithChildren,
      mustLeash,
      location,
      activity,
      birthdate,
      health,
      fee,
      description
    }
  }
  else{
    post = {
      userid,
      availability,
      petType,
      petName,
      color,
      coat,
      goodWithAnimals,
      goodWithChildren,
      mustLeash,
      location,
      activity,
      birthdate,
      health,
      fee,
      description
    }
  }
  
  const insertedFields = await usersCollection.insertOne(post, function(){
    return post._id
  })
  await client.close();
  return insertedFields
}

async function getCurrentUser(currentJwt){
  
}

// app.put("/delete", (req, res) =>{
//   const deleteImages = req.body.deleteImages
//   if(deleteImages == ""){
//     res.statusMessage = "Please select an image to delete"
//     res.status(400).end()
//   }
//   else{
//     res.statusMessage = "Successfully deleted"
//     res.status(200).end()
//   }
// })

// app.get("/:image_key", (req, res)=>{
//   const readStream = getImageStream(req.params.image_key)
//   readStream.pipe(res)
// })

//End of Post

app.get('/posts', async (req, res) => {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();

    const db = client.db(MONGODB_DBNAME);
    const collection = db.collection('posts');
    const imageCollection = db.collection('images');
    const posts = await collection.find().sort({ _id: -1 }).toArray();

    if (posts.length === 0) {
      res.status(404).send('No posts found.');
      return;
    }

    // Send the requested post to the client
    const index = parseInt(req.query.index);
    if (index >= 0 && index < posts.length) {
      const currentPost = posts[index];
      
      const image = await imageCollection.findOne({postid: posts[index]._id});
      var response;
      if(image)
      {
        response = {
          currentPost: currentPost,
          image: image
        };
      }
      else{
        response = {
          currentPost: currentPost,
          image: {url: "./img/max.jpg"}
        };
      }
        
      res.json(response);
      
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


app.post('/liked', async (req, res) => {

  const jwtToken = req.cookies.jwt;

  if (jwtToken) {
    // User is logged in, handle the POST request
    console.log('Received like request from logged-in user');
    const jwtSecret = process.env.JWT_SECRET; // Store the secret key securely, e.g., in environment variables
    const decodedToken = jwt.verify(jwtToken, jwtSecret);
    // Handle the POST request logic here
    try {
      const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
      await client.connect();
      const db = client.db(MONGODB_DBNAME);

      // Extract the user ID and post ID from the request payload
      const postID = req.body.postID;
      

      // Check if the user exists in the liked collection
      const likedCollection = db.collection('liked');
      const existingUser = await likedCollection.findOne({ userid: new ObjectId(decodedToken.userId) });

      if (existingUser) {
        // User already exists, update the liked posts array
        const result = await likedCollection.updateOne(
          { userid: new ObjectId(decodedToken.userId) },
          { $addToSet: { posts: new ObjectId(postID) } },
          { upsert: true }
        );
        console.log('Data updated successfully:', result);
      } else {
        // User doesn't exist, insert a new document
        const result = await likedCollection.insertOne({
          userid: new ObjectId(decodedToken.userId),
          posts: [new ObjectId(postID)]
        });
        console.log('New document inserted:', result);
      }

      res.sendStatus(200); // Example response
    } catch (error) {
      console.error('An error occurred while saving the data:', error);
      res.sendStatus(500); // Example response
    }
  } else {
    console.log('Received like request from unauthenticated user');
    // Handle the case when the user is not logged in
    // For example, send an error response or redirect to a login page
    res.sendStatus(401); // Example response
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

app.get('/search', async (req, res) => {
  const searchTerm = req.query.q;
  try {
    const queryString = `?q=${searchTerm}`;
    res.redirect(`/morepets${queryString}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while searching the database');
  }
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});        

