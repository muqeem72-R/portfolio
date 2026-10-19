// Prints js/levels.js as JSON so tools/verify_levels.py can read it.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = path.join(__dirname, "..", "js", "levels.js");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox);
process.stdout.write(JSON.stringify(sandbox.window.PQ_ISLANDS));
