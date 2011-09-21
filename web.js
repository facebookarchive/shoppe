require.paths.unshift(__dirname + '/lib');

var everyauth = require('everyauth');
var express   = require('express');

var FacebookClient = require('facebook-client').FacebookClient;
var facebook = new FacebookClient();

var uuid = require('node-uuid');

var products = require('./data/products').Products;

var fbapp = {
  name: 'Ye Olde Car Shoppe',
  id: process.env.FACEBOOK_APP_ID
};

// configure facebook authentication
everyauth.facebook
  .appId(process.env.FACEBOOK_APP_ID)
  .appSecret(process.env.FACEBOOK_SECRET)
  .scope('publish_actions')
  .entryPath('/')
  .redirectPath('/home')
  .findOrCreateUser(function() {
    return({});
  })

// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser(),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'secret123' }),
  // insert a middleware to set the facebook redirect hostname to http/https dynamically
  function(request, response, next) {
    var method = request.headers['x-forwarded-proto'] || 'http';
    everyauth.facebook.myHostname(method + '://' + request.headers.host);
    next();
  },
  everyauth.middleware(),
  require('facebook').Facebook()
);

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

// create a socket.io backend for sending facebook graph data
// to the browser as we receive it
var io = require('socket.io').listen(app);

// wrap socket.io with basic identification and message queueing
// code is in lib/socket_manager.js
var socket_manager = require('socket_manager').create(io);

// use xhr-polling as the transport for socket.io
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// respond to GET /home
app.get('/home', function(request, response) {

  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  // if we have facebook auth credentials
  if (request.session.auth) {

    // initialize facebook-client with the access token to gain access
    // to helper methods for the REST api
    var token = request.session.auth.facebook.accessToken;
    facebook.getSessionByAccessToken(token)(function(session) {

      // generate a uuid for socket association
      var socket_id = uuid();

      // render the home page
      response.render('home.ejs', {
        layout: false,
        token: token,
        app: fbapp,
        user: request.session.auth.facebook.user,
        products: products,
        home: method + '://' + request.headers.host + '/',
        redirect: method + '://' + request.headers.host + request.url,
        socket_id: socket_id
      });
    });
  } else {
    // not authenticated, redirect to / for everyauth to begin authentication
    response.redirect('/');
  }
});

//respond to GET /product/{product}
app.get('/products/:product', function(request, response) {
  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  // if a product is supplied
  if (request.params.product && products[request.params.product]) {
    var product = products[request.params.product];

    // if we have facebook auth credentials
    if (request.session.auth) {
      // generate a uuid for socket association
      var socket_id = uuid();
      
      // initialize facebook-client with the access token to gain access
      // to helper methods for the REST api
      var token = request.session.auth.facebook.accessToken;
      facebook.getSessionByAccessToken(token)(function(session) {
        //render product page
        response.render('product.ejs', {
          layout: false,
          token: token,
          app: fbapp,
          user: request.session.auth.facebook.user,
          product_id: request.params.product,
          product: product,
          home: method + '://' + request.headers.host + '/',
          redirect: method + '://' + request.headers.host + request.url,
          socket_id: socket_id
        });
      });
    } else {
      // not logged in
      response.render('product.ejs', {
        layout: false,
        token: null,
        app: fbapp,
        user: null,
        product_id: request.params.product,
        product: product,
        home: method + '://' + request.headers.host + '/',
        redirect: method + '://' + request.headers.host + request.url,
        socket_id: socket_id
      });
    }
  } else {
    // redirect in case there is no real product specified
    response.redirect('/home');
  }
});

//respond to GET /coupon/:coupon
app.get('/coupons/facebook', function(request, response) {
  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  var coupon = {
    code: 'facebook',
    name: 'Free shipping on all products',
    description: 'Enjoy this coupon, some of this stuff is heavy!'
  };

  // if we have facebook auth credentials
  if (request.session.auth) {
    // generate a uuid for socket association
    var socket_id = uuid();
    
    // initialize facebook-client with the access token to gain access
    // to helper methods for the REST api
    var token = request.session.auth.facebook.accessToken;
    facebook.getSessionByAccessToken(token)(function(session) {
      //render product page
      response.render('coupon.ejs', {
        layout: false,
        token: token,
        app: fbapp,
        coupon: coupon,
        user: request.session.auth.facebook.user,
        home: method + '://' + request.headers.host + '/',
        redirect: method + '://' + request.headers.host + request.url,
        socket_id: socket_id
      });
    });
  } else {
    // not logged in
    response.render('coupon.ejs', {
      layout: false,
      token: null,
      app: fbapp,
      user: null,
      coupon: coupon,
      home: method + '://' + request.headers.host + '/',
      redirect: method + '://' + request.headers.host + request.url,
      socket_id: socket_id
    });
  }
});

//respond to POST /buy
app.post('/buy', function(request, response) {
  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  // if we have facebook auth credentials
  if (request.session.auth) {

    // generate a uuid for socket association
    var socket_id = uuid();

    // initialize facebook-client with the access token to gain access
    // to helper methods for the REST api
    var token = request.session.auth.facebook.accessToken;
    facebook.getSessionByAccessToken(token)(function(session) {
      if (request.body.product && products[request.body.product]) {
        var product = products[request.body.product];

        //render product page
        response.render('buy.ejs', {
          layout: false,
          token: token,
          app: fbapp,
          user: request.session.auth.facebook.user,
          product_id: request.body.product,
          product: product,
          home: method + '://' + request.headers.host + '/',
          redirect: method + '://' + request.headers.host + request.url,
          socket_id: socket_id
        });
      }
      else {
        // no product provided!
        response.redirect('/home');
      }
    });
  } else {
    //not logged in
    response.redirect('/');
  }
});

//respond to POST /checkout
app.post('/checkout', function(request, response) {
  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  // if we have facebook auth credentials
  if (request.session.auth) {

    // generate a uuid for socket association
    var socket_id = uuid();

    // initialize facebook-client with the access token to gain access
    // to helper methods for the REST api
    var token = request.session.auth.facebook.accessToken;
    facebook.getSessionByAccessToken(token)(function(session) {
      if (request.body.product && products[request.body.product]) {
        var product = products[request.body.product];
        var coupon = request.body.coupon;

        if (coupon == 'facebook') {
          session.graphCall(
            '/me/carshoppe:redeem',
            {
              coupon: method + '://' + request.headers.host +
                      '/coupons/' + coupon
            },
            'POST'
          )(function(result) {
          });
        }

        session.graphCall(
          '/me/carshoppe:purchase',
          {
            carpart: method + '://' + request.headers.host +
                     '/products/' + request.body.product
          },
          'POST'
        )(function(result) {
        });

        //render product page
        response.render('checkout.ejs', {
          layout: false,
          token: token,
          app: fbapp,
          user: request.session.auth.facebook.user,
          product_id: request.body.product,
          product: product,
          home: method + '://' + request.headers.host + '/',
          redirect: method + '://' + request.headers.host + request.url,
          socket_id: socket_id
        });
      } 
      else {
        // no product provided!
        response.redirect('/home');
      } 
    }); 
  } else {
    //not logged in
    response.redirect('/');
  } 
});
