const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://FlavorFindr:WTajjOFaYqBLvyqb@cluster0.ygzkslq.mongodb.net/FlavorFindr?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(url);
client.connect();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) =>
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});
app.listen(5000); // start Node + Express server on port 5000

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
    id = results[0].UserId;
    fn = results[0].FirstName;
    ln = results[0].LastName;
  }
  var ret = { id:id, firstName:fn, lastName:ln, error:''};
  res.status(200).json(ret);
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

