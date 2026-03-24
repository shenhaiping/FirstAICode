const fs = require("fs/promises");
const path = require("path");
const { parseLogLine } = require("../utils/parser");

async function listLogFiles(logDir) {
  const entries = await fs.readdir(logDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".log"))
    .map((entry) => path.join(logDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

async function listLogSources(logDir) {
  const files = await listLogFiles(logDir);
  return files.map((f) => path.basename(f));
}

async function readAllLogs(logDir) {
  const files = await listLogFiles(logDir);
  const parsed = [];

  for (const filePath of files) {
    const source = path.basename(filePath);
    const text = await fs.readFile(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const item = parseLogLine(line, { source });
      if (item) {
        parsed.push(item);
      }
    }
  }

  parsed.sort((a, b) => (b.sortMs || 0) - (a.sortMs || 0));
  return parsed;
}

function filterLogs(items, { level, keyword, source }) {
  let result = items;

  if (source) {
    result = result.filter((item) => item.source === source);
  }

  if (level) {
    result = result.filter(
      (item) => item.level.toUpperCase() === level.toUpperCase()
    );
  }

  if (keyword) {
    const normalized = keyword.toLowerCase();
    result = result.filter((item) =>
      item.raw.toLowerCase().includes(normalized)
    );
  }

  return result;
}

function paginateLogs(items, { page, pageSize }) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    total,
    items: items.slice(start, end),
  };
}

function stripInternalFields(items) {
  return items.map(({ sortMs, ...rest }) => rest);
}

module.exports = {
  readAllLogs,
  filterLogs,
  paginateLogs,
  listLogSources,
  stripInternalFields,
};
