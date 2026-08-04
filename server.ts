import express from "express";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

const sitePath = path.join(process.cwd(), "_site");

if (!fs.existsSync(sitePath)) {
  fs.mkdirSync(sitePath, { recursive: true });
}

if (process.env.NODE_ENV !== "production") {
  console.log("Starting Eleventy in watch mode...");
  const eleventy = spawn("npx", ["eleventy", "--watch", "--config=.eleventy.cjs"], {
    stdio: "inherit",
    shell: true,
  });

  eleventy.on("error", (err) => {
    console.error("Eleventy watcher error:", err);
  });
}

app.use(express.static(sitePath));

app.use((req, res) => {
  const notFoundHtml = path.join(sitePath, "404.html");
  const notFoundPath = path.join(sitePath, "404", "index.html");
  if (fs.existsSync(notFoundHtml)) {
    res.status(404).sendFile(notFoundHtml);
  } else if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).send("404 - Page Not Found");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
