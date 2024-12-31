import { BusRoute } from "../lib/bus-route.js";
import { BusStop } from "../lib/bus-stop.js";
import { Store } from "../lib/store.js";
import { Trip } from "../lib/trip.js";

import { getDistanceFromLatLonInKm } from "../lib/helpers.js";

export { Store } from "../lib/store.js";

export class BusTimeService {
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
