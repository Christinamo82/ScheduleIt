//model for storing data to mongodb
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/Final0');
var db = mongoose.connection;

var userSchema = mongoose.Schema({
    username: {
        type: String,
        index: true,
        require: true,
        unique: true
    },
    password:{
        type: String,
    },
    email:{
        type: String,
        require: true,
        unique: true
    },
    name:{
        type: String
    },
    instrument:{
        type: String
    },
    exprience:{
        type: String
    },
    bio:{
        type: String
    },
    avatar:{
        type: String
    },
    resetPasswordToken:{
        type: String
    },
    resetPasswordExpires:{
        type: Date
    }
});

var User = module.exports = mongoose.model('User', userSchema);

//function for getUserById(login)
module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
}

//function for getUser(login)
module.exports.getUser = function(username, callback){
    var query  = {username: username};
    User.findOne(query, callback);
}

//function for comparePassword(login)
module.exports.comparePassword = function(password, hash, callback){
    bcrypt.compare(password, hash, function(err, isMatch) {
        // res === true 
        callback(null, isMatch);
    });
}
//function for create user
module.exports.createUser = function(newUser, callback){
    //to bycrpt password before storing data
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
    // newUser.save(callback);

//reset password
userSchema.pre('save', function(next) {
    var user = this;
    var SALT_FACTOR = 5;
  
    if (!user.isModified('password')) return next();
  
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
      if (err) return next(err);
  
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  });
}