const mongoose = require("mongoose");

const QueryLogSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    answer: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    citationPmids: {
      type: [String],
      default: [],
    },
    citationIds: {
      type: [String],
      default: [],
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueryLog", QueryLogSchema);
