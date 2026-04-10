/**
 * @module models/counter
 * @description Atomic auto-increment counter used to generate human-readable
 * sequential IDs for items, claims, and reports (e.g. `ITEM000001`).
 *
 * The counter document `_id` is the counter's name (e.g. `"item"`).
 * {@link getNextSequence} wraps a MongoDB `findAndModify` with `$inc` and
 * `upsert: true` so the counter is created on first use and increments are
 * race-condition-free.
 */
import mongoose from "mongoose";

/**
 * @typedef {object} CounterDocument
 * @property {string} _id      - Counter name / namespace (e.g. `"item"`, `"claim"`).
 * @property {number} sequence - Current counter value; starts at 0 and is
 *                               pre-incremented before being returned.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Returns the next sequential integer for the named counter, creating the
 * counter document on first call.
 *
 * Uses MongoDB's `findByIdAndUpdate` with `{ $inc: { sequence: 1 } }` and
 * `upsert: true` to guarantee atomicity — safe under concurrent requests.
 *
 * @async
 * @param {string} counterName - Logical name of the counter (e.g. `"item"`, `"claim"`).
 * @returns {Promise<number>} The newly incremented sequence value (1-based).
 * @example
 * const seq = await getNextSequence('item'); // 1, 2, 3 ...
 * const itemId = `ITEM${String(seq).padStart(6, '0')}`; // "ITEM000001"
 */
export const getNextSequence = async (counterName) => {
  const counter = await Counter.findByIdAndUpdate(
    counterName,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );
  return counter.sequence;
};

export default Counter;
