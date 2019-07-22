
var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    var options = {
          body: 'You successfully subscribed to our Notification service!',
          icon: '/src/images/icons/app-icon-96x96.png',
          image: '/src/images/sf-boat.jpg',
          dir: 'ltr',
          lang: 'en-US', // BCP 47,
          vibrate: [100, 50, 200],
          badge: '/src/images/icons/app-icon-96x96.png',
          tag: 'confirm-notification',
          renotify: true,
          actions: [
            { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
            { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
          ]
    };

    navigator.serviceWorker.ready
      .then(function(swreg) {
         swreg.showNotification('Successfully subscribed!', options);
      });
  }
}

function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  var reg;                                            // *** declaring it here so that it can be used outside the function ************
  navigator.serviceWorker.ready
    .then(function(swreg) {                           // ********** SW registration object
          reg = swreg;
          return swreg.pushManager.getSubscription();   // ******** Asking the Push Manager for the subscription object
    })
    .then(function(sub) {
          if (sub === null) {                             // No subscription so, Create a new subscription
              
              // ******** user npm package web-push to create the public private key pair from the command line
              //          This is the public key of that pair 
              var vapidPublicKey = 'BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE';
              var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
              return reg.pushManager.subscribe({                    // ******** subscribe
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey   
              });
          } else {                                      // ******  We already have a subscription
          }
    })
    .then(function(newSub) {
          // ******* send the subscription object to our Application Server ****************************************** 
          // ******* Max used the Firebase backend. It is really a BaaS ... backend as a service
          // ******* It is a 
          //          1) real-time database 
          //          2) we can write functions that get exposed as an API to the outside world
          //          3) we can host our application also .... it is a hosting service too 
          //          Here, https://pwagram-99adf.firebaseio.com is the firebase database and by adding a /x.json at the end
          //          we are creating a collection (think table) in the database called x. In the example below it is 
          //          called subscription. And if we send a POST request with data, then that data becomes records in the subscription
          //          table. Basically, we are saving the subscription objects there.
          return fetch('https://pwagram-99adf.firebaseio.com/subscriptions.json', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify(newSub)    
                    })
        })
    .then(function(res) {
          if (res.ok) {                       //******** IF fetch was all good then 
            displayConfirmNotification();     //******* Let the user know that they are subscribed
          }
    })
    .catch(function(err) {
          console.log(err);
    });
}



function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
}
