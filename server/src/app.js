const express = require("express");
const path = require("path");
const config = require("./config");
const logsRoute = require("./routes/logs");

const app = express();
const openapiPath = path.join(__dirname, "openapi.json");

const apiDocsHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Log Viewer API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" crossorigin />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
        });
      };
    </script>
  </body>
</html>`;

app.use(express.json());
app.use("/api/logs", logsRoute);

app.get("/openapi.json", (_req, res) => {
  res.sendFile(openapiPath);
});

app.get("/api-docs", (_req, res) => {
  res.type("html").send(apiDocsHtml);
});

app.use(express.static(config.webDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(config.webDir, "index.html"));
});

app.listen(config.port, () => {
  console.log(`Server is running at http://localhost:${config.port}`);
  console.log(`Log directory: ${config.logDir}`);
});
