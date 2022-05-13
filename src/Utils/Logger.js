import colors from 'colors';
import log from 'fancy-log';

colors.setTheme({
  data: 'grey',
  debug: 'cyan',
  error: 'red',
  help: 'cyan',
  info: 'green',
  log: 'grey',
  prompt: 'grey',
  silly: 'rainbow',
  verbose: 'cyan',
  warn: 'yellow',
});

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
    const message = colors.log(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log information to console
   *
   * @param {*} source
   * @param {*} message_
   */
  info(source, message_) {
    const message = colors.info(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log warning to console
   *
   * @param {*} source
   * @param {*} message_
   */
  warn(source, message_) {
    const message = colors.warn(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log error to console
   *
   * @param {*} source
   * @param {*} message_
   */
  error(source, message_) {
    const message = colors.error(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Log data to console
   *
   * @param {*} source
   * @param {*} message_
   */
  data(source, message_) {
    const message = colors.data(message_);
    log(`${source} | ${message}`);
  }

  /**
   * Debug
   *
   * @param {*} source
   * @param {*} message_
   */
  debug(source, message_) {
    const message = colors.debug(message_);
    log(`${source} | ${message}`);
  }
}

export default new Logger();
