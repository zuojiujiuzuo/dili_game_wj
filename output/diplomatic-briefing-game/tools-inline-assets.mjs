import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const input = resolve(dir, "index.html");
const output = resolve(dir, "standalone.html");

let html = readFileSync(input, "utf8");
html = html.replace(/src="assets\/([^"]+)"/g, (_, name) => {
  const file = resolve(dir, "assets", name);
  const ext = name.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : `image/${ext}`;
  const data = readFileSync(file).toString("base64");
  return `src="data:${mime};base64,${data}"`;
});
html = html.replace(/url\('assets\/([^']+)'\)/g, (_, name) => {
  const file = resolve(dir, "assets", name);
  const ext = name.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : `image/${ext}`;
  const data = readFileSync(file).toString("base64");
  return `url('data:${mime};base64,${data}')`;
});
html = html.replace(/"assets\/([^"]+\.(?:mp3|m4a|ogg|wav))"/g, (_, name) => {
  const file = resolve(dir, "assets", name);
  const ext = name.split(".").pop().toLowerCase();
  const mime = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : ext === "ogg" ? "audio/ogg" : "audio/wav";
  const data = readFileSync(file).toString("base64");
  return `"data:${mime};base64,${data}"`;
});

writeFileSync(output, html);
console.log(`Wrote ${output}`);
