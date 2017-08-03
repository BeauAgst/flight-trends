const apiKey			= 'AIzaSyBkpiCUiDDcBNSSQ99HxoIW3CwgLr7-E3k',
	  request			= require('request'),
	  fs				= require('fs'),
	  monitoredFlights	= require('./flights');
	  airlineCodes		= require('./airlines');

var flights = {};

flights.init = function() {

	for (f in monitoredFlights) {
		let getFlights = flights.get(monitoredFlights[f]);

		getFlights.then(function(data) {
			let sortFlights = flights.sort(monitoredFlights[f], data);

			sortFlights.then(function(data) {
				flights.normalize(data);
			})
		});
	} 
}

flights.get = function() {
	return new Promise(function(resolve, reject) {		
		request({
			url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key=' + apiKey,
			method: 'POST',
			json: monitoredFlights[0].data
		}, function (error, response, body) {
			if (!error && response.statusCode === 200) resolve(body.trips.tripOption);
		});
	})
}

flights.sort = function(flightDetails, data) {
	let isodate = new Date().toISOString(),
		flightList = {
		id: flightDetails.id,
		name: flightDetails.name,
		date: isodate,
		flights: {}
	};

	return new Promise(function(resolve, reject) {
		for (let i = 0; i < data.length; i++) {
			let airline = data[i].slice[0].segment[0].flight.carrier,
				flightFee = data[i].saleTotal.replace(/[^0-9.]/g, ""),
				flight = flightList.flights[airline];

			if (!flight) {
				flightList.flights[airline] = flightFee;
				continue;
			}

			if (parseInt(flightList.flights[airline]) < parseInt(flightFee)) continue;
			flightList.flights[airline] = flightFee;
		}
		resolve(flightList);
	});
}

flights.normalize = function(data) {
	let airlines = data.flights,
		flightsArray = [];

	for (airline in airlines) {

		for (let i = 0; i < airlineCodes.length; i++) {
			if (airline != airlineCodes[i].iata) continue;
			let name = airlineCodes[i].name,
				iata = airlineCodes[i].iata,
				price =  data.flights[airline];
			
			flightsArray.push({name, iata, price})
		}
	}
	data.flights = flightsArray;
	console.log(data);
}

flights.init();