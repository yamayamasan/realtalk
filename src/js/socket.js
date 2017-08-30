const config = require('../../config/app.json');

class Socket {
  constructor(io) {
    this.client = io(config.server.host);
  }

  emitSync(key, data = null) {
    const resKey = `${key}:res`;
    this.client.emit(key, JSON.stringify(data));
    return new Promise((resolve) => {
      this.client.on(resKey, (response) => {
        resolve(response);
      });
    });
  }

  onSync(key) {
    return new Promise((resolve) => {
      this.client.on(key, (response) => {
        resolve(response);
      });
    });
  }

  on(key, cb) {
    this.client.on(key, cb);
  }
}

module.exports = Socket;
