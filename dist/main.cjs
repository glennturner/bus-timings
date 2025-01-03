(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["BusTimeService"] = factory();
	else
		root["BusTimeService"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  BusTimeService: () => (/* binding */ BusTimeService),
  Store: () => (/* reexport */ Store)
});

;// ./lib/helpers.js
// via https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(
    Math.sqrt(a), Math.sqrt(1-a)
  );

  const d = R * c; // Distance in km
  return d;
}

;// ./lib/bus-stop.js


class BusStop {
  #direction;
  #predictions = [];
  #routes = [];

  constructor(id, name, lat = undefined, lon = undefined) {
    this.id = id;
    this.name = name;
    this.lat = lat;
    this.lon = lon;
  }

  get direction() {
    return this.#direction;
  }

  set direction(direction) {
    this.#direction = direction;
  }

  get routes () {
    return this.#routes;
  }

  set routes(routes) {
    this.#routes = routes;
  }

  get predictions() {
    return this.#predictions;
  }

  set predictions(predictions) {
    this.#predictions = predictions;
  }

  get displayName () {
    return `${this.name} (${this.direction})`;
  }

  distanceFrom(lat, lon) {
    return getDistanceFromLatLonInKm(lat, lon, this.lat, this.lon);
  }
}

;// ./lib/store.js
class Store {
  #storeName;
  #storageType;

  constructor(storeName, storageType = "localStorage") {
    this.#storeName = storeName;
    this.#storageType = storageType;
  }

  get storeName() {
    return this.#storeName;
  }

  get storageType() {
    return this.#storageType;
  }

  get({ raw = false } = {}) {
    let data = {};
    switch(this.storageType) {
      case "localStorage":
        data = this.getLocalStore();
      case "fileStorage":
        data = this.getFileStore();
    }

    return raw ? data : data?.data || [];
  }

  lastUpdated () {
    return this.get().updatedAt;
  }

  getFileStore() {
    return [];
  }

  getLocalStore() {
    return JSON.parse(localStorage.getItem(this.storeName)) || [];
  }

  save(data) {
    const saveData = { data: data, updatedAt: Date.now() }

    switch(this.storageType) {
      case "localStorage":
        return this.saveLocalStore(saveData);
      case "fileStorage":
        return this.saveFileStore(saveData);
      default:
        return [];
    }
  }

  delete() {
    switch(this.storageType) {
      case "localStorage":
        return this.deleteLocalStore();
      case "fileStorage":
        return this.deleteFileStore();
      default:
        return [];
    }
  }

  deleteLocalStore() {
    localStorage.removeItem(this.storeName);
  }

  deleteFileStore() {}

  sweep(expiresAt) {
    if (this.get({ raw: true })?.updatedAt < expiresAt) {
      this.delete();
    }
  }

  saveLocalStore(value) {
    localStorage.setItem(this.storeName, JSON.stringify(value));
  }

  saveFileStore(value) {
    return [];
  }
}

;// ./lib/bus-route.js



class BusRoute {
  #directions = [];
  #stops = [];
  #store;
  #storeName = "BusTimingsBusTrackerRoutes";

  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.displayName = `${this.id} - ${this.name}`;
    this.#store = new Store(this.#storeName);
  }

  get directions() {
    return this.#directions;
  }

  set directions(routeDirections) {
    this.#directions = routeDirections;
  }

  get stops() {
    return this.#stops;
  }

  set stops(routeStops) {
    this.#stops = routeStops.map(stop =>
      new BusStop(stop.id, stop.name, stop.lat, stop.lon)
    );
  }

  nearbyStops(lat, lon) {
    console.log("STOPS", this.stops);
    // return this.store.load(this.id);
  }
}

;// ./lib/trip.js




class Trip {
  #route = undefined;
  #direction = undefined;
  #stop = undefined;
  #predictions = [];

  #store;
  #storageType = undefined;
  static storageName = "BusTimingsTrips";

  constructor({
    origin, destination, storageType = "localStorage"
   } = {}
  ) {
    this.#storageType = storageType;
    this.origin = origin || {};
    this.destination = destination;
    this.#store = new Store(Trip.storageName, this.#storageType);
  }

  store() {
    Trip.trips = [
      {
        route: {
          id: this.route.id,
          name: this.route.name
        },
        direction: this.direction,
        stop: {
          id: this.stop.id,
          name: this.stop.name
        },
        updatedAt: Date.now()
      },
      ...Trip.storedTrips.filter(
        trip => trip.stop.id != this.stop.id
      )
    ];
  }

  #populateByStop() {
    const trip = UserTrip.trips.find(trip => trip.stop === this.stop.id);

    this.route = new Route(trip.route.id, trip.route.name);
    this.direction = trip.direction;
    this.stop = new BusStop(trip.stop.id);
    this.stop.direction = this.direction;
  }

  static get recentStopExpiryDays() {
    return 14;
  }

  static get storedTrips () {
    return new Store(Trip.storageName).get()
  }

  static get trips() {
    return (
      Trip.storedTrips.map(record => {
        let trip = new Trip();

        trip.route = new BusRoute(record.route.id, record.route.name);
        trip.direction = record.direction;
        trip.stop = new BusStop(record.stop.id, record.stop.name);
        trip.stop.direction = trip.direction;

        return trip;
      })
    );
  }

  static set trips(trips) {
    new Store(Trip.storageName).save(trips);
  }

  static get tripStops() {
    return Trip.trips.map(trip => trip.stop);
  }

  static #sweep() {
    const expiryDate = new Date;
    expiryDate.setDate(
      expiryDate.getDate() - Trip.recentStopExpiryDays
    );

    Trip.trips = Trip.trips.filter(
      stop => new Date(stop.updatedAt) > expiryDate
    );
  }

  get shortDisplayName () {
    return `${this.route.displayName} - ${this.stop.name}`;
  }

  get displayName() {
    return `${this.route.displayName} - ${this.stop.name} (${this.direction})`;
  }

  get route() {
    return this.#route;
  }

  set route(route) {
    this.#route = route;
  }

  get direction() {
    return this.#direction;
  }

  set direction(direction) {
    this.#direction = direction;
  }

  get stop() {
    return this.#stop;
  }

  set stop(stop) {
    this.#stop = stop;
  }
}

;// ./src/index.js









class BusTimeService {
  #key;
  #baseUrl;
  #prefs;
  #storeName;
  #storeType;

  #routes = [];
  #stops = [];

  #maxDistance = 0.5;
  #format = "json";
  #locale = "en";

  constructor(key, baseUrl = "https://bustime.mta.info/api/siri/", storeType = "localStorage", storeName = "BusTimeBusTrackerPrefs") {
    this.#key = key;
    this.#baseUrl = baseUrl;
    this.#storeName = storeName;
    console.log("storeName", this.#storeName);
    this.#storeType = storeType;
    console.log("storeType", this.#storeType);

    this.locationCache = new Store("location", this.#storeType);

    this.trip = new Trip({ storageType: this.#storeType });

    this.#prefs = new Store(this.#storeName, this.#storeType);
  }

  routeById(routeId) {
    return this.routes.find(route => route.id === routeId);
  }

  stopById(stopId) {
    return this.stops.find(stop => stop.id === stopId);
  }

  userStopDisplayName(stop) {
    return Trip.tripStops.find(tripStop => tripStop.stopId == stop.id);
  }

  sortRecentStops(sortBy = 'updatedAt') {
    return Trip.tripStops.sort(stop => stop[sortBy]);
  }

  setCurrentUserLocation(location) {
    this.trip.origin = location;
    this.locationCache.save(location)
  }

  /**
   * Utilizes #setCurrentUserLocation to get the user's location.
   *
   * If the trip origin is not set, it will set the trip origin to the user's location.
   *
   * @returns {Promise} Trip location coords
   */
  async getTripOrigin() {
    return await new Promise((resolve) => {
      return resolve(this.trip.origin);
    })
  }

  async getTime() {
    return await this.request("gettime").then(data => data.tm);
  }

  /**
   * Get predictions for nearby stops from passed route IDs.
   *
   * @param {array} routeIds (limit 3)
   * @param {boolean} nearest (default false)
   *
   * @returns {array} Prediction objects
   */
  async getPredictionsByRouteIds(routeIds, nearest = false) {
    routeIds = routeIds.slice(0, 2);

    return await this.getNearbyStopsByRouteIds(routeIds).then(nearbyStops => {
      this.getPredictions(nearbyStops.map(stop => stop.id)).then(predictions => {
        console.log("predictionsByRouteIds")
        console.log(predictions);
      });
    });
  }

  /**
   * Get the nearest stops for passed route IDs.
   *
   * @param {array} routeIds (limit 3)
   *
   * @returns {array} BusStop objects
   */
  async getNearestStopsByRouteIds(routeIds) {
    let nearest = new Map();

    return await this.getNearbyStopsByRouteIds(routeIds).then(stops => {
      const [ lat, lon ] = [
        this.trip.origin.latitude,
        this.trip.origin.longitude
      ];

      stops.map(stop => {
        let key = `${stop.routeNumber}-${stop.direction}`;
        nearest.get(key) || nearest.set(key, []);
        nearest.get(key).push(stop);
      });

      nearest.forEach((stops, routeNumber) => {
        nearest.set(routeNumber,
          stops.sort((a, b) =>
            a.distanceFrom(lat, lon) - b.distanceFrom(lat, lon)).shift()
        );
      });

      return Object.values(Object.fromEntries(nearest));
    });
  }

  /**
   * Get the nearby stops for passed route IDs.
   *
   * @param {array} routeIds (limit 3)
   *
   * @returns {array} BusStop objects
   */
  async getNearbyStopsByRouteIds(routeIds) {
    routeIds = routeIds.slice(0, 2);
    return await this.getRoutesDirectionsByRouteIds(routeIds).then(dirs => {
      return Promise.all(
        dirs.flat().map(
          dir => this.getNearbyStops(dir.routeId, dir.direction)
        )
      );
    }).then(stops => stops.flat());
  }

  /**
   * Get the available route directions for passed route IDs.
   *
   * @param {array} routeIds (limit 5)
   *
   * @returns {array} Object { direction, routeId }
   */
  async getRoutesDirectionsByRouteIds(routeIds) {
    const directionPromises = routeIds.map(routeId => {
      return this.getDirections(routeId).then(
        directions => directions.map(direction => {
          return {
            direction: direction,
            routeId: routeId
          }
        })
      );
    });

    return await Promise.all(directionPromises);
  }

  async getRoutes() {
    return await this.request("getroutes").then(data => data["routes"].map(
      route => {
        const busRoute = new BusRoute(route.rt, route.rtnm);
        this.routes.push(busRoute);
        return busRoute;
      }
    ));
  }

  async getStops(stops) {
    return await this.request("getstops", {
      "stpid": stops.join(",")
    }).then(this.#assembleStops);
  }

  async getStopsByRouteAndDirection(routeNumber, direction) {
    return await this.request("getstops", {
      "dir": direction,
      "rt": routeNumber
    }).then(stops => {
      return this.#assembleStops(stops).map(stop => {
        stop.routeNumber = routeNumber;
        stop.direction = direction;
        return stop;
      });
    });
  }

  async getRecentStops() {
    return await this.request("getstops", {
      stpid: Trip.tripStops.map(stop => stop.id).join(",")
    }).then(this.#assembleStops);
  }

  async getNearbyStops(routeNumber, direction) {
    return await this.getStopsByRouteAndDirection(routeNumber, direction).then(stops => {
      return stops.filter(stop => {
        const distance = this.getDistanceFromUser(stop);
        return distance < this.#maxDistance;
      });
    })
  }

  async getVehicles(routeNumbers) {
    return await this.request("getvehicles", {
      "rt": routeNumbers.join(",")
    }).then(data => data["vehicle"]);
  }

  /**
   * Get the directions for a route.
   *
   * v2 BusTime directions only return the direction string.
   * v3 BusTime directions return the direction string and the direction ID.
   *
   * @param {string} routeNumber
   *
   * @returns {array} direction
   */
  async getDirections(routeNumber) {
    return await this.request("getdirections", {
      "rt": routeNumber
    }).then(data => data["directions"].map(direction => direction.dir));
  }

  async getStopsPredictions(stops) {
    return await this.request("getpredictions", {
      "stpid": stops.map(stop => stop.id).join(",")
    }).then(data => {
      if (!data["prd"]) { return []; }

      data["prd"].map(prediction => {
        stops.find(
          stop => stop.id === prediction.stpid
        ).predictions.push(prediction);
      });

      return stops;
    });
  }

  async getPredictions(stopIds) {
    return await this.request("getpredictions", {
      "stpid": stopIds.join(",")
    }).then(data => data["prd"]);
  }

  getDistanceFromUser(stop) {
    const distance = getDistanceFromLatLonInKm(
      this.trip.origin.latitude,
      this.trip.origin.longitude,
      stop.lat,
      stop.lon
    );

    return distance;
  }

  #assembleStops(data) {
    return data["stops"].map(
      stop => new BusStop(stop.stpid, stop.stpnm, stop.lat, stop.lon)
    );
  }

  get prefs () {
    return this.#prefs.get();
  }

  set prefs (prefs) {
    this.#prefs.save(prefs);
  }

  pref (key) {
    return this.prefs[key];
  }

  get recentUserStopIds() {
    return Trip.tripStops.map(stop => stop.id);
  }

  get trips() {
    return Trip.trips;
  }

  get tripStops() {
    return Trip.tripStops || [];
  }

  get routes() {
    return this.#routes;
  }

  set routes (routes) {
    this.#routes = routes;
  }

  set route(routeId) {
    this.trip.route = this.routeById(routeId);
  }

  get stops() {
    return this.#stops;
  }

  set stops (stops) {
    this.#stops = stops;
  }

  set stop(stopId) {
    this.trip.stop = this.stopById(stopId);
    this.trip.store();
  }

  async request (action, params = {}) {
    return this.#request(action, params);
  }

  async #request(action, params = {}) {
    params.key = this.#key;
    params.format = this.#format;
    params.locale = this.#locale;

    const url = `${this.#baseUrl}/${action}?`
      + Object.keys(params).map(key => key + '=' + params[key]).join('&')

    console.log(url);
    return await fetch(url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    ).then(response => response.json())
      .then(response => response["bustime-response"])
      .catch(error => console.error(error));
  }
}

/******/ 	return __webpack_exports__;
/******/ })()
;
});