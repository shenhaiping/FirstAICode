const express = require("express");
const { logDir, defaultPageSize, maxPageSize } = require("../config");
const {
  readAllLogs,
  filterLogs,
  paginateLogs,
  listLogSources,
  stripInternalFields,
} = require("../services/logService");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(req.query.pageSize) || defaultPageSize, 1),
      maxPageSize
    );
    const level = req.query.level ? String(req.query.level) : "";
    const keyword = req.query.keyword ? String(req.query.keyword) : "";
    const source = req.query.source ? String(req.query.source) : "";

    const [allLogs, sources] = await Promise.all([
      readAllLogs(logDir),
      listLogSources(logDir),
    ]);
    const filtered = filterLogs(allLogs, { level, keyword, source });
    const { total, items } = paginateLogs(filtered, { page, pageSize });

    res.json({
      page,
      pageSize,
      total,
      sources,
      items: stripInternalFields(items),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to read logs",
      error: error.message,
    });
  }
});

module.exports = router;
