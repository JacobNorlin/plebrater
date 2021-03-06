"use strict"
require('babel/register');

/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var pk = require('pitchfork');
var Rx = require('rx');
var _ = require('lodash');
var $ = require('jquery');
var SpotifyHandler = require('./SpotifyHandler.js')
var PitchforkHandler = require('./PitchforkHandler.js')

var cfg = require('./config.js')
console.log(cfg)
var spotifyCfg = cfg.spotify

var client_id = spotifyCfg.client_id; // Your client id
var client_secret =spotifyCfg.client_secret; // Your client secret
var redirect_uri = spotifyCfg.redirect_uri;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/playlists', (req, res) => {

})

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };

    request.post(authOptions, (error, response, body) => {

      res.send({'access_token': body.access_token})

      var spotifyHandler = new SpotifyHandler(body.access_token, body.refresh_token);
      var pitchforkHandler = new PitchforkHandler();

      spotifyHandler.userDataObs()
        .flatMap(data => {
          return spotifyHandler.playlistsObs(data.id);
        })
        .first()
        .flatMap(playlist => {
          let albums = spotifyHandler.albumsInPlaylist(playlist)
          let pace = 100
          //this sequence does not terminate unless take is used, but I dont know how many albums there are...
          //fuck it just send live updates to client with socket :^)
          let pacedRequests = Rx.Observable.zip(Rx.Observable.interval(pace), albums, (_, x) => {return x});
          let albumScores = pacedRequests
            .flatMap(album => {
              return pitchforkHandler.getAlbumScore(album);
            })
          let plebRating = albumScores
            .scan((acc, i, idx, source) => {
              if(i == 0){
                return acc -1
              }else{
                return acc  +i
              }
            },0)
            return plebRating
        })
        .subscribe(x => {
          console.log(x);
        },
        x => {console.log(x)},
        x => {console.log("completed")})

    })


    



  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);