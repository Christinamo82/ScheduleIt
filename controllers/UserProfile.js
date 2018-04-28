var User = require('../model/user');

var multer = require('multer');
var upload = multer({
  dest: './uploads'
});

var googleAuth = require('./googleApi');
const {
  google
} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  "934538391359-sh1jeblh0u5nuph6i9it0b2noj5l39l0.apps.googleusercontent.com",
  "UOcQZojDvpQmyKutO-wXt6z-",
  "http://localhost:3000/oauthcallback"
);

//user's profile
exports.getProfile = (req, res) => {
  console.log("Inside get profile");
  User.findById(req.user._id, function (err, found) {
    if (err) {
      console.log("did not found user");
      req.flash('error', 'Cannot found user');
      return res.redirect('/');
    }
    console.log("found user");
    console.log(req.user.username);

    var url = googleAuth.googleAuthorize();
    console.log("url is:" + url);
    res.render('profile', {
      user: found,
      authUrl: url
    });
  });
};

//user's profile update(edit)
exports.getProfileEdit = (req, res) => {
  console.log("Inside get profile edit");
  var id = req.user._id;
  console.log(id);
  // res.render('edit');
  res.render('edit', {
    user: req.user
  });
};

exports.getProfileImage = (req, res) => {
  console.log("Inside get profileImage");
  console.log("user id is: " + req.user._id);
  res.render('profileImgEdit', {
    user: req.user
  });
}

exports.postProfileImage = (req, res) => {
  console.log("Inside post profile image");

  if (req.body.updateImg == 'Cancel Update Picture') {
    console.log("Inside cancel update picture");
    return res.redirect('/profile/' + req.user._id);
  } else {
    let formidable = require('formidable');
    var form = formidable.IncomingForm();
    // var form = new formidable.IncomingForm({ uploadDir: __dirname + '/uploads' });
    form.uploadDir = "./public/images/userImg";
    form.keepExtensions = true;
    form.maxFieldsSize = 10 * 1024 * 1024; //10 MB
    // form.multiples = true;

    form.parse(req, function (err, fields, files) {
      console.log("Inside form.parse");
      // console.log(files);
      if (err) {
        req.flash('error', err.message);
        return res.redirect('/');
      }
      // req.user.avatar = '/uploads/' + files.profileImage.name;
      if (files.profileImage.size == 0) {
        console.log("Inside upload size 0 image = cancel upload");
        return res.redirect('/profile/' + req.user._id);
      }
      console.log("image upload path is: " + files.profileImage.path);
      var imgPath = files.profileImage.path;
      var editAvatar = {
        avatar: imgPath.substring(6)
      };
      User.findByIdAndUpdate(req.user._id, {
        $set: editAvatar
      }, function (err, profile_update) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('/');
        }
        req.flash('success', 'User profile image update success');
        res.redirect('/profile/' + req.user._id);
      });
    });
  }
  // res.redirect('/profile/' + req.user._id);
}

//update user profile
exports.postProfile = (req, res) => {
  console.log("Inside put profile edit");
  console.log("user is: " + req.user.name);

  if (req.body.op == 'Cancel Update') {
    console.log("Inside cancel edit");
    return res.redirect('/profile/' + req.user._id);
  }

  var instrument = req.body.instrument;
  var exprience = req.body.exprience;
  var biography = req.body.biography;

  if (instrument != "undefined" && instrument != "") {
    console.log("edit instrument: " + req.body.instrument);
    if (instrument == undefined) {
      instrument = req.user.instrument;
    } else {
      instrument = req.body.instrument;
    }
  } else {
    instrument = req.user.instrument;
  }

  if (exprience != "undefined" && exprience != "" && exprience != 'undefined') {
    console.log("edit exprience: " + req.body.exprience);
    if (exprience == undefined) {
      exprience = req.user.exprience;
    } else {
      exprience = req.body.exprience;
    }
  } else {
    exprience = req.user.exprience;
  }

  if (biography != "undefined" && biography != "") {
    console.log("edit instrument: " + req.body.biography);
    if (biography == undefined) {
      biography = req.user.bio;
    } else {
      biography = req.body.biography
    }
  } else {
    biography = req.user.bio;
    // biography = req.body.biography;
  }
  //{$set: newData}
  var edit_data = {
    exprience: exprience,
    instrument: instrument,
    bio: biography
  };
  console.log("req.params.id is: " + req.params.id);
  User.findByIdAndUpdate(req.user._id, {
    $set: edit_data
  }, function (err, profile_update) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/');
      // res.redirect('/users/profile/'+ req.user._id);
    }
    console.log("profile update found user, and can be update");
    req.flash('success', 'User profile update success');
    res.redirect('/profile/' + req.user._id);
    // res.render('profile', {user: req.user});
    // }
  });
};

// exports.postProfileImage = (req,res) => {

// }

exports.getAuthCallback = (req, res) => {
  // app.get('/oauthcallback', function(req, res, next){
  console.log("Inside get authUrl query code");
  var code = req.query.code
  console.log("the auth call back code is: " + code);
  console.log("Log in user is: " + req.user);

  oauth2Client.getToken(code, function (err, tokens) {
    if (err) {
      console.log(err);
      res.send(err);
      return;
    }
    console.log("token retrived and the tokens are: ");
    console.log(tokens);

    var accessToken = tokens.access_token;
    var refreshToken = req.user.google.refreshToken;
    //won't compare to null
    if (refreshToken === null) {
      refreshToken = tokens.refresh_token;
    }
    var expiredToken = tokens.expiry_date;
    var edit_tokens = {
      google: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiredToken: expiredToken
      }
    };
    User.findByIdAndUpdate(req.user._id, {
      $set: edit_tokens
    }, function (err, profile_update) {
      if (err) {
        console.log("profile update error user " + req.user.name);
        console.log("profile update error");
        req.flash('error', err.message);
        return res.redirect('/');
      }
      oauth2Client.setCredentials(tokens);

      googleAuth.listEvents(oauth2Client, function () {
        res.redirect('/profile/' + req.user._id);
      });

    });
  });
};