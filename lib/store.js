export class Store {
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
