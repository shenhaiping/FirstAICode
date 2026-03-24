const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function levelFromHttpStatus(code) {
  const n = Number(code);
  if (Number.isNaN(n)) return "INFO";
  if (n >= 500) return "ERROR";
  if (n >= 400) return "WARN";
  return "INFO";
}

function parseNginxTimeMs(s) {
  const m = String(s).match(
    /^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+(\S+)$/
  );
  if (!m) return 0;
  const [, day, mon, year, hh, mm, ss] = m;
  const month = MONTHS[mon];
  if (month == null) return 0;
  return Date.UTC(
    Number(year),
    month,
    Number(day),
    Number(hh),
    Number(mm),
    Number(ss)
  );
}

function normalizeMysqlLevel(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "warning") return "WARN";
  if (t === "error") return "ERROR";
  if (t === "note" || t === "system") return "INFO";
  return String(tag || "UNKNOWN").toUpperCase();
}

function parseDockerInner(inner, containerTime, rawLine, source) {
  const trimmed = String(inner || "").replace(/\r?\n$/, "").trim();
  if (!trimmed) return null;

  const java = trimmed.match(
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(\w+)\s+\[([^\]]+)\]\s+(.+)$/
  );
  if (java) {
    const sortMs = Date.parse(java[1]) || 0;
    return {
      timestamp: java[1],
      level: java[2].toUpperCase(),
      message: `${java[3]} ${java[4]}`.trim(),
      raw: rawLine,
      source,
      sortMs,
    };
  }

  const mini = trimmed.match(/^(\S+)\s+(\S+)\s+(\d{3})\s+(\d+ms)$/);
  if (mini) {
    const sortMs = containerTime ? Date.parse(containerTime) || 0 : 0;
    return {
      timestamp: containerTime
        ? containerTime.replace(/(\.\d{3})\d*Z$/, "$1Z")
        : "",
      level: levelFromHttpStatus(mini[3]),
      message: trimmed,
      raw: rawLine,
      source,
      sortMs,
    };
  }

  const sortMs = containerTime ? Date.parse(containerTime) || 0 : 0;
  return {
    timestamp: containerTime
      ? containerTime.replace(/(\.\d{3})\d*Z$/, "$1Z")
      : "",
    level: "INFO",
    message: trimmed,
    raw: rawLine,
    source,
    sortMs,
  };
}

function tryParseDockerJson(line, source) {
  if (!line.startsWith("{")) return null;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof obj.log !== "string") return null;
  const inner = obj.log;
  const containerTime = typeof obj.time === "string" ? obj.time : "";
  return parseDockerInner(inner, containerTime, line, source);
}

function tryParseNginx(line, source) {
  const m = line.match(
    /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"[^"]*"\s+(\d{3})\s+/
  );
  if (!m) return null;
  const [, , timeBracket, status] = m;
  const sortMs = parseNginxTimeMs(timeBracket);
  return {
    timestamp: timeBracket,
    level: levelFromHttpStatus(status),
    message: line,
    raw: line,
    source,
    sortMs,
  };
}

const NGINX_ERROR_LEVEL = {
  error: "ERROR",
  warn: "WARN",
  notice: "INFO",
  info: "INFO",
};

function tryParseNginxError(line, source) {
  const m = line.match(
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+\[(\w+)\]\s+(.+)$/
  );
  if (!m) return null;
  const [, y, mo, d, H, mm, s, levelTag, msg] = m;
  const sortMs = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(H),
    Number(mm),
    Number(s)
  );
  const key = levelTag.toLowerCase();
  const level = NGINX_ERROR_LEVEL[key] || levelTag.toUpperCase();
  const timestamp = `${y}/${mo}/${d} ${H}:${mm}:${s}`;
  return {
    timestamp,
    level,
    message: msg,
    raw: line,
    source,
    sortMs,
  };
}

function tryParseMysql(line, source) {
  const m = line.match(
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\d+\s+\[(\w+)\]\s+(.+)$/
  );
  if (!m) return null;
  const [, iso, tag, rest] = m;
  const sortMs = Date.parse(iso) || 0;
  return {
    timestamp: iso,
    level: normalizeMysqlLevel(tag),
    message: rest,
    raw: line,
    source,
    sortMs,
  };
}

function tryParseBracket(line, source) {
  const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
  if (!match) return null;
  const ts = match[1];
  const sortMs =
    Date.parse(ts.replace(" ", "T")) ||
    Date.parse(ts) ||
    0;
  return {
    timestamp: match[1],
    level: match[2],
    message: match[3],
    raw: line,
    source,
    sortMs,
  };
}

function parseLogLine(rawLine, { source } = {}) {
  const line = String(rawLine || "").trim();
  if (!line) return null;

  const src = source || "";

  return (
    tryParseDockerJson(line, src) ||
    tryParseMysql(line, src) ||
    tryParseNginx(line, src) ||
    tryParseNginxError(line, src) ||
    tryParseBracket(line, src) || {
      timestamp: "",
      level: "UNKNOWN",
      message: line,
      raw: line,
      source: src,
      sortMs: 0,
    }
  );
}

module.exports = {
  parseLogLine,
};
