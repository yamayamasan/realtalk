const Socket = require('./socket');

class Communicator extends Socket {
  join(data, cb = undefined) {
    const promise = super.emitSync('join.to', data);
    if (cb) promise.then(cb);
  }

  transmit(key, roomId, data, cb) {
    Object.assign(data, { to: roomId });
    super.emitSync(`t:${key}`, data).then(cb);
  }

  sendMessage(text, roomId, cb) {
    const data = { to: roomId, text };
    super.emitSync('send.message', data).then(cb);
  }

  watch(cb) {
    super.on('send.message:res', cb);
  }

  on(key, cb) {
    super.on(`r:${key}`, cb);
  }

  closed(cb) {
    super.on('close', cb);
  }
}

module.exports = Communicator;
