import { inspect } from 'node:util';

class Timestamp {
  constructor() {
    this.now = new Date();
  }
}

Timestamp.prototype[inspect.custom] = function (depth, options) {
  const timestamp = this.now.toLocaleTimeString('en', { hour12: false });
  return '[' + options.stylize(timestamp, 'date') + ']';
};

/**
 * Fancy Logging
 *
 * @class Logger
 */
class Logger {
  /**
   * Log to console
   *
   * @param {*} source
   * @param {*} message_
   */
  log(source, message_) {
    const message = `\u001B[32m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.log(time, `${source} | ${message}`);
  }

  /**
   * Log information to console
   *
   * @param {*} source
   * @param {*} message_
   */
  info(source, message_) {
    const message = `\u001B[36m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.info(time, `${source} | ${message}`);
  }

  /**
   * Log silly color information to console
   *
   * @param {*} source
   * @param {*} message_
   */
  sillyInfo(source, message_) {
    const message = `\u001B[46m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.info(time, `${source} | ${message}`);
  }

  /**
   * Log warning to console
   *
   * @param {*} source
   * @param {*} message_
   */
  warn(source, message_) {
    const message = `\u001B[33m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.warn(time, `${source} | ${message}`);
  }

  /**
   * Log error to console
   *
   * @param {*} source
   * @param {*} message_
   */
  error(source, message_) {
    const message = `\u001B[31m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.error(time, `${source} | ${message}`);
  }

  /**
   * Log data to console
   *
   * @param {*} source
   * @param {*} message_
   */
  data(source, message_) {
    const message = `\u001B[2m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.log(time, `${source} | ${message}`);
  }

  /**
   * Debug
   *
   * @param {*} source
   * @param {*} message_
   */
  debug(source, message_) {
    const message = `\u001B[34m${message_}\u001B[0m`;
    const time = `\u001B[35m${inspect(new Timestamp())}\u001B[0m`;
    console.debug(time, `${source} | ${message}`);
  }
}

export default new Logger();
