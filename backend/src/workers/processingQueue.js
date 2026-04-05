'use strict';

const EventEmitter = require('events');
const { processVideo } = require('./videoProcessor');
const logger = require('../utils/logger');

/**
 * In-memory Job Queue.
 * For MVP, this isolates the worker logic from the request thread.
 * For production, this would be replaced by Redis / BullMQ or AWS SQS.
 */
class ProcessingQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;

    // Start listening for new jobs
    this.on('job:added', this.processNext);
  }

  /**
   * Add a job to the back of the queue
   * @param {Object} job - e.g. { videoId: '...' }
   */
  addJob(job) {
    this.queue.push(job);
    logger.debug(`Job added to queue. Queue length: ${this.queue.length}`);
    this.emit('job:added');
  }

  /**
   * Pulls the next job and executes the videoProcessor.
   * Ensures only one job processes at a time to prevent CPU overload from FFmpeg context switches.
   */
  processNext = async () => {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      // Hands off to the heavy lifter
      await processVideo(job.videoId);
    } catch (err) {
      // In a real queue we might retry here, but processVideo handles state updates.
      logger.error('Worker sequence failed unexpectedly', err);
    } finally {
      this.isProcessing = false;
      // Immediately try the next job
      if (this.queue.length > 0) {
        this.emit('job:added');
      }
    }
  };
}

// Export singleton instance
const queueInstance = new ProcessingQueue();
module.exports = queueInstance;
