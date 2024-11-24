require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var dns = require('dns');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.connect("mongodb+srv://michaelkunda80:Kundakinte123@cluster0.ubub6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true }
});

const Url = mongoose.model('Url', urlSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let idCounter = 1;

// Helper function to validate URL
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to shorten URL
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;

  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = new URL(originalUrl).hostname;

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = idCounter++;
    const newUrl = new Url({ original_url: originalUrl, short_url: shortUrl });

    try {
      await newUrl.save();
      res.json({ original_url: originalUrl, short_url: shortUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save URL' });
    }
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;

  try {
    const urlDoc = await Url.findOne({ short_url: shortUrl });

    if (urlDoc) {
      res.redirect(urlDoc.original_url);
    } else {
      res.status(404).json({ error: 'No short URL found for the given input' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve URL' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
