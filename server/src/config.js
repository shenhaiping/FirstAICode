const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

module.exports = {
  port: Number(process.env.PORT || 3000),
  webDir: path.resolve(ROOT_DIR, "..", "web"),
  logDir: process.env.LOG_DIR
    ? path.resolve(process.env.LOG_DIR)
    : path.resolve(ROOT_DIR, "logs"),
  defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE || 50),
  maxPageSize: Number(process.env.MAX_PAGE_SIZE || 500),
};
