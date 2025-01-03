import { BusStop } from "./bus-stop.js";
import { Store } from "./store.js";

export class BusRoute {
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
