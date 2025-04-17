const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://FlavorFindr:WTajjOFaYqBLvyqb@cluster0.ygzkslq.mongodb.net/FlavorFindr?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(url);
client.connect();

const app = express();
app.use(cors())
app.use(bodyParser.json());
// app.use((req, res, next) =>
// {
//  res.setHeader('Access-Control-Allow-Origin', '*');
//  res.setHeader(
//    'Access-Control-Allow-Headers',
//    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//  );
//  res.setHeader(
//    'Access-Control-Allow-Methods',
//    'GET, POST, PATCH, DELETE, OPTIONS'
//  );
//  next();
//});

app.listen(5000, '127.0.0.1'); // start Node + Express server on port 5000

console.log("Listening on port 5000")


app.post('/api/login', async (req, res, next) =>
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error
  var error = '';
  const { login, password } = req.body;
  const db = client.db();
  const results = await
    db.collection('Users').find({Login:login,Password:password}).toArray();
  console.log(results);
  var id = -1;
  var fn = '';
  var ln = '';
  if( results.length > 0 )
  {
    id = results[0].UserID;
    fn = results[0].Firstname;
    ln = results[0].Lastname;
  }
  var ret = { id:id, firstName:fn, lastName:ln, error:''};
  res.status(200).json(ret);
});

app.post('/api/register', async (req, res, next) =>
  {
    // incoming: login, password, firstName, lastName
    // outgoing: success, error
  
    const { login, password, firstName, lastName } = req.body;
    const db = client.db();
  
    try {
      // Check if user already exists
      const existingUser = await db.collection('Users').findOne({ Login: login });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }
  
      const latestUser = await db.collection('Users').find().sort({ UserID: -1 }).limit(1).toArray();
      const newUserID = latestUser.length > 0 ? latestUser[0].UserID + 1 : 1;
  
      // Insert new user
      const result = await db.collection('Users').insertOne({
        UserID: newUserID,
        Login: login,
        Password: password,
        Firstname: firstName,
        Lastname: lastName
      });
  
      res.status(200).json({ success: true, error: '' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  });
  
app.post('/api/searchrecipes', async (req, res, next) =>
{
  // incoming: userId, search
  // outgoing: results[], error
  var error = '';
  const { userId, search } = req.body;
  var _search = search.trim().toLowerCase();
  const db = client.db();
  const results = await db.collection('Recipes').find({
    "Title": { $regex: _search + '.*', $options: 'i' } // 'i' makes it case insensitive
  }).toArray();
  var _ret = [];
  for (var i = 0; i < results.length; i++)
  {
    _ret.push(results[i].Card);
  }
  var ret = { results: _ret, error: error };
  res.status(200).json(ret);
});

app.get('/api/getRecipeByID/:id', async (req, res, next) => {
    // incoming: id (from URL path parameter)
    // outgoing: recipe object OR error

    const recipeId = req.params.id;
    let mongoObjectId;

    // Validate and convert the incoming string ID to a MongoDB ObjectId
    try {
        if (!ObjectId.isValid(recipeId)) {
            return res.status(400).json({ error: 'Invalid Recipe ID format' });
        }
        mongoObjectId = new ObjectId(recipeId);
    } catch (err) {
        console.error("Error creating ObjectId:", err);
        return res.status(400).json({ error: 'Invalid Recipe ID format' });
    }

    const db = client.db(); // Use the default DB configured in the connection string if not specified

    try {
        console.log(`Attempting to find recipe with _id: ${mongoObjectId}`);
        // Find the single recipe document matching the ObjectId
        const recipe = await db.collection('Recipes').findOne({ _id: mongoObjectId });

        if (recipe) {
            console.log("Recipe found:", recipe.Title);
            res.status(200).json(recipe); // Send the full recipe object
        } else {
            console.log(`Recipe not found for _id: ${mongoObjectId}`);
            res.status(404).json({ error: 'Recipe not found' }); // Use 404 for 'Not Found'
        }
    } catch (err) {
        console.error("Database error fetching recipe by ID:", err);
        res.status(500).json({ error: 'Server error fetching recipe' });
    }
});
