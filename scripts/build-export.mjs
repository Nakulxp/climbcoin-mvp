import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const apiDir = path.join(rootDir, "src", "app", "api");
const tempApiDir = path.join(rootDir, ".api-backup");

let moved = false;

try {
  if (fs.existsSync(apiDir)) {
    console.log("Temporarily stashing src/app/api for static export...");
    fs.renameSync(apiDir, tempApiDir);
    moved = true;
  }

  console.log("Running next build with STATIC_EXPORT=true...");
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "true",
    },
  });

  console.log("Static export completed successfully into ./out");
} finally {
  if (moved && fs.existsSync(tempApiDir)) {
    console.log("Restoring src/app/api...");
    fs.renameSync(tempApiDir, apiDir);
  }
}
