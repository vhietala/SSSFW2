'use strict';

const express = require('express');
const multer = require('multer');
// const upload = multer();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bodyParser = require('body-parser');

const dotenv = require('dotenv').config();

const app = express();
const upload = multer({dest: 'public/original/'});

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});

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



mongoose.connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/test`).
    then(() => {
      console.log('Connected successfully.');
      app.use(express.static('public'));
      app.listen(3000);
    }, err => {
      console.log('Connection to db failed: ' + err);
    });

const Pic = mongoose.model('Pic', picSchema);
const router = express.Router();

app.post('/upload', upload.single('file'), function(req, res, next) {
  req.body.time = moment();
  req.body.original = 'original/' + req.file.filename;
  console.log(req.body.coordinates);
  req.body.coordinates = JSON.parse(req.body.coordinates);
  console.log(JSON.stringify(req.body));
  next();
});


app.use((req, res, next) => {
  try {
    new ExifImage({image: req.file.path}, function(error, exifData) {
      if (error) {
        console.log('Error: ' + error.message);
        next();
      } else {
        console.log(JSON.stringify(exifData.gps));
        req.body.coordinates = {
          lat: gpsToDecimal(exifData.gps.GPSLatitude,
              exifData.gps.GPSLatitudeRef),
          lng: gpsToDecimal(exifData.gps.GPSLongitude,
              exifData.gps.GPSLongitudeRef),
        };
        next();
      }
    });
  } catch (error) {
    console.log('Error: ' + error.message);
    next();
  }
});

app.use((req, res, next) => {
  const thumbPath = 'thumb/' + req.file.filename;

  sharp(req.file.path).
      resize(320, 300).
      toFile('public/' + thumbPath, (err, info) => {
        console.log(err);
        console.log(info);
        req.body.thumbnail = thumbPath;
        next();
      });
});

app.use((req, res, next) => {
  const medPath = 'img/' + req.file.filename;

  sharp(req.file.path).
      resize(770, 720).
      toFile('public/' + medPath, (err, info) => {
        console.log(err);
        console.log(info);
        req.body.image = medPath;
        console.log(JSON.stringify(req.body));
        next();
      });
});

app.use((req, res, next) => {
  const file = 'public/data.json';
  let json = null;
  jsonfile.readFile(file, (err, obj) => {
    json = obj;
    json.push(req.body);
    jsonfile.writeFile(file, obj, (err) => {
      console.error(err);
    });
  });
  res.send(req.body);
});

const gpsToDecimal = (gpsData, hem) => {
  let d = parseFloat(gpsData[0]) + parseFloat(gpsData[1] / 60) +
      parseFloat(gpsData[2] / 3600);
  return (hem == 'S' || hem == 'W') ? d *= -1 : d;
};