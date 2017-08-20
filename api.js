const apiKey			= 'AIzaSyBkpiCUiDDcBNSSQ99HxoIW3CwgLr7-E3k',
	  request			= require('request'),
	  fs				= require('fs'),
	  monitoredFlights	= require('./flights'),
	  moment			= require('moment'),
	  https				= require('https');

var flights = {};

flights.init = function() {
	let promises = [];

		return new Promise(function(resolve, reject) {

			for (f in monitoredFlights) {

				promises.push(new Promise(function(resolve, reject) {
		// 		flights.set(f, monitoredFlights[f])
		// 			.then(function(data){
						let data = require('./raw.json');
						flights.sort(f, monitoredFlights, data)
							.then(function(result){
								resolve(result);
							})
				// 	})
				}));
			}

			Promise.all(promises).then(function(data) {
				fs.writeFile('./output.json', JSON.stringify(data, null, '\t'), 'utf8');
				resolve(data);
			});
		});

}

flights.set = function(index, data) {
	let promises = [];

	return new Promise(function(resolve, reject) {

		for (let j = 0; j < 2; j++) {
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
		};

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
			journey: [
				{
					data: [
						{
							recorded: currentDate,
							carriers: [
							]
						}
					]
				}
			]
		};

	return new Promise(function(resolve, reject) {

		for (let i = 0; i < data[index].length; i++) {
			let airline = data[index][i].slice[0].segment[0].flight.carrier,
				date = data[index][i].slice[0].segment[0].leg[0].departureTime,
				flightFee = data[index][i].saleTotal.replace(/[^0-9.]/g, ""),
				entry = {
					name: airline,
					price: flightFee
				},
				match = flights.search(entry, journeyData.journey[0].data[0].carriers);

			if (match) continue;
			if (!("date" in journeyData.journey[0])) journeyData.journey[0].date = date;
			journeyData.journey[0].data[0].carriers.push(entry);
		}
		resolve(journeyData);
	});
}

flights.search = function(entry, array) {
	let match = false;

	for (let i = 0; i < array.length; i++) {
		if (entry.name !== array[i].name && i == array.length -1) return match;
		if (entry.name !== array[i].name) continue;
		if (entry.price >= array[i].price) match = true;
	}
	return match;
}

module.exports = flights;

flights.init()