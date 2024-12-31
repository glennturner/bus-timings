import { getDistanceFromLatLonInKm } from "./helpers.js";

export class BusStop {
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
