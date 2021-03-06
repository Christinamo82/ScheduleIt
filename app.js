var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var expressValidator = require('express-validator');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var upload = multer({dest: './uploads'});
// var fileUpload = require('express-fileupload');
// var flash = require('connect-flash');
var flash = require('express-flash');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var db = mongoose.connection;

//added for password reset token
var nodemailer = require('nodemailer');
// var bcrypt = require('bcrypt-nodejs');

//added for jade method to use for put and delete
var methodOverride = require('method-override');
var jadeOverride = require('jade-method-override');
// app.use(express.methodOverride());
// require('jade-method-override').express(app);
// const ejs = require('ejs');
var engines = require('consolidate');

var bcrypt = require('bcryptjs');
var async = require('async');
var crypto = require('crypto');

// var index = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//new added
app.engine('jade', engines.jade);
app.set('view engine', 'jade');
// app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// app.use(fileUpload);

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//to use put and delete for jade
app.use(methodOverride('_method'));
// app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

//validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//added for password reset token middleware
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//local variable for layout(if login, login and register won't show on top of the page)
app.get('*', function(req, res, next){
  res.locals.isLogin = req.user || null;
  next();
});

// app.use('/', index);
// app.use('/users', users);
//app.use('/users', profile);

/**
 * Primary app routes.
 */
require('./routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
