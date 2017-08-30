const NeDB = require('nedb');

const dbpath = '../nedb';

class NoSQLDB {
  constructor(tblName) {
    this.cli = new NeDB({
      filename: `${dbpath}/${tblName}.db`,
    });
    this.cli.loadDatabase();
    this.timestamp = {
      created_at: null,
      updated_at: null,
    };
  }

  cli() {
    return this.cli;
  }

  setTimestamp(cond = {}) {
    const { c = true, u = true } = cond;
    const now = new Date().toLocaleString('ja-JP');
    if (c) this.timestamp.created_at = now;
    if (u) this.timestamp.updated_at = now;
    return this;
  }

  findOneSync(query) {
    return new Promise((resolve, reject) => {
      this.cli.findOne(query, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  findSync(query) {
    return new Promise((resolve, reject) => {
      this.cli.find(query, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  insertSync(data) {
    const params = this.mergeTimestamps(data);
    return new Promise((resolve, reject) => {
      this.cli.insert(params, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  updateSync(query, data) {
    const params = this.mergeTimestamps(data);
    return new Promise((resolve, reject) => {
      this.cli.update(query, params, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  removeSync(data) {
    return new Promise((resolve, reject) => {
      this.cli.remove(data, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  mergeTimestamps(data) {
    const copy = Object.assign({}, data);
    if (Array.isArray(data)) {
      Object.keys(copy).forEach((k) => {
        copy[k] = Object.assign(copy[k], this.timestamp);
      });
    } else {
      Object.assign(copy, this.timestamp);
    }
    return copy;
  }
}

module.exports = NoSQLDB;
