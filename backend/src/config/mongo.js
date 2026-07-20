import mongoose from "mongoose";
import config from "./env.js";

const connectMongo = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectMongo;
