/** Batch inventory using the existing pam-viewer WASM decoder/compiler. */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {parseArgs} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";
import {Worker, isMainThread, parentPort, workerData} from "node:worker_threads";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerDirectory = path.join(root, "reference/pam-tooling/web/assets/assets/worker/pkg");

if (!isMainThread) {
  try {
    const input = fs.readFileSync(path.resolve(root, workerData));
    const worker = await import(pathToFileURL(path.join(workerDirectory, "pam_viewer_worker.js")));
    worker.initSync({module: fs.readFileSync(path.join(workerDirectory, "pam_viewer_worker_bg.wasm"))});
    const response = await worker.perform({type: "load", document_id: 1,
      files: [{path: path.basename(workerData), bytes: new Uint8Array(input)}]});
    if (response.type !== "loaded") throw new Error(JSON.stringify(response));
    const pam = response.loaded.document.pam;
    const labels = [];
    const commands = new Set();
    for (const [index, frame] of (pam.main_sprite?.frame ?? []).entries()) {
      if (frame.label) labels.push({label: frame.label, frame: index});
      for (const command of frame.command ?? []) commands.add(String(command[0]));
    }
    parentPort.postMessage({local_path: workerData, status: "decoded",
      sha256: createHash("sha256").update(input).digest("hex"), bytes: input.length,
      version: pam.version, frame_rate: pam.frame_rate,
      images: pam.image, sprites: pam.sprite.length,
      main_frames: pam.main_sprite?.frame.length ?? 0,
      labels, commands: [...commands]});
  } catch (error) {
    parentPort.postMessage({local_path: workerData, status: "error", error: String(error)});
  }
} else {
  const {values: args} = parseArgs({options: {
    "input-list": {type: "string"}, output: {type: "string"},
    jobs: {type: "string", default: "2"},
  }});
  if (!args["input-list"] || !args.output) {
    throw new Error("Usage: node Tools/inspect_pam_library.mjs --input-list paths.json --output report.json [--jobs 2]");
  }
  const paths = JSON.parse(fs.readFileSync(args["input-list"], "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(paths) || paths.some(item => typeof item !== "string")) {
    throw new Error("Input must be a JSON array of PAM paths relative to the repository root");
  }
  const jobs = Number(args.jobs);
  if (!Number.isInteger(jobs) || jobs < 1 || jobs > 8) throw new Error("jobs must be 1..8");
  const results = new Array(paths.length);
  let cursor = 0;
  async function inspect() {
    while (cursor < paths.length) {
      const index = cursor++;
      results[index] = await new Promise(resolve => {
        const thread = new Worker(new URL(import.meta.url), {workerData: paths[index]});
        let replied = false;
        thread.once("message", result => { replied = true; resolve(result); });
        thread.once("error", error => { replied = true; resolve({local_path: paths[index], status: "error", error: String(error)}); });
        thread.once("exit", code => {
          if (!replied) resolve({local_path: paths[index], status: "error", error: `Worker exited with code ${code}`});
        });
      });
      console.log(`${index + 1}/${paths.length} ${results[index].status} ${paths[index]}`);
    }
  }
  await Promise.all(Array.from({length: Math.min(jobs, paths.length)}, inspect));
  const report = {tool: "LambdaEd1th/pam-viewer", version: "v0.1.1",
    total: results.length, decoded: results.filter(item => item.status === "decoded").length,
    entries: results};
  fs.mkdirSync(path.dirname(path.resolve(args.output)), {recursive: true});
  fs.writeFileSync(args.output, JSON.stringify(report, (_key, value) => typeof value === "bigint" ? Number(value) : value, 2) + "\n");
  if (report.decoded !== report.total) process.exitCode = 1;
}
