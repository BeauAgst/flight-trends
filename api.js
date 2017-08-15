const apiKey			= 'AIzaSyBkpiCUiDDcBNSSQ99HxoIW3CwgLr7-E3k',
	  request			= require('request'),
	  fs				= require('fs'),
	  monitoredFlights	= require('./flights'),
	  moment			= require('moment'),
	  https				= require('https');

var flights = {};

flights.init = function() {
	let requestData = [];
	for (f in monitoredFlights) {
		 requestData.push(flights.set(f, monitoredFlights[f]));
	}
	fs.writeFile('./data.json', JSON.stringify(requestData, null, '\t'), 'utf8');
}

flights.set = function(index, data) {
	let requestData = [];

	for (let j = 0; j < 1; j++) {
		let body = {
			'request': {
				'passengers': {
					'kind': 'qpxexpress#passengerCounts',
					'adultCount': 1
				},
				'slice': [
					{
						'kind': 'qpxexpress#sliceInput',
						'origin': data.origin,
						'destination': data.dest,
						'date': moment(data.startDate).add(j, 'd').format('YYYY-MM-DD'),
						'maxStops': data.maxStops
					},
					{
						'kind': 'qpxexpress#sliceInput',
						'origin': data.dest,
						'destination': data.origin,
						'date': moment(data.startDate).add(j+6, 'd').format('YYYY-MM-DD'),
						'maxStops': data.maxStops
					}
				],
				'solutions': 30
			}	
		},
		response = flights.makeRequest(body);
	}
	return requestData;
}

flights.makeRequest = function(data) {
	request({
		url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key=' + apiKey,
		method: 'POST',
		json: data.data
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			return body.trips.tripOption;
		}
	});
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

module.exports = flights;

flights.init();