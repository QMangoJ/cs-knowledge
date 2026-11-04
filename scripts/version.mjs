// Writes out/version.json with the deployed commit (run after build, before wrangler deploy).
import fs from "node:fs"; import { execSync } from "node:child_process";
const sha = execSync("git rev-parse HEAD").toString().trim();
const dirty = execSync("git status --porcelain").toString().trim() !== "";
fs.writeFileSync("out/version.json", JSON.stringify({ commit: sha, dirty, builtAt: new Date().toISOString() }) + "\n");
console.log("version.json", sha, dirty ? "(dirty)" : "");
