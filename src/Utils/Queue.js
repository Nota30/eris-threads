import { EventEmitter } from 'node:events';

/**
 * Creates and manages the queue
 *
 * @class Queue
 * @augments {EventEmitter}
 */
export default class Queue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
  }

  executeQueue() {
    const item = this.queue[0];

    if (!item) return;
    this.emit('execute', item);
  }

  /**
   * Push items to the Queue
   *
   * @param {object} item
   * @memberof Queue
   */
  queueItem(item) {
    if (this.queue.length === 0) {
      this.queue.push(item);
      this.executeQueue();
    } else {
      this.queue.push(item);
    }
  }
}
