const {
    google
} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    "934538391359-sh1jeblh0u5nuph6i9it0b2noj5l39l0.apps.googleusercontent.com",
    "UOcQZojDvpQmyKutO-wXt6z-",
    "http://localhost:3000/oauthcallback"
);

exports.googleAuthorize = () => {
    console.log("Inside googleAuthorize function");
    // =====google auth2=======

    // generate a url that asks permissions for Google+ and Google Calendar scopes
    const scopes = [
        'https://www.googleapis.com/auth/calendar'
    ];
    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes
    });
    return url;
};

exports.googleClientAuthorize = (req, res) => {
    console.log("Inside googleClientAuthorize function");
    var code = req.query.code
    var returnToken;
    console.log("the auth call back code is: " + code);
    oauth2Client.getToken(code, function (err, tokens) {
        if (err) {
            console.log(err);
            res.send(err);
            return;
        }
        console.log("token retrived and the tokens are: ");
        console.log(tokens);
        returnToken = tokens;
        oauth2Client.setCredentials(tokens);
    });
    return Tokens;
};

// exports.getAuthCallback = (req, res) => {
//     // app.get('/oauthcallback', function(req, res, next){
//     console.log("Inside get authUrl query code");

//     var code = req.query.code
//     console.log("the auth call back code is: " + code);
//     console.log("Log in user is: " + req.user);

//     oauth2Client.getToken(code, function (err, tokens) {
//       if (err) {
//         console.log(err);
//         res.send(err);
//         return;
//       }
//       console.log("token retrived and the tokens are: ");
//       console.log(tokens);

//       var accessToken = tokens.access_token;
//       var refreshToken = req.user.google.refreshToken;
//       //won't compare to null
//       if (refreshToken === null) {
//         refreshToken = tokens.refresh_token;
//       }
//       var expiredToken = tokens.expiry_date;
//       var edit_tokens = {
//         google: {
//           accessToken: accessToken,
//           refreshToken: refreshToken,
//           expiredToken: expiredToken
//         }
//       };
//       User.findByIdAndUpdate(req.user._id, {
//         $set: edit_tokens
//       }, function (err, profile_update) {
//         if (err) {
//           console.log("profile update error user " + req.user.name);
//           console.log("profile update error");
//           req.flash('error', err.message);
//           return res.redirect('/');
//         }
//         oauth2Client.setCredentials(tokens);

//         listEvents(oauth2Client, function() {
//           res.redirect('/profile/' + req.user._id);
//         });

//       });
//     });
//   };

//function to list calendar events, for now only list 10 events
exports.listEvents = (auth, callback) => {
    console.log("Inside listEvents function");
    var calendar = google.calendar('v3');
    calendar.events.list({
            auth: auth,
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        },
        function (err, response) {
            // console.log("A");
            if (err && !response) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var events = response.data.items;
            if (events == undefined || events.length == 0) {
                console.log('No upcoming events found.');
            } else {
                console.log('Upcoming 10 events:');
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var start = event.start.dateTime || event.start.date;
                    console.log('%s - %s', start, event.summary);
                }
            }
            callback(null);
        });
};