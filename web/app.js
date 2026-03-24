const logsBody = document.getElementById("logsBody");
const summaryEl = document.getElementById("summary");
const filtersForm = document.getElementById("filters");
const sourceEl = document.getElementById("source");
const levelEl = document.getElementById("level");
const keywordEl = document.getElementById("keyword");

function fillSourceOptions(sources) {
  const current = sourceEl.value;
  sourceEl.innerHTML = '<option value="">ALL</option>';
  for (const name of sources || []) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sourceEl.appendChild(opt);
  }
  if ([...sourceEl.options].some((o) => o.value === current)) {
    sourceEl.value = current;
  }
}

async function fetchLogs() {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "500",
  });

  if (sourceEl.value) params.set("source", sourceEl.value);
  if (levelEl.value) params.set("level", levelEl.value);
  if (keywordEl.value) params.set("keyword", keywordEl.value);

  const response = await fetch(`/api/logs?${params.toString()}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function renderLogs(data) {
  if (Array.isArray(data.sources)) {
    fillSourceOptions(data.sources);
  }

  summaryEl.textContent = `Total ${data.total} logs`;

  if (!data.items.length) {
    logsBody.innerHTML = `<tr><td colspan="4">No logs found.</td></tr>`;
    return;
  }

  const rows = data.items
    .map((item) => {
      const levelClass = levelToCssClass(item.level);
      return `
        <tr>
          <td class="col-source source-cell">${escapeHtml(item.source || "-")}</td>
          <td>${escapeHtml(item.timestamp || "-")}</td>
          <td class="${levelClass}">${escapeHtml(item.level)}</td>
          <td class="message-cell">${escapeHtml(item.message)}</td>
        </tr>
      `;
    })
    .join("");

  logsBody.innerHTML = rows;
}

function levelToCssClass(level) {
  const safe = String(level || "UNKNOWN")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return safe ? `level-${safe}` : "level-UNKNOWN";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function load() {
  summaryEl.textContent = "Loading...";
  try {
    const data = await fetchLogs();
    renderLogs(data);
  } catch (error) {
    summaryEl.textContent = "Failed to load logs";
    logsBody.innerHTML = `<tr><td colspan="4">${escapeHtml(error.message)}</td></tr>`;
  }
}

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  load();
});

load();
