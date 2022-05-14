import { EventEmitter } from 'node:events';
import process from 'node:process';

/**
 * IPC Handler
 *
 * @class IPC
 */
export default class IPC extends EventEmitter {
  constructor() {
    super();

    this.events = new Map();

    process.on('message', message => {
      const event = this.events.get(message._eventName);
      if (event) {
        event.fn(message);
      }
    });
  }

  /**
   * Register an event
   *
   * @param {string} event
   * @param {*} callback
   */
  register(event, callback) {
    this.events.set(event, { fn: callback });
  }

  /**
   * Unregister an event
   *
   * @param {string} event
   */
  unregister(event) {
    this.events.delete(event);
  }

  /**
   * Broadcast an event to all clusters
   *
   * @param {string} name
   * @param {object} message
   */
  broadcast(name, message = {}) {
    message.eventName = name;
    process.send({ msg: message, name: 'broadcast' });
  }

  /**
   * Send message to a cluster
   *
   * @param {*} cluster
   * @param {*} name
   * @param {*} message
   */
  sendTo(cluster, name, message = {}) {
    message.eventName = name;
    process.send({ cluster, msg: message, name: 'send' });
  }

  /**
   * Fetch a user
   *
   * @param {string} id
   * @returns
   */
  async fetchUser(id) {
    process.send({ id, name: 'fetchUser' });

    return new Promise(resolve => {
      const callback = user => {
        this.removeListener(id, callback);
        resolve(user);
      };

      this.on(id, callback);
    });
  }

  /**
   * Fetch a guild
   *
   * @param {string} id
   * @returns
   */
  async fetchGuild(id) {
    process.send({ id, name: 'fetchGuild' });

    return new Promise(resolve => {
      const callback = guild => {
        this.removeListener(id, callback);
        resolve(guild);
      };

      this.on(id, callback);
    });
  }

  /**
   * Fetch a channel
   *
   * @param {string} id
   * @returns
   */
  async fetchChannel(id) {
    process.send({ id, name: 'fetchChannel' });

    return new Promise(resolve => {
      const callback = channel => {
        this.removeListener(id, callback);
        resolve(channel);
      };

      this.on(id, callback);
    });
  }

  /**
   * Fetch a member
   *
   * @param {string} guildID
   * @param {string} memberID
   * @returns
   */
  async fetchMember(guildID, memberID) {
    process.send({ guildID, memberID, name: 'fetchMember' });

    return new Promise(resolve => {
      const callback = channel => {
        this.removeListener(memberID, callback);
        resolve(channel);
      };

      this.on(memberID, callback);
    });
  }
}
