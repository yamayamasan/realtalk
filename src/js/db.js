const Dexie = require('dexie');

class DB {
  constructor() {
    this.db = new Dexie('realtalk');
    this.db.version(1).stores({
      rooms: '++id, &room_id, name, roomkey',
    });
    this.tbl = null;
  }

  table(name) {
    this.tbl = name;
    return this;
  }

  add(data) {
    this.db[this.tbl].add(data);
  }

  all() {
    return this.db[this.tbl].toArray();
  }
}

module.exports = new DB();
