const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path'); // Import the 'path' module

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

// Serve static files from the 'imgs' directory
app.use('/api/images', express.static(path.join(__dirname, 'db/data/imgs')));

app.listen(5000, '127.0.0.1'); // start Node + Express server on port 8000

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
    const recipeId = req.params.id;
    console.log(`--- Received request for ID string: "${recipeId}" ---`); // <-- ADDED LOG
    let mongoObjectId;

    try {
        console.log(`Validating ID: "${recipeId}"`); // <-- ADDED LOG
        const isValid = ObjectId.isValid(recipeId); // Store result
        console.log(`ObjectId.isValid result: ${isValid}`); // <-- ADDED LOG

        if (!isValid) {
            console.log('Validation failed: ID is not valid.'); // <-- ADDED LOG
            // Use a slightly different error message to confirm which check failed
            return res.status(400).json({ error: 'Invalid Recipe ID format (isValid check)' });
        }

        console.log(`Attempting: new ObjectId("${recipeId}")`); // <-- ADDED LOG
        mongoObjectId = new ObjectId(recipeId);
        console.log(`Successfully created ObjectId: ${mongoObjectId}`); // <-- ADDED LOG

    } catch (err) {
        console.error("Error creating ObjectId:", err); // Log the actual error
         // Use a slightly different error message here too
        return res.status(400).json({ error: 'Invalid Recipe ID format (catch block)' });
    }

    const db = client.db();

    try {
        console.log(`Attempting to find recipe with _id: ${mongoObjectId}`);
        const recipe = await db.collection('Recipes').findOne({ _id: mongoObjectId });

        if (recipe) {
            console.log("Recipe found:", recipe.Title);
            res.status(200).json(recipe);
        } else {
            console.log(`Recipe not found for _id: ${mongoObjectId}`);
            res.status(404).json({ error: 'Recipe not found' });
        }
    } catch (err) {
        console.error("Database error fetching recipe by ID:", err);
        res.status(500).json({ error: 'Server error fetching recipe' });
    }
});

//Gets CleanedIngredients Feature, converts from String to Array
function extractFeatures(recipe) {
  let feat = recipe.Cleaned_Ingredients || [];
  if (typeof feat === 'string') {
    try {
      feat = JSON.parse(feat.replace(/'/g, '"'));
    } catch {
      feat = feat
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
  }
  return Array.isArray(feat) ? feat : [];
}

//Actual Model, Loads recipe and increments User Matching Vector
app.post("/api/swipe", async (req, res) => {
  const { userId, recipeId, liked } = req.body;
  const db = client.db();

  // 1. load recipe
  const recipe = await db
    .collection("Recipes")
    .findOne({ _id: new ObjectId(recipeId) });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  // 2. build an $inc document
  const features = extractFeatures(recipe);
  const incDoc = {};
  features.forEach((f) => {
    // +1 on like, -1 on dislike
    incDoc[`preferences.${f}`] = liked ? 1 : -1;
  });

  // 3. apply update with upsert
  await db
    .collection("user_preferences")
    .updateOne({ userId }, { $inc: incDoc }, { upsert: true });

  res.json({ success: true });
});

//Recommend api, takes in rand 200 samples and gets top match as next output
app.get("/api/recommend", async (req, res) => {
  const { userId } = req.query;
  const db = client.db();

  // 1. load or default user prefs
  const prefDoc = await db.collection("user_preferences").findOne({ userId });
  const prefs = prefDoc?.preferences || {};

  // 2. sample ~200 recipes
  const SAMPLE = 200;
  const candidates = await db
    .collection("Recipes")
    .aggregate([{ $sample: { size: SAMPLE } }])
    .toArray();

  // 3. score & pick best
  let best = null;
  let bestScore = -Infinity;
  for (const r of candidates) {
    const features = extractFeatures(r);
    const score = features.reduce((sum, f) => sum + (prefs[f] || 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  res.json(best);
});

app.get('/api/preferences', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  const db = client.db();
  const prefDoc = await db
    .collection('user_preferences')
    .findOne({ userId });
  // send back the raw preferences object (or {} if none yet)
  res.json(prefDoc?.preferences || {});
});

