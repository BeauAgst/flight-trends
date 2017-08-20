var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
var flights = require('./api');

var firebase = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://flight-trends.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("data");

flights.init()
	.then(function(data) {
		ref.push(data);
		firebase.delete();
	});