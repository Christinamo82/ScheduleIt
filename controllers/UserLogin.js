var User = require('../model/user');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//reset password
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');


//
exports.dirGetLogin = (req, res) => {
  res.redirect('/login');
}
// get Login
exports.getLogin = (req, res) => {
    console.log("Insie get Login");
    res.render('login');
};
// router.get('/login', function(req, res, next){
// 	res.render('login');
// });

// //post Login
// exports.postLogin = (req, res, next) => {
//     console.log("Inside post login//");
//     var username = req.body.username;
//     var password = req.body.password;

//     console.log(req.user);
      
//     req.checkBody('username', 'Username field can not be empty').notEmpty();
//     req.checkBody('password', 'Password field can not be emopty').notEmpty();
      
//     var errors = req.validationErrors();
//     if (errors) {
//         console.log(errors);
//         res.render('register', {
//         errors : errors
//         });
//     }

//     passport.authenticate('local', )

//     console.log(req.user._id);
    
//     // console.log("Login use id is: " + req.user._id);
//     //   var red_userprofile_id = req.user._id
//     //   console.log(red_userprofile_id);
//     //   res.redirect('/profile/'+ red_userprofile_id);
    
// };

exports.postLogin = (req, res, next) => {
  req.assert('username', 'Email is not valid');
  req.assert('password', 'Password cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errorMessage', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      console.log(info);
      req.flash('errorMessage', info.msg);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', 'Success! You are logged in.');
      res.redirect('/profile/' + req.user._id);
    });
  })(req, res, next);
};

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
exports.getForgot = (req, res) => {
    res.render('forgot');
};


//reset password
exports.postForgot = (req, res) => {
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
            return res.redirect('/forgot');
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
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
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
      res.redirect('/forgot');
    });
};

//get reset password page
exports.getReset = (req, res) => {
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
};

//update users reset password
exports.postReset = (req, res) => {
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
};

//logout
exports.getLogout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/login');
};

exports.ensureAuthenticated = (req, res, next) => {
// function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
};