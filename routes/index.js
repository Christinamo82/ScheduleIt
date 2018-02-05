var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('index', { title: 'Express' });
});


function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/users/login');
}
// // Register
// router.get('/register', function(req, res){
// 	res.render('register');
// });

// // Login
// router.get('/login', function(req, res){
// 	res.render('login');
// });

// // user register
// router.get('/register', function(req, res){
//   var name = req.body.name;
//   var email = req.body.email;
//   var username = req.body.username;
//   var password = req.body.password;
// })


module.exports = router;