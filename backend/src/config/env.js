const REQUIRED_ENV_VARS = ["PORT", "NODE_ENV", "MONGODB_URI"];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}:\n${missing.map((v) => `  ${v}`).join("\n")}`
    );
  }
};

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI,
};

export default config;
