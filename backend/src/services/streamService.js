'use strict';

const fsPromises = require('fs/promises');
const storageLayer = require('../storage');
const logger = require('../utils/logger');

/**
 * Service dedicated to streaming files using HTTP Range requests (206 Partial Content).
 */
const handleStream = async (video, rangeHeader, res) => {
  if (!rangeHeader) {
    const err = new Error('Requires Range header');
    err.status = 416; // Range Not Satisfiable
    throw err;
  }

  const absolutePath = storageLayer.getAbsolutePath(video.filePath);

  let stat;
  try {
    stat = await fsPromises.stat(absolutePath);
  } catch (err) {
    logger.error(`Stream stat failed for path: ${absolutePath}`);
    const error = new Error('Video file is missing or inaccessible');
    error.status = 404;
    throw error;
  }

  const fileSize = stat.size;

  // Example Range header: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB chunks (configurable)
  const start = Number(rangeHeader.replace(/\D/g, ''));
  // Determine end slice—either chunk size from start, or the end of the file
  const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
  const contentLength = end - start + 1;

  // 206 Partial Content headers
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': video.mimeType,
  });

  // Get stream from abstracted storage and pipe directly
  const readStream = await storageLayer.getReadStream(video.filePath, { start, end });
  
  readStream.on('error', (err) => {
    logger.error('Stream read error:', err);
    res.end();
  });

  readStream.pipe(res);
};

module.exports = { handleStream };
