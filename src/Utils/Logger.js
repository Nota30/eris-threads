import { grey, blue, red, cyan, green, rainbow, yellow } from 'colors';
import * as log from 'fancy-log';

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
    const message = green(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log information to console
   *
   * @param {*} source
   * @param {*} message_
   */
  info(source, message_) {
    const message = cyan(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log silly color information to console
   *
   * @param {*} source
   * @param {*} message_
   */
  sillyInfo(source, message_) {
    const message = rainbow(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log warning to console
   *
   * @param {*} source
   * @param {*} message_
   */
  warn(source, message_) {
    const message = yellow(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log error to console
   *
   * @param {*} source
   * @param {*} message_
   */
  error(source, message_) {
    const message = red(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log data to console
   *
   * @param {*} source
   * @param {*} message_
   */
  data(source, message_) {
    const message = grey(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Debug
   *
   * @param {*} source
   * @param {*} message_
   */
  debug(source, message_) {
    const message = blue(message_);
    log(`${source} | ${message}`);
  }
}

export default new Logger();
