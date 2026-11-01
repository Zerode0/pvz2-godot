/** Offline adapter for the unmodified pam-viewer v0.1.1 WASM worker.
 * PAM decoding and timeline compilation are performed by the upstream tool.
 * Usage: node Tools/convert_pam.mjs <input.pam> <output-directory> [png-directory]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerDir = path.join(root, 'reference/pam-tooling/web/assets/assets/worker/pkg');
const [input, output, pngDirectory] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node Tools/convert_pam.mjs input.pam output-directory [png-directory]');
const worker = await import(pathToFileURL(path.join(workerDir, 'pam_viewer_worker.js')));
worker.initSync({module: fs.readFileSync(path.join(workerDir, 'pam_viewer_worker_bg.wasm'))});
const files = [{path: path.basename(input), bytes: new Uint8Array(fs.readFileSync(input))}];
if (pngDirectory) {
  for (const filename of fs.readdirSync(pngDirectory).filter(name => /\.png$/i.test(name))) {
    files.push({path: filename, bytes: new Uint8Array(fs.readFileSync(path.join(pngDirectory, filename)))});
  }
}
const response = await worker.perform({type: 'load', document_id: 1, files});
if (response.type !== 'loaded') throw new Error(JSON.stringify(response));
const loaded = response.loaded;
const stringify = (value, space) => JSON.stringify(value, (_key, item) => {
  if (typeof item !== 'bigint') return item;
  const number = Number(item);
  if (!Number.isSafeInteger(number)) throw new Error('Timeline index exceeds the JSON safe integer range');
  return number;
}, space);
const stem = path.basename(input).replace(/\.pam$/i, '').toLowerCase();
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, `${stem}.pam.json`), stringify(loaded.document.pam));
fs.writeFileSync(path.join(output, `${stem}.compiled.json`), stringify(loaded.document.compiled));
fs.writeFileSync(path.join(output, 'conversion.json'), stringify({
  tool: 'LambdaEd1th/pam-viewer', version: 'v0.1.1',
  source: path.basename(input), loaded_images: loaded.loaded_images,
  missing_images: loaded.missing_images, content_bounds: loaded.document.content_bounds,
}, null, 2));
console.log(stringify({version: loaded.document.pam.version,
  images: loaded.document.pam.image.length, sprites: loaded.document.pam.sprite.length,
  main_frames: loaded.document.pam.main_sprite?.frame.length,
  loaded_images: loaded.loaded_images, missing_images: loaded.missing_images}));
