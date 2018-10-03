'use strict'
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const router = express.Router()
const favicon = require('serve-favicon')
const querystring = require('querystring')
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyA_nj1hOVWtQgcHrI0FLMMTwasZ6JvFJXk',
  Promise: Promise
});


app.set('view engine', 'pug')

if (process.env.NODE_ENV === 'test') {
  // NOTE: aws-serverless-express uses this app for its integration tests
  // and only applies compression to the /sam endpoint during testing.
  router.use('/sam', compression())
} else {
  router.use(compression())
}

router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

// NOTE: tests can't find the views directory without this
app.set('views', path.join(__dirname, 'views'))
// For the favicon
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))


router.get('/', (req, res) => {
  res.render('myWaypoints', {
    apiUrl: req.apiGateway ? `https://syxoodu0ih.execute-api.us-west-2.amazonaws.com/prod` : 'http://localhost:3000'
  })
})


router.post('/getmap', (req,res) => {
  var waypoints = {};
  googleMapsClient.directions({origin: req.body.start, destination: req.body.destination})
  .asPromise()
  .then((response) => {
    var startenc = querystring.stringify({origin: req.body.start});
    var destenc = querystring.stringify({destination: req.body.destination});
    var url = "https://www.google.com/maps/embed/v1/directions?" + startenc + "&" + destenc + "&key=AIzaSyA_nj1hOVWtQgcHrI0FLMMTwasZ6JvFJXk";
    var data = (response.json.routes[0].legs[0]);
    for(var i = 0; i < data.length; i++) {
      waypoints[i] = (response.json.routes[0].legs[0].steps[i].start_location);
      if (i == (data.length - 1)) {
        res.json(waypoints);
      }
    }
//    res.json(waypoints);
//    res.send(JSON.stringify(response, null, 2));
//    res.render('map', {
//      mapurl: url
//    })
      return getWaypointFunction({res,waypoints});   
  })
  .catch((err) => {
    console.log(err);
  });
});

// The aws-serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)
app.use('/', router)

// Export your express server so you can import it in the lambda function.
module.exports = app
