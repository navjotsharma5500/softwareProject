import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Get the next sequence number for a given counter atomically
 * This prevents race conditions when multiple requests try to create IDs simultaneously
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
