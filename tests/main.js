import console from 'node:console';
import { Base } from '../src/index.js';

export default class Class extends Base {
  // eslint-disable-next-line no-useless-constructor
  constructor(bot) {
    super(bot);
  }

  launch() {
    console.log('Bot ready!');

    this.bot.on('messageCreate', message => {
      if (message.author.id === '554476322303246388') console.log(message.content);
    });
  }
}
