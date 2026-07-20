import mongoose from "mongoose";

const infrastructureCacheSchema = new mongoose.Schema(
  {
    layer: {
      type: String,
      required: true,
    },
    studyArea: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lastFetched: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

infrastructureCacheSchema.index({ layer: 1, studyArea: 1 }, { unique: true });

const InfrastructureCache = mongoose.model("InfrastructureCache", infrastructureCacheSchema);

export default InfrastructureCache;
