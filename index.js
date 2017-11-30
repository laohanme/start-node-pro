const express = require('express');
const favicon = require('serve-favicon');
const urlMain = require('./routes/main');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app = express();
app.set('view engine', 'pug');

// templates
app.set('views', './templates');

// static
app.use('/static', express.static('static'));

// Middleware to parse POST request & cookies
// Must include if you want to parse POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// use routes from routes/main.js
// app.use(urlMain);

app.use(favicon(path.join(__dirname, 'static', 'favicon', 'favicon.png')));
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
    function(username, password, cb) {
        db.users.findByUsername(username, function(err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false);
            }
            if (user.password !== password) {
                return cb(null, false);
            }
            return cb(null, user);
        });
    }));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.users.findById(id, function(err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});
app.use(require('express-session')(
    {secret: 'keyboard cat', resave: false, saveUninitialized: false}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());
app.get('/',
    function(req, res) {
        res.render('home', {user: req.user});
    });

app.get('/login',
    function(req, res) {
        res.render('login');
    });

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout',
    function(req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        res.render('profile', {user: req.user});
    });

const portNumber = 3000;
app.listen(portNumber, function() {
    console.log('listening on port ' + portNumber + '!');
    console.log('http://localhost:' + portNumber);
});
