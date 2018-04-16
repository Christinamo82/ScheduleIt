// import { throws } from 'assert';
// import { error } from 'util';

var express = require('express');
var router = express.Router();

//multer file upload
var multer = require('multer');
var upload = multer({dest: './uploads'});

//access to the model/user.js user object
var User = require('../model/user');

//passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//reset password
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

//added for event calender 
//connect to the mongoDB
// var db = require('mongoskin').db("localhost/testdb", { w: 0});
// db.bind('event');

//source for register and login: https://www.youtube.com/watch?v=hb26tQPmPl4
//source for reset password: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// router.get('/profile', function(req, res, next) {
//   res.render('profile');
// });

// Register
router.get('/register', function(req, res, next){
  // console.log('Inside get register...');
	res.render('register');
});

// Login
router.get('/login', function(req, res, next){
	res.render('login');
});

// user register
router.post('/register', function(req, res, next){
  // console.log(req.body.name);
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  req.checkBody('name', 'Name field cannot be empty').notEmpty();
  req.checkBody('email', 'E-mail field cannot be empty').notEmpty();
  req.checkBody('email', 'Input email is not valid').isEmail();
  req.checkBody('username', 'Username field cannot be empty').notEmpty();
  req.checkBody('password', 'Password field cannot be empty').notEmpty();
  req.checkBody('password2', 'Confirm Password field cannot be empty').notEmpty();
  req.checkBody('password2', 'Password does not match').equals(req.body.password);

  var errors = req.validationErrors();
  if(errors){
    console.log(errors);
    res.render('register', {
      errors : errors
    });
  }
  else{
    //print out register data (for checking purpose)
    console.log('The input name is ' + req.body.name);
    console.log('The input email is ' + req.body.email);
    console.log('The input username is ' + req.body.username);
    console.log('The input password is ' + req.body.password);

    //If the register format is correct, save data to monogodb
    var newUser = new User ({
      name: name,
      email: email,
      username: username,
      password: password,
      instrument: "empty",
      exprience: "empty",
      bio: "empty"
    });
    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    // res.location('/users/profile');
    res.redirect('/users/login');
  }


});

//user login
// {failureRedirect:'/users/login', failureFlash:'Invalid username or password'}
router.post('/login', passport.authenticate('local', {failureRedirect:'/users/login', failureFlash:'Invalid username or password'}), 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  req.checkBody('username', 'Username field can not be empty').notEmpty();
  req.checkBody('password', 'Password field can not be emopty').notEmpty();

  var errors = req.validationErrors();
  if(errors){
    console.log(errors);
    res.render('register', {
      errors : errors
    });
  }
  else{
    // console.log('The input username is ' + req.body.username);
    // console.log('The input password is ' + req.body.password);
    // req.flash('sucess', 'You are now loggd in');
    // console.log(req.user._id);
    var red_userprofile_id = req.user._id
    console.log(red_userprofile_id);
    // res.redirect('/users/profile');
    // res.render('prifle', {user: req.user._id});
    res.redirect('/users/profile/'+ red_userprofile_id);
  }
    // res.redirect('/');

});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
  User.getUser(username, function(err, user){
    if(err){
      throw err;
    }
    if(!user){
      return done(null, false, {message: 'Unknown user'});
    }

    User.comparePassword(password, user.password, function(err, isMatch){
      if(err){
        return done(err);
      }
      if(isMatch){
        return done(null, user);

      } else{
        return done(null, false, {message: 'Invalid password'});
      }
    });
  });
}));

//forget password
router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});


//reset password
router.post('/forgot', function(req, res, next) {
  //arrays of functions that will excuted by order
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    //function to check if the input email is in the data, if not placed error message
    //if the input email exist get the reset password token
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          // console.log("mail does not exist");
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/users/forgot');
        }
        
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    //function to login sending email account 
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'cs242cmo2finalproject@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'cs242finalproject@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this to reset the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], 
  function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

//get reset password page
router.get('/reset/:token', function(req, res) {
  req.checkBody('password', 'Password field cannot be empty').notEmpty();
  req.checkBody('password2', 'Confirm Password field cannot be empty').notEmpty();
  req.checkBody('password2', 'Password does not match').equals(req.body.password);
  
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

//update users reset password
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'cs242cmo2finalproject@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'cs242cmo2finalproject@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

//to check if is login
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/users/login');
}
//user's profile
router.get('/profile/:id', ensureAuthenticated, function(req, res, next) {
  console.log("Inside get profile");
  console.log(req.user._id);
  User.findById(req.params.id, function(err, found){
    console.log(req.params);
    console.log(req.params.id);
    if(err){
      console.log("did not found user");
      req.flash('error', 'Cannot found user');
      return res.redirect('/');
    }
    console.log("found user");
    console.log(req.user.username);
    // res.redirect('/users/profile/'+ user._id);
    // res.render('profile/:id');
    // console.log(found.username);
    res.render('profile', {user: found});
    // res.render('/users/profile');
    //5a1ba8a9529add1f57121d64
  });
  // res.render('profile');
});

//user's profile update(edit)

router.get('/profile/:id/edit', ensureAuthenticated, function(req,res,next){
  console.log("Inside get profile edit");
  var id = req.user._id;
  console.log(id);
  // res.render('edit');
  res.render('edit', {user: req.user});
});

//put method to updated user's profile after filled out the requirement from edit
//(not executing....???)
router.post('/profile/:id/', ensureAuthenticated, upload.single('profileImage'), function(req, res, next){
  console.log("Inside put profile edit");
  console.log("user is: " + req.user.name);
  if(req.file){
    var profileImg = req.file.filename;
  }
  if(req.body.op == 'Cancel Edit'){
    return res.redirect('/users/profile/'+ req.user._id);
  }
  var instrument = req.body.instrument;
  var exprience = req.body.exprience;
  var biography = req.body.biography;

  if(instrument != "undefined" && instrument != ""){
    console.log("Inside instrument not empty");
    instrument = req.body.instrument;
  }
  else{
    console.log("Inside instrument empty");
    instrument = req.params.id.instrument;
  }

  if(exprience != "undefined" && exprience != ""){
    console.log("Inside exprience not empty");
    exprience = req.body.exprience;
  }
  else{
    console.log("Inside exprience empty");
    exprience = req.params.id.exprience;
  }

  if(biography != "undefined" && biography != ""){
    console.log("Inside biography not empty");    
    biography = req.body.biography
  }
  else{
    console.log("Inside biography empty");  
    biography = req.params.id.bio;
  }
  //{$set: newData}
  var edit_data = {exprience: exprience, instrument: instrument, bio: biography};
  console.log("req.params.id is: " + req.params.id);
  User.findByIdAndUpdate(req.user._id, {$set: edit_data}, function(err, profile_update){
    if(err){
      console.log("profile update error user " + req.user.name);
      console.log("profile update error");
      req.flash('error', err.message);
      return res.redirect('/');
      // res.redirect('/users/profile/'+ req.user._id);
    }
    console.log("profile update found user, and can be update");
    // console.log(profile_update.instrument);
    // console.log(profile_update.exprience);
    // console.log(biography);
    // profile_update.instrument = instrument;
    // profile_update.exprience = exprience;
    // profile_update.bio = biography;
    // profile_update.save(function(err){
    //   if(err){
    //     req.flash('error', 'Error when updating...');
    //     req.redirect('/users/profile/' + req.user._id);
    //   }
    //   else{
      req.flash('success', 'User profile update success');
      res.redirect('/users/profile/'+ req.user._id);
      // res.render('profile', {user: req.user});
      // }
    });
    // res.render('edit', {user_id: profile_update});


});
  // var id = req.user._id;
  // res.render('profile', {user: req.user});
// });



//event calander
router.get('/profile/:id/event', function(req, res, next) {
  console.log("Inside get event");
  console.log(req.user._id);
  // res.render('event', {user: req.user});
  res.render('event');
});

// router.get('/profile/:id/edit', function(req,res,next){
//   console.log("Inside get profile edit");
//   var id = req.user._id;
//   console.log(id);
//   res.render('edit', {user: req.user});
// });

router.get('/event', function(req, res,next){
  console.log("event html jade check");
  res.render('event');
});

//logout
router.get('/logout', function(req, res, next) {
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = router;
