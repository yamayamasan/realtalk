const readline = require('readline');
const Cli = require('../src/js/cli.js');

const cli = new Cli();

class Term {
    /*
  constructor(handler) {
    this.handler = handler;
  }
  */

  run() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('input `roomId` or `new`:', (ans) => {
      if (ans === '' || !ans) {
        console.error('faild roomId');
        process.exit(2);
      }
      const roomId = (ans === 'new') ? null : ans;
      cli.start(roomId, () => {
        rl.prompt();
        this.typing();
      });
    });
    rl.setPrompt('> ');
  }

  typing() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', (str) => {
      cli.typing(str);
    });
  }
}

const t = new Term();
t.run();
