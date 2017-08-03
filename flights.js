module.exports = [
	{
		'id': 1,
		'name': 'London to Melbourne',
		'data': {
			'request': {
				'passengers': {
					'kind': 'qpxexpress#passengerCounts',
					'adultCount': 1
				},
				'slice': [
					{
						'kind': 'qpxexpress#sliceInput',
						'origin': 'LHR',
						'destination': 'MEL',
						'date': '2018-05-07',
						'maxStops': 1
					},
					{
						'kind': 'qpxexpress#sliceInput',
						'origin': 'MEL',
						'destination': 'LHR',
						'date': '2018-05-13',
						'maxStops': 1
					}
				]
			}
		}
	}
];