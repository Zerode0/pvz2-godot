/** Call pam-viewer's unmodified offline WASM worker. No binary parsing here. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

const {values: args} = parseArgs({options: {
  'worker-dir': {type: 'string'}, input: {type: 'string'},
  'output-dir': {type: 'string'}, 'png-dir': {type: 'string'},
  'require-images': {type: 'boolean', default: false},
}});
for (const key of ['worker-dir', 'input', 'output-dir']) {
  if (!args[key]) throw new Error(`Missing --${key}`);
}
const stringify = (value, space) => JSON.stringify(value, (_key, item) => {
  if (typeof item !== 'bigint') return item;
  const number = Number(item);
  if (!Number.isSafeInteger(number)) throw new Error('Timeline index exceeds JSON safe integer range');
  return number;
}, space);
const workerDir = path.resolve(args['worker-dir']);
const packageInfo = JSON.parse(fs.readFileSync(path.join(workerDir, 'package.json'), 'utf8'));
if (packageInfo.version !== '0.1.1') throw new Error('This adapter is validated for pam-viewer 0.1.1');
const worker = await import(pathToFileURL(path.join(workerDir, 'pam_viewer_worker.js')));
worker.initSync({module: fs.readFileSync(path.join(workerDir, 'pam_viewer_worker_bg.wasm'))});
const input = fs.readFileSync(args.input);
const files = [{path: path.basename(args.input), bytes: new Uint8Array(input)}];
if (args['png-dir']) {
  for (const entry of fs.readdirSync(args['png-dir'], {withFileTypes: true})) {
    if (entry.isFile() && /\.png$/i.test(entry.name)) {
      files.push({path: entry.name, bytes: new Uint8Array(fs.readFileSync(path.join(args['png-dir'], entry.name)))});
    }
  }
}
const response = await worker.perform({type: 'load', document_id: 1, files});
if (response.type !== 'loaded') throw new Error(stringify(response));
const loaded = response.loaded;
if (args['require-images'] && loaded.missing_images.length) {
  throw new Error(`Missing ${loaded.missing_images.length} images: ${loaded.missing_images.join(', ')}`);
}
const stem = path.basename(args.input).replace(/\.pam$/i, '');
const pam = loaded.document.pam;
const metadata = {
  tool: 'LambdaEd1th/pam-viewer', version: 'v0.1.1',
  source: path.basename(args.input), source_sha256: createHash('sha256').update(input).digest('hex'),
  images: pam.image.length, sprites: pam.sprite.length, main_frames: pam.main_sprite?.frame.length ?? 0,
  frame_rate: pam.frame_rate, loaded_images: loaded.loaded_images,
  missing_images: loaded.missing_images, content_bounds: loaded.document.content_bounds,
};
const outputs = [
  [`${stem}.pam.json`, stringify(pam)],
  [`${stem}.compiled.json`, stringify(loaded.document.compiled)],
  [`${stem}.conversion.json`, stringify(metadata, 2)],
];
fs.mkdirSync(args['output-dir'], {recursive: true});
for (const [filename, content] of outputs) {
  fs.writeFileSync(path.join(args['output-dir'], filename), content);
}
console.log(stringify(metadata));
