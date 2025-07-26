const LOCKED = 1;
const UNLOCKED = 0;

export function newLock() {
  console.log("Creating a new lock!");
  const lockSab = new SharedArrayBuffer(4);
  const lockI32a = new Int32Array(lockSab);
  Atomics.store(lockI32a, 0, UNLOCKED); // initialize the lock to be unlocked
  return lockI32a;
}

export async function acquireLockAsync(lock: Int32Array) {
  console.log("Acquiring a lock asynchronously!");
  while (true) {
    const oldValue = Atomics.compareExchange(lock, 0, UNLOCKED, LOCKED);
    if (oldValue === UNLOCKED) {
      break;
    }
    console.log(await Atomics.waitAsync(lock, 0, LOCKED));
  }
  console.log("Lock acquired!");
}

export function acquireLock(lock: Int32Array) {
  console.log("Acquiring a lock synchronously!");
  while (true) {
    const oldValue = Atomics.compareExchange(lock, 0, UNLOCKED, LOCKED);
    if (oldValue === UNLOCKED) {
      break;
    }
    console.log(Atomics.wait(lock, 0, LOCKED));
  }
  console.log("Lock acquired!");
}

export function releaseLock(lock: Int32Array) {
  Atomics.store(lock, 0, UNLOCKED);
  Atomics.notify(lock, 0);
  console.log("Lock released!");
}
