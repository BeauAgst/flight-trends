const apiKey			= 'AIzaSyBkpiCUiDDcBNSSQ99HxoIW3CwgLr7-E3k',
	  request			= require('request'),
	  fs				= require('fs'),
	  monitoredFlights	= require('./flights'),
	  moment			= require('moment');

var flights = {};

flights.init = function() {
	return new Promise(function(resolve, reject) {

		for (f in monitoredFlights) {
			let getFlights = flights.get(f, monitoredFlights[f]);

			getFlights.then(function(data) {
				console.log(data);
				fs.writeFile('./data.json', JSON.stringify(data, null, '\t'), 'utf8');
				// let sortFlights = flights.sort(monitoredFlights[f], data);

				// sortFlights.then(function(data) {
				// 	console.log(data);
					// resolve(data); 
				// })
			});
		}
	})
}

flights.get = function(index, data) {
	let startDate = '2018-05-07';
	let body = {
		'id': index,
		'data': {
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
						'date': '2018-05-07',
						'maxStops': data.maxStops
					},
					{
						'kind': 'qpxexpress#sliceInput',
						'origin': data.dest,
						'destination': data.origin,
						'date': '2018-05-13',
						'maxStops': data.maxStops
					}
				]
			}
		}	
	};
	let response = [];

	return new Promise(function(resolve, reject) {

		for (let j = 0; j < 1; j++) {
			let outbound = moment(startDate).add(j, 'd').format('YYYY-MM-DD'),
				inbound = moment(startDate).add(j+6, 'd').format('YYYY-MM-DD');
			body.data.request.slice[0].date = outbound;
			body.data.request.slice[1].date = inbound;
			response.push(flights.makeRequest(body.data));
		}
		resolve(response);
	})
}

flights.makeRequest = function(data) {
	request({
		url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key=' + apiKey,
		method: 'POST',
		json: data
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) return body.trips.tripOption;
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