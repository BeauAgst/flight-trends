import request from 'request';
import fs from 'fs';
import moment from 'moment';
import monitoredFlights from './flights';

const rawJson = './raw.json';

const flights = {
    apiKey: '',

    init() {
        const promises = [];

        return new Promise(((resolve) => {
            for (const f in monitoredFlights) {
                promises.push(new Promise(((res) => {
                    flights.sort(f, monitoredFlights, rawJson)
                        .then((result) => {
                            res(result);
                        });
                })));
            }

            Promise.all(promises).then((data) => {
                fs.writeFile('./output.json', JSON.stringify(data, null, '\t'), 'utf8');
                resolve(data);
            });
        }));
    },

    set(index, data) {
        const promises = [];

        return new Promise(((resolve) => {
            for (let j = 0; j < 2; j++) {
                const body = {
                    request: {
                        passengers: {
                            kind: 'qpxexpress#passengerCounts',
                            adultCount: 1,
                        },
                        slice: [
                            {
                                kind: 'qpxexpress#sliceInput',
                                origin: data.origin,
                                destination: data.dest,
                                date: moment(data.startDate).add(j, 'd').format('YYYY-MM-DD'),
                                maxStops: data.maxStops,
                            },
                            {
                                kind: 'qpxexpress#sliceInput',
                                origin: data.dest,
                                destination: data.origin,
                                date: moment(data.startDate).add(j + 6, 'd').format('YYYY-MM-DD'),
                                maxStops: data.maxStops,
                            },
                        ],
                        solutions: 30,
                    },
                };

                promises.push(new Promise(((res) => {
                    request({
                        url: `https://www.googleapis.com/qpxExpress/v1/trips/search?key=${this.apiKey}`,
                        method: 'POST',
                        json: body,
                    }, (error, response, content) => {
                        if (!error && response.statusCode === 200) res(content.trips.tripOption);
                    });
                })));
            }

            Promise.all(promises).then((allData) => {
                resolve(allData);
            });
        }));
    },

    sort(index, flightDetails, data) {
        const currentDate = moment().format('YYYY-MM-DD');
        const journeyData = {
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
                            ],
                        },
                    ],
                },
            ],
        };

        return new Promise(((resolve) => {
            for (let i = 0; i < data[index].length; i++) {
                const airline = data[index][i].slice[0].segment[0].flight.carrier;
                const date = data[index][i].slice[0].segment[0].leg[0].departureTime;
                const flightFee = data[index][i].saleTotal.replace(/[^0-9.]/g, '');
                const entry = {
                    name: airline,
                    price: flightFee,
                };
                const match = flights.search(entry, journeyData.journey[0].data[0].carriers);

                if (match) continue;
                if (!('date' in journeyData.journey[0])) journeyData.journey[0].date = date;
                journeyData.journey[0].data[0].carriers.push(entry);
            }
            resolve(journeyData);
        }));
    },

    search(entry, array) {
        let match = false;

        for (let i = 0; i < array.length; i++) {
            if (entry.name !== array[i].name && i === array.length - 1) return match;
            if (entry.name !== array[i].name) continue;
            if (entry.price >= array[i].price) match = true;
        }
        return match;
    },
};

module.exports = flights;

export { flights as default };
