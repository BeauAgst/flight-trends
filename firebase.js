const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const flights = require('./api');

const firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://flight-trends.firebaseio.com',
});

const db = admin.database();
const ref = db.ref('data');

flights.init()
    .then((data) => {
        ref.push(data);
        firebase.delete();
    });
