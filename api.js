const apiKey			= 'AIzaSyBkpiCUiDDcBNSSQ99HxoIW3CwgLr7-E3k',
	  request			= require('request'),
	  fs				= require('fs'),
	  monitoredFlights	= require('./flights'),
	  moment			= require('moment'),
	  https				= require('https');

var flights = {};

flights.init = function() {
	let x = require('./data.json');
	for (f in monitoredFlights) {
	// 	flights.set(f, monitoredFlights[f])
	// 		.then(function(data){
				
	// 		})
		flights.sort(f, monitoredFlights, x)
			.then(function(result){
				console.log(result);
			})
	}
}

flights.set = function(index, data) {
	let promises = [];

	return new Promise(function(resolve, reject) {

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
			};

			promises.push(new Promise(function(resolve, reject) {	
				request({
					url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key=' + apiKey,
					method: 'POST',
					json: body
				}, function (error, response, body) {
					if (!error && response.statusCode === 200) resolve(body.trips.tripOption);
				});
			}));
		}

		Promise.all(promises).then(function(allData) {
			resolve(allData);
		});
	})
}

flights.sort = function(index, flightDetails, data) {
	let currentDate = moment().format('YYYY-MM-DD'),
		journeyData = {
			id: index,
			name: flightDetails[index].name,
			origin: flightDetails[index].origin,
			dest: flightDetails[index].dest,
			journey: []
		};

	return new Promise(function(resolve, reject) {
		for (let i = 0; i < data.length; i++) {
			let airline = data[i].slice[0].segment[0].flight.carrier,
				flightFee = data[i].saleTotal.replace(/[^0-9.]/g, ""),
				flight = journeyData.journey[airline];

			if (!flight) {
				journeyData.journey[airline] = flightFee;
				continue;
			}

			if (parseInt(journeyData.journey[airline]) < parseInt(flightFee)) continue;
			journeyData.journey[airline] = flightFee;
		}
		fs.writeFile('./test-formatted.json', JSON.stringify(journeyData, null, '\t'), 'utf8');
		resolve(journeyData);
	});
}

module.exports = flights;

flights.init();