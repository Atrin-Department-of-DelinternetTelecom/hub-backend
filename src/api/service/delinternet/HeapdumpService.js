'use strict';

const heapdump = require('heapdump');
const path = require('path');
const { respondSuccess } = require('@api/utils/response');

let isDumping = false;

exports.createHeapdump = async () => {
  if (isDumping) {
    return respondSuccess({
      message: 'Heapdump already in progress. Please wait.',
      isDumping: true,
    });
  }

  isDumping = true;

  const filename = path.resolve(
    process.cwd(),
    `heapdump-${new Date().toISOString().replace(/[:.]/g, '-')}.heapsnapshot`,
  );

  console.log(`[HeapdumpService] Heapdump started. Writing to: ${filename}`);

  // Kick off heapdump in background
  setImmediate(() => {
    heapdump.writeSnapshot(filename, (err, filePath) => {
      isDumping = false;

      if (err) {
        console.error('[HeapdumpService] ❌ Failed to write heapdump:', err);
        return;
      }

      console.log(`[HeapdumpService] ✅ Heapdump completed at: ${filePath}`);
    });
  });

  // Respond immediately
  return respondSuccess({
    message: 'Heapdump process started. You will see logs when complete.',
    isDumping: false,
    filePath: filename, // path returned early, file not created yet
  });
};
