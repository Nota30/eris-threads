import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';

/**
 * Handle and sync requests among clusters
 *
 * @class RequestHandler
 */
export default class RequestHandler {
  /**
   * RequestHandler constructor
   *
   * @param {import('./Ipc.js').default} ipc
   * @param {object} options
   */
  constructor(ipc, options) {
    this.ipc = ipc;
    this.timeout = options.timeout + 1000;
  }

  /**
   *
   * @param {*} method
   * @param {*} url
   * @param {*} auth
   * @param {*} body
   * @param {*} file
   * @param {*} _route
   * @param {*} short
   * @returns
   */
  request(method, url, auth, body, file, _route, short) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line unicorn/error-message
      const stackCapture = new Error().stack;

      const requestID = crypto.randomBytes(16).toString('hex');

      if (file && file.file) file.file = Buffer.from(file.file).toString('base64');

      process.send({
        _route,
        auth,
        body,
        file,
        method,
        name: 'apiRequest',
        requestID,
        short,
        url,
      });

      const timeout = setTimeout(() => {
        reject(new Error(`Request timed out (>${this.timeout}ms) on ${method} ${url}`));

        this.ipc.unregister(`apiResponse.${requestID}`);
      }, this.timeout);

      this.ipc.register(`apiResponse.${requestID}`, data => {
        if (data.err) {
          const error = new Error(data.err.message);

          error.stack =
            data.err.stack +
            '\n' +
            stackCapture.slice(Math.max(0, stackCapture.indexOf('\n') + 1));
          error.code = data.err.code;

          reject(error);
        } else {
          resolve(data.data);
        }

        clearTimeout(timeout);

        this.ipc.unregister(`apiResponse.${requestID}`);
      });
    });
  }
}
