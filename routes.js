const passport = require('passport');

var multer = require('multer');
var upload = multer({dest: './uploads'});

//controllers
const controllerLogin = require('./controllers/UserLogin');
const controllerRegister = require('./controllers/UserRegister');
const controllerProfile = require('./controllers/UserProfile');

module.exports = function(app){
    app.get('/', controllerLogin.dirGetLogin);
    app.get('/login', controllerLogin.getLogin);
    app.post('/login', controllerLogin.postLogin);
    app.get('/logout', controllerLogin.getLogout);    
    app.get('/forgot', controllerLogin.getForgot);
    app.post('/forgot', controllerLogin.postForgot);
    app.get('/reset/:token', controllerLogin.getReset);
    app.post('/reset/:token', controllerLogin.postReset);

    app.get('/register', controllerRegister.getRegister);
    app.post('/register', controllerRegister.postRegister);

    app.get('/profile/:id', controllerLogin.ensureAuthenticated, controllerProfile.getProfile);
    app.get('/profile/:id/avatar_edit', controllerLogin.ensureAuthenticated, controllerProfile.getProfileImage);
    app.get('/profile/:id/edit', controllerLogin.ensureAuthenticated, controllerProfile.getProfileEdit);
    app.post('/profile/:id/avatar', controllerLogin.ensureAuthenticated, controllerProfile.postProfileImage);
    app.post('/profile/:id', controllerLogin.ensureAuthenticated, controllerProfile.postProfile);
    app.get('/oauthcallback', controllerProfile.getAuthCallback);
    // app.post('/oauthcallback', controllerProfile.psotAuthCallback);
};