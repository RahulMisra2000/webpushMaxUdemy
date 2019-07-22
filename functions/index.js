var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpush = require('web-push');                // This is the library that helps us talk to the Messaging Server

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-fb-key.json");        // This is my credentials that I got from Firebase Project Settings

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),          
  databaseURL: 'https://pwagram-99adf.firebaseio.com/'        // This is our Firebase database
});


// *************************** This is a REST API Endpoint that we are creating *************************************************
// It can be called by sending a request to https://us-central1-pwagram-99adf.cloudfunctions.net/storePostData ******************
// ******************************************************************************************************************************
exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
      // **** In the database, in the posts collection (think table) we are pushing (think adding) the record ***********
      admin.database().ref('posts').push({
          id: request.body.id,
          title: request.body.title,
          location: request.body.location,
          image: request.body.image
      })
      .then(function () {                 //**** If the record was successfully added then we want to let all the subscribers
                                          //     know about the newly added record
        
            // ********************* The 2nd parameter is the public  key of the VAPID key pair ***************************
            // ********************* The 3rd parameter is the private key of the VAPID key pair ***************************
            webpush.setVapidDetails('mailto:business@academind.com', 
                                    'BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE', 
                                    'AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s');
            // *** this returns a promise that will resolve with all the records in the subscriptions table **************
            return admin.database().ref('subscriptions').once('value'); 
      })
      .then(function (subscriptions) {                                // *** all the records in the subscription table 
            subscriptions.forEach(function (sub) {                    // **** Loop thru ALL the subscription objects

                    var pushConfig = {                                      // **** create an object and load config parameters in it
                          endpoint: sub.val().endpoint,
                          keys: {
                                auth: sub.val().keys.auth,
                                p256dh: sub.val().keys.p256dh
                          }
                    };

                    webpush.sendNotification(pushConfig,            // **** Send the message to the Messaging Server
                          JSON.stringify({                          // **** This is the message payload
                                title: 'New Post',
                                content: 'New Post added!',
                                openUrl: '/help'
                    }))
                    .catch(function (err) {
                          console.log(err);
                     })
            });   // ************* forEach
            response.status(201).json({message: 'Data stored', id: request.body.id});
      })
      .catch(function (err) {
         response.status(500).json({error: err});
      });
  });
});
