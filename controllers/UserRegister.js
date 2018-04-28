//access to the model/user.js user object
var User = require('../model/user');


// get Register
exports.getRegister = (req, res) => {
    // console.log('Inside get register...');
      res.render('register');
};


// post register
exports.postRegister = (req, res) => {
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
        bio: "empty",
        avatar: "https://r.hswstatic.com/w_907/gif/stradivarius-violins-sysk.jpg",
        socialMedia: {
            socialFacebook: "empty",
            socialTwitter: "empty",
            socialInstagram: "empty"
        },
        google: {
            accessToken: "empty",
            refreshToken: "empty"
        }
      });
      User.createUser(newUser, function(err, user){
        if(err) throw err;
        console.log(user);
      });
  
      // res.location('/users/profile');
      res.redirect('/login');
    } 
 
};