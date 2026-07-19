import config from "./config/env.js";
import app from "./app.js";

app.listen(config.port, () => {
  console.log(`Infrastructure API running on port ${config.port}`);
});
