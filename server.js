'use strict';

const express = require('express');
const multer = require('multer');
const upload = multer();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const picSchema = new Schema({
  id: Number,
  time: Date,
  category: String,
  title: String,
  details: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  thumbnail: String,
  image: String,
  original: String,
});

const app = express();

mongoose.connect('mongodb://localhost:27017/test2').then(() => {
  console.log('Connected successfully.');
  app.use(express.static('public'));
  app.listen(3000);
}, err => {
  console.log('Connection to db failed: ' + err);
});
const Pic = mongoose.model('Pic', picSchema);
app.post('/upload', (req, res) => {
  console.log(JSON.stringify(req.body));
  console.log(req.file);



  res.redirect('http://localhost:3000');
});
