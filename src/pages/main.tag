<main>
  <!-- LOGIN -->
  <div class="column col-6 col-sm-12" if={ !$v.exist('roomId') }>
    <ul class="tab tab-block">
      <li class={ 'tab-item': true, 'active': $v.eq('isNew', true) } id="tab-new">
        <a href="#" onclick={tabToggle} data-isnew='1'>New</a>
      </li>
      <li class={ 'tab-item': true, 'active': $v.eq('isNew', false) } id="tab-login">
        <a href="#" onclick={tabToggle} data-isnew='0'>Login</a>
      </li>
    </ul>
  </div>

  <div class="columns" if={ !$v.exist('roomId') }>
    <div class="column col-12">
      <div class="form-group">
        <div if={ $v.eq('isNew', false) }>
          <label class="form-label" for="roomId">room id</label>
          <input class="form-input" type="text" id="roomId" placeholder="Room ID or empty" />
        </div>

        <div if={ $v.eq('isNew', true) }>
          <label class="form-label" for="roomKey">room key</label>
          <input class="form-input" type="text" id="roomKey" placeholder="roomkey"/>
        </div>

        <div if={ $v.eq('isNew', true) }>
          <label class="form-label" for="roomName">room name</label>
          <input class="form-input" type="text" id="roomName" placeholder="room name" required/>
        </div>
      </div>
      <div class="input-field col s3">
        <button type="button" onclick={onRooms} class="btn" if={ $v.eq('isNew', false) }>rooms</button>
        <button type="button" onclick={joinTo} class="btn btn-primary">join</button>
      </div>

      <div class="panel" if={ $v.eq('isRoomlist') }>
        <div class="panel-header">
          <div class="panel-title">Rooms</div>
        </div>
        <div class="panel-body">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>name</th>
                <th>id</th>
                <th>key</th>
              </tr>
            </thead>
            <tbody>
              <tr each={ room in $v.rooms } onclick={ onSelectRoom } data-room={room.room_id}>
                <td>{room.name}</td>
                <td>{room.room_id}</td>
                <td>{room.roomKey}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
  <!-- Main -->
  <div class="columns" if={ $v.exist('roomId') }>
    <div class="column col-12">
      <h5>You</h5>
      <div class="column col-12 horizontal">
        <button type="button" onclick={onClear} class="btn btn-link">clear</button>
        <button type="button" onclick={onEmergency} class="btn btn-link">er</button>
      </div>
      <div class="column col-12">
        <div><input class="form-input" type="text" id="msg" placeholder="input message" {$v.inputStatus}/></div>
      </div>
    </div>
    <div class="column col-12">
      <h5>Partner</h5>
      <div class="text-left">{ $v.partner.text }</div>
    </div>
    <div class="column col-12 fixed bottom-10">
      <label class="btn tooltip float-right" onclick={ onCopyRoomID } data-tooltip="copy">RoomID</label>
      <label class={ 'chip text-light p-1 rounded': true, 'bg-primary': $v.partner.visible, 'bg-dark': !$v.partner.visible }>{ $v.partner.visible ? 'ON' : 'OFF' }</label>
      <label class="chip">{ $v.partner.inputting ? '入力中' : '-' }</label>
      <label class="chip bg-success text-light rounded" if={$v.partner.connect}>online</label>
      <label class="chip bg-gray p-1 rounded" if={!$v.partner.connect}>offline</label>
    </div>
  </div>

  <style>
    .pointer {
      cursor: pointer;
    }
    .bottom-10 {
      bottom: 10px;
    }
  </style>

  <script>
    const $ = e => document.querySelector(e);
    const _ = require('lodash');
    const clipboard = require('electron').clipboard;
    const View = require('./js/view');
    const Cli = require('./js/cli');
    const db = require('./js/db');

    const cli = new Cli(io);
    const view = new View({
      isNew: true,
      inputStatus: false,
      isRoomlist: false,
      rooms: [],
      roomId: null,
      self: {
        visible: true,
      },
      partner: {
        visible: false,
        inputting: false,
        connect: false,
        text: '',
      }
    }, this);

    const watches = () => {
      cli.on('error', (res) => {
        console.error(res);
      });
      cli.on('typing', (res) => {
        view.set('partner.text', res);
      });
      cli.on('visible', (res) => {
        view.set('partner.visible', res);
      });
      cli.on('inputting', (res) => {
        view.set('partner.inputting', res);
      });
      cli.on('disconnecting', (res) => {
        view.set('partner.connect', false);
      });
      cli.on('connected', (res) => {
        view.set('partner.visible', true);
        view.set('partner.connect', true);
        cli.partnerstate(view.get('self'));
      });
      cli.on('partnerstate', ({ visible }) => {
        view.set('partner.visible', visible);
        view.set('partner.connect', true);
      });
    }

    function observWindow() {
      watchWindowState(({ visible }) => {
        view.set('self.visible', visible);
        cli.visible(visible);
      });
    }

    function eListener() {
      const ele = $('#msg');
      let observ = null;
      ele.addEventListener('focus', (e) => {
        cli.inputting(true);
        let cache = null;
        observ = setInterval(() => {
          if (cache !== ele.value) {
            cli.typing(ele.value);
            cache = ele.value;
          }
        }, 100);
      });

      ele.addEventListener('blur', (e) => {
        cli.inputting(false);
        clearInterval(observ);
        observ = null;
      });
    }

    const join = (roomId) => {
      view.set('isRoomlist', false);
      const isNew = view.get('isNew');

      let roomName;
      let roomKey;
      let valid;

      if (isNew) {
        roomName = $('#roomName').value;
        roomKey = $('#roomKey').value;
        valid = ((!_.isNull(roomName) && roomName !== '') && (!_.isNull(roomKey) && roomKey !== ''));
      } else {
        valid = (!_.isNull(roomId) && roomId !== '')
      }

      if (!valid) return;

      cli.start(roomId, roomKey, (res) => {
        view.set('roomId', res);
        watches();
        observWindow();
        eListener();
        if (isNew) {
          db.table('rooms').add({
            room_id: res,
            name: roomName,
            roomKey: roomKey,
          });
        }
      });
    };

    this.joinTo = () => {
      const erid = $('#roomId');
      const roomId = (erid === null) ? null : erid.value;
      join(roomId);
    };

    this.onSelectRoom = (e) => {
      join(e.target.dataset.room);
    };

    this.onRooms = () => {
      view.set('isRoomlist', true);
    };

    this.onCopyRoomID = () => {
      clipboard.writeText(view.get('roomId'));
    };

    this.onClear = () => {
      view.set('partner.text', '');
    };

    this.onEmergency = () => {
      cli.emergency();
    };

    this.tabToggle = (e) => {
      view.set('isNew', Boolean(Number(e.target.dataset.isnew)));
    };

    this.on('mount', async () => {
      const rooms = await db.table('rooms').all();
      view.set('rooms', rooms);
    });
  </script>
</main>
