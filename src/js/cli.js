const Communicator = require('./communicator');

class Cli {
  constructor(io) {
    this.com = new Communicator(io);
    this.roomId = null;
  }

  start(roomId = null, roomKey, cb = undefined) {
    this.com.join({ roomId, roomKey }, (res) => {
      this.roomId = res;
      console.log(`[start]:roomId is ${res}`);
      cb(this.roomId);
    });
  }

  send(text) {
    this.com.sendMessage(text, this.roomId, (res) => {
      console.log('[send]:', res);
    });
  }

  typing(char) {
    const data = { value: char };
    this.com.transmit('typing', this.roomId, data, () => {});
  }

  visible(state) {
    const data = { value: state };
    this.com.transmit('visible', this.roomId, data, () => {});
  }

  inputting(val) {
    const data = { value: val };
    this.com.transmit('inputting', this.roomId, data, () => {});
  }

  emergency() {
    const data = { value: null };
    this.com.transmit('emergency', this.roomId, data, () => {});
  }

  partnerstate(value) {
    const data = { value };
    this.com.transmit('partnerstate', this.roomId, data, () => {});
  }

  on(key, cb) {
    this.com.on(key, cb);
  }

  static onWatch(res) {
    console.log('[watch]', res);
  }
}

module.exports = Cli;
