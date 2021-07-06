var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = require('./app');
var http = require('http');
const PORT = process.env.PORT || 5000;



const hbs = require('hbs');
const MongoClient = require('mongodb').MongoClient;
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const authUtils = require('./utils/auth');
const session = require('express-session');
const flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const authRouter = require('./routes/auth');


var app = express();

// Connect to db


MongoClient.connect('mongodb://localhost:27017/MyData',{useUnifiedTopology:true},{useNewUrlParser:true}, (err, client) => {

  if (err) {
    throw err;
  }

  const db = client.db('MyData');
  const users = db.collection('people');
  app.locals.users = users;
  console.log("MongoDB Connected!!");
});



// Configure passport

passport.use(new Strategy(
  (username, password, done) => {
    app.locals.users.findOne({ username }, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      if (user.password != authUtils.hashPassword(password)) {
        return done(null, false);
      }

      return done(null, user);
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  done(null, { id });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//  partials for handlebars

hbs.registerPartials(path.join(__dirname, 'views/partials'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Configure session, passport, flash

app.use(session({
  secret: 'session secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.loggedIn = req.isAuthenticated();
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);


app.use('/auth', authRouter);

//  error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  
  res.status(err.status || 500);
  res.render('error');
});




//port config
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



module.exports = app;
