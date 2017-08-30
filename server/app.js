const Koa = require('koa');
const SocketIo = require('socket.io');
const Uuid = require('uuid');
const NoSQLDB = require('./lib/nosql.db');

const app = new Koa();
const port = 3434;
const server = app.listen(port, () => {
  console.log('start port', port);
});
const io = SocketIo.listen(server);

const roomDB = new NoSQLDB('rooms');

const events = ['typing', 'visible', 'inputting', 'emergency', 'mystate', 'partnerstate'];

const errLog = e => console.error(e);

io.on('connect', (socket) => {
  console.log(`[${socket.id}] connected`);
});

io.on('connection', (socket) => {
  socket.on('disconnecting', async () => {
    const [, roomId] = Object.values(socket.rooms);
    const roomData = await roomDB.findOneSync({ roomId });
    if (roomData && roomData.sockets) {
      const sockets = roomData.sockets.filter(soc => (soc !== socket.id));

      roomData.sockets = sockets;
      await roomDB.setTimestamp({ c: false }).updateSync({ roomId }, roomData).catch(errLog);
    }
    socket.to(roomId).emit('r:disconnecting', null);
  });

  socket.on('join.to', async (data) => {
    let { roomId } = JSON.parse(data);

    if (!roomId) {
      roomId = Uuid.v4();
      await roomDB.setTimestamp().insertSync({ roomId, sockets: [socket.id] }).catch(errLog);
    } else {
      const roomData = await roomDB.findOneSync({ roomId }).catch(errLog);
      if (roomData) {
        roomData.sockets.push(socket.id);
        const params = { roomId: roomData.roomId };
        await roomDB.setTimestamp({ c: false }).updateSync(params, roomData).catch(errLog);
      } else {
        roomId = null;
      }
    }

    if (roomId) socket.join(roomId);

    socket.to(roomId).emit('r:connected', null);
    socket.emit('join.to:res', roomId);
  });

  events.forEach((event) => {
    socket.on(`t:${event}`, (data) => {
      const { to, value } = JSON.parse(data);
      socket.to(to).emit(`r:${event}`, value);
    });
  });
});
