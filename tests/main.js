import { Base } from '../dist/esm/index.js';

export default class Bot extends Base {
  constructor(bot) {
    super(bot);
    this.init();
  }

  init() {
    console.log('Bot ready!');

    this.bot.on('messageCreate', message => {
      console.log(message.content);
    });
  }
}
