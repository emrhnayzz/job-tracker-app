const app = require("./app");
const env = require("./config/env");
const { initDB } = require("./config/db");

initDB()
  .then(() => {
    app.listen(env.port, () => console.log(`Job Tracker API listening on port ${env.port}`));
  })
  .catch((err) => {
    console.error("Database initialisation failed:", err);
    process.exit(1);
  });
