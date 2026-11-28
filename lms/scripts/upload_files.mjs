// Uploads the workbook and checklists to the private R2 bucket.
//   node scripts/upload_files.mjs "path/to/Course Rebuild/Toolkit" [--local]
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { FILES } from "../src/files.js";

const [dir, flag] = process.argv.slice(2);
if (!dir) {
  console.error('Usage: node scripts/upload_files.mjs "path/to/Toolkit" [--local]');
  process.exit(1);
}
let failed = 0;
for (const f of FILES) {
  // bucket key "checklists/01 X.pdf" lives on disk in "PDF checklists/"; the workbook sits in the Toolkit root
  const onDisk = f.key.startsWith("checklists/") ? path.join(dir, "PDF checklists", f.key.slice("checklists/".length)) : path.join(dir, f.key);
  if (!fs.existsSync(onDisk)) {
    console.error("MISSING", onDisk);
    failed++;
    continue;
  }
  const r = spawnSync("npx", ["wrangler", "r2", "object", "put", `housesithub-course-files/${f.key}`, "--file", onDisk, "--content-type", "application/pdf", flag === "--local" ? "--local" : "--remote"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) failed++;
}
console.log(failed ? `${failed} file(s) failed` : "All files uploaded");
process.exit(failed ? 1 : 0);
