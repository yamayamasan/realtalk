const _ = require('lodash');

class State {
  constructor(ipcMain) {
    this.ipc = ipcMain;
    this.data = {};
    this.old = {};
    this.receivers();
  }

  set(key, val) {
    this.old[key] = _.cloneDeep(this.data)[key];
    _.set(this.data, key, val);
  }

  get(key) {
    return _.get(this.data, key);
  }

  has(key) {
    return _.has(this.data, key);
  }

  callbackSync(key, cb) {
    this.ipc.on(`state:call.sync[${key}]`, (ev, arg) => {
      const [key] = Object.keys(arg);
      cb(ev, arg[key]);
    });
  }

  callback(key, cb) {
    this.ipc.on(`state:call[${key}]`, (ev, arg) => {
      const [key] = Object.keys(arg);
      cb(ev, arg[key], (data) => {
        ev.sender.send(`state:call[${key}]:res`, data);
      });
    });
  }

  receivers() {
    this.ipc.on('state:init', (ev, arg) => {
      _.forEach(arg, (val, key) => {
        this.set(key, val);
      });
    });

    this.ipc.on('state:set', (ev, arg) => {
      const [key] = Object.keys(arg);
      this.set(key, arg[key]);
      ev.sender.send('state:set:res', arg, this.old);
    });

    this.ipc.on('state:remove', (ev, arg) => {
      const { key } = arg;
      this.set(key, null);
      ev.returnValue = { data: arg };
    });

    this.ipc.on('state:set.sync', (ev, arg) => {
      const [key] = Object.keys(arg);
      this.set(key, arg[key]);
      ev.returnValue = {
        data: arg,
        old: this.old,
      };
    });

    this.ipc.on('state:get', (ev, arg) => {
      const { key, def } = arg;
      const data = this.has(key) ? this.get(key) : def;
      ev.returnValue = data;
    });

    this.ipc.on('state:has', (ev, arg) => {
      const { key } = arg;
      ev.returnValue = this.has(key);
    });
  }
}

module.exports = State;
