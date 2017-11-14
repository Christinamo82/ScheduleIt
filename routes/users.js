var express = require('express');
var router = express.Router();

//source https://www.youtube.com/watch?v=hb26tQPmPl4

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


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

  req.checkBody('name', 'Name field cannot be empty').notEmpty;
  req.checkBody('email', 'E-mail field cannot be empty').notEmpty;
  req.checkBody('email', 'Input email is not valid').isEmail;
  req.checkBody('username', 'Username field cannot be empty').notEmpty;
  req.checkBody('password', 'Password field cannot be empty').notEmpty;
  req.checkBody('password2', 'Confirm Password field cannot be empty').notEmpty;
  req.checkBody('password2', 'Password does not match').equals(req.body.password);

  var errors = req.validationErrors();
  if(errors){
    console.log(errors);
    res.render('register', {
      errors : errors
    });
  }
  else{
    console.log('The input name is ' + req.body.name);
    console.log('The input email is ' + req.body.email);
    console.log('The input username is ' + req.body.username);
    console.log('The input password is ' + req.body.password);
  }


});

router.post('/login', function(req, res, next){
  var username = req.body.username;
  var password = req.body.password;

  req.checkBody('username', 'Username field can not be empty').notEmpty;
  req.checkBody('password', 'Password field can not be emopty').notEmpty;

  var errors = req.validationErrors();
  if(errors){
    console.log(errors);
    res.render('register', {
      errors : errors
    });
  }
  else{
    console.log('The input username is ' + req.body.username);
    console.log('The input password is ' + req.body.password);
  }

  // router.get('/logout', function(req, res){
  //   req.logout();
  //   req.flash('sucess', 'logout sucessed!');
  // });
});

module.exports = router;
