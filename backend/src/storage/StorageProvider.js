'use strict';

/**
 * StorageProvider Interface / Base Class
 * Defines the contract that all storage implementations must satisfy.
 * Ensures the business logic remains decoupled from the storage mechanism.
 */
class StorageProvider {
  /**
   * Retrieves a readable stream for a file.
   * Crucial for HTTP Range streaming and passing files to FFmpeg.
   *
   * @param {string} filePath - Provider-relative path.
   * @param {Object} options - Stream options (e.g., { start, end }).
   * @returns {Promise<stream.Readable>}
   */
  async getReadStream(filePath, options = {}) {
    throw new Error('Method not implemented.');
  }

  /**
   * Resolves a provider-relative path to a fully qualified path or URL.
   * Useful for directly feeding FFmpeg if it accepts a local path or signed URL.
   *
   * @param {string} filePath
   * @returns {string}
   */
  getAbsolutePath(filePath) {
    throw new Error('Method not implemented.');
  }

  /**
   * Deletes a file from storage.
   *
   * @param {string} filePath
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    throw new Error('Method not implemented.');
  }

  /**
   * Generates the provider-specific path template.
   * For local storage, this might just return the filename to be saved in UPLOAD_DIR.
   * For S3, it might include the tenant prefix (e.g., `tenantId/filename.mp4`).
   *
   * @param {string} tenantId
   * @param {string} filename
   * @returns {string}
   */
  generatePath(tenantId, filename) {
    throw new Error('Method not implemented.');
  }
}

module.exports = StorageProvider;
