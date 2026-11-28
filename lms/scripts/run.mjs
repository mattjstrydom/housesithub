// Runs "npx wrangler ..." and passes every argument through exactly as given, including paths with spaces.
// On Windows, npx is a .cmd file that Node cannot start safely without a shell, and a shell breaks arguments
// that contain spaces. So on Windows we start npm's own npx script with node instead.
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export function npx(args, { dryRun = false } = {}) {
  let cmd = "npx";
  let full = args;
  if (process.platform === "win32") {
    const cli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
    if (!fs.existsSync(cli)) {
      console.error("Could not find npm's npx script at " + cli);
      return 1;
    }
    cmd = process.execPath;
    full = [cli, ...args];
  }
  if (dryRun) {
    console.log("DRY RUN:", JSON.stringify([cmd, ...full]));
    return 0;
  }
  return spawnSync(cmd, full, { stdio: "inherit" }).status ?? 1;
}
