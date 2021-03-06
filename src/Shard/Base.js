/**
 * Base Class
 *
 * @class Base
 */
export class Base {
  /**
   * Base class contructor
   *
   * @param {object} instance
   * @param {import('eris').Client} instance.bot
   * @param {number} instance.clusterID
   * @param {import('./Ipc.js').IPC} instance.ipc
   */
  constructor(instance) {
    this.bot = instance.bot;
    this.clusterID = instance.clusterID;
    this.ipc = instance.ipc;
  }

  clusterRestart(clusterID) {
    this.ipc.sendTo(clusterID, 'restart', { name: 'restart' });
  }
}
