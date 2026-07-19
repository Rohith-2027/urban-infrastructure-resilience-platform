/**
 * Application configuration read from environment variables with defaults.
 * @property {number} port  Server listen port.
 * @property {string} nodeEnv  Runtime environment name.
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
};

export default config;
