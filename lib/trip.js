import { BusRoute } from "./bus-route.js";
import { BusStop } from "./bus-stop.js";
import { Store } from "./store.js";

export class Trip {
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
