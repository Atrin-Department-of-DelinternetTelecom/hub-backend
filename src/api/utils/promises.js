'use strict';

const nopNotifier = {
  start: () => {},
  next: () => {},
  end: () => {},
};

exports.allPromisesAndNotify = async (promises, notifier = nopNotifier) => {
  const totalItems = promises.length;
  let currentItem = 0;
  notifier.start({ totalItems, currentItem });
  for (const promise of promises) {
    promise.then((result) => {
      currentItem++;
      notifier.next({ totalItems, currentItem, result });
      return result;
    });
  }

  const results = await Promise.all(promises);
  notifier.end({ totalItems, currentItem });
  return results;
};
