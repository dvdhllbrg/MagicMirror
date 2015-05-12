var express  = require('express');
var request  = require('request');
var compress = require('compression');
var fs       = require('fs');
var moment   = require('moment');
var google   = require('googleapis');
var Twitter  = require('twitter');

var calendar = google.calendar('v3');
var app      = express();

app.use(express.static(__dirname + '/public'));
app.use(compress());

// Configuration.
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Google OAuth configuration
var oAuthClient = new google.auth.OAuth2(config.google.clientID, config.google.clientSecret, config.google.redirectURL);
var authed = false;

// Twitter OAuth configuration
var tw = new Twitter(config.twitter);

// API

// Fetch weather information from Open Weather Map.
app.get('/api/weather', function(req, res) {
  request({
    method: 'GET',
    url: 'http://api.openweathermap.org/data/2.5/weather?units=metric&lang=sv&id=' + config.owm.cityID,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.owm.APIkey
    }}, function(err, response, weather) {
      if(err) {
        console.error(err);
      } else {
        res.json(JSON.parse(weather));
      }
    });
});

// Fetch 65 latest tweets from home line.
app.get('/api/tweets', function(req, res) {
  tw.get('statuses/home_timeline', {count: 65, include_entities: false}, function(err, tweets, response) {
    if(err) {
      console.error(err);
    } else {
      res.json(tweets);
    }
  });
});

// Fetch the Västtrafik departure board for the specified station.
app.get('/api/departureBoard', function(req, res) {
  request({
    method: 'GET',
    url: 'https://api.vasttrafik.se/bin/rest.exe/v1/departureBoard=?format=json&timeSpan=60&maxDeparturesPerLine=3&needJourneyDetail=0&authKey=' + config.vasttrafik.APIkey + '&id=' + config.vasttrafik.stationID,
    }, function(err, response, data) {
      if(err) {
        console.error(err);
      } else {
        res.json(JSON.parse(data).DepartureBoard.Departure);
      }
    });

});

// Fetch events from the specified Google Calendars
app.get('/api/schedule', function(req, res) {
  if(!authed) {
    // Generate an OAuth URL and redirect there
    var url = oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    res.redirect(url);
  } else {
    // Get the time for today and tomorrow
    var today = moment().format('YYYY-MM-DD') + 'T';
    var items1, items2, allItems;
    items1 = items2 = allItems = longItems = shortItems = [];

    // Fetch events from first calendar.
    calendar.events.list({
      calendarId: config.google.calendarIDs[0],
      timeMin: today + '00:00:00.000Z',
      timeMax: today + '23:59:59.000Z',
      orderBy: 'startTime',
      singleEvents: true,
      auth: oAuthClient
    }, function(err, events) {
      if(err) {
        console.log('Error fetching events');
        console.log(err);
      } else {
        items1 = events.items;

        // Fetch events from second calendar.
        calendar.events.list({
          calendarId: config.google.calendarIDs[1],
          timeMin: today + '00:00:00.000Z',
          timeMax: today + '23:59:59.000Z',
          orderBy: 'startTime',
          singleEvents: true,
          auth: oAuthClient
       }, function(err, events) {
         if(err) {
           console.log('Error fetching events');
           console.log(err);
         } else {
          // Merge events from the two calendars to a single list
          items2 = events.items;
          longItems = items1.length > items2.length ? items1 : items2;
          shortItems = items1.length > items2.length ? items2 : items1;
          var item1date, item2date;

          longItems.forEach(function(item, index) {
            while(shortItems[0].start.dateTime && item.start.dateTime < shortItems[0].start.dateTime) {
              allItems.push(shortItems.splice(0, 1));
            }
            allItems.push(item);
          });
         
          res.json(allItems);
         }
       });
    }
    });
  }
});

// Application
app.get('/', function(req, res) {
    res.sendfile('.public/index.html');
});

// Return point for oAuth flow, should match google.redirectURL
app.get('/auth', function(req, res) {

    var code = req.param('code');

    if(code) {
      // Get an access token based on our OAuth code
      oAuthClient.getToken(code, function(err, tokens) {

        if (err) {
          console.log('Error authenticating');
          console.error(err);
        } else {
          console.log('Successfully authenticated');          
          // Store our credentials and redirect back to our main page
          oAuthClient.setCredentials(tokens);
          authed = true;
          res.redirect('/');
        }
      });
    } 
});

app.listen(8080);
console.log('Magic happens on port 8080!');