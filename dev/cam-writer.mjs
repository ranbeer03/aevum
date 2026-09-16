// Dev-only. Writes camera stops from the /?cam=1 overlay straight back into the
// STOPS registry in src/scripts/world.js, so tuning by eye ends up in the
// source rather than in a clipboard. Registered as a Vite plugin in
// astro.config.mjs with apply: 'serve', so it exists only under `astro dev` and
// cannot become part of a build.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const WORLD = new URL('../src/scripts/world.js', import.meta.url);
const N = (v) => Number(v).toFixed(1).replace(/\.0$/, '');
const vec = (a) => `[${a.map(N).join(', ')}]`;

// One stop's whole entry, however many lines it spans. It ends at the next
// thing at the SAME indentation, which is either the next key, a comment
// introducing the next key, or the end of the object. Two boundaries matter:
// an `sm:` continuation is indented further, so anchoring on any indentation
// truncated the entry and dropped its closing braces; and a comment line
// belongs to the NEXT stop, so not stopping at one swallowed it and left the
// entry with no closing brace to insert before.
const entryOf = (name) =>
  new RegExp(`(\\n  ${name}:\\s*\\{)([\\s\\S]*?)(\\n(?=  (?:[A-Za-z_$][\\w$]*\\s*:|//|/\\*)|\\}))`);

function patchSource(src, name, pos, look, forSmall) {
  const m = src.match(entryOf(name));
  if (!m) return null;
  let body = m[2];
  const inner = `pos: ${vec(pos)}, look: ${vec(look)}`;

  if (!forSmall) {
    // Test that the fields EXIST, rather than that the string changed: saving a
    // stop you have not moved is a no-op, not a failure, and comparing strings
    // reported it as "could not locate".
    if (!/pos:\s*\[[^\]]*\]/.test(body) || !/look:\s*\[[^\]]*\]/.test(body)) return null;
    body = body
      .replace(/pos:\s*\[[^\]]*\]/, `pos: ${vec(pos)}`)
      .replace(/look:\s*\[[^\]]*\]/, `look: ${vec(look)}`);
  } else {
    const sm = body.match(/sm:\s*\{[^}]*\}/);
    if (sm) {
      body = body.replace(sm[0], `sm: { ${inner} }`);
    } else {
      // Insert INSIDE the entry, before its closing brace. Appending after it
      // made `sm` a sibling key of the stop rather than part of it.
      const tail = body.match(/([\s\S]*?)(\s*\},?\s*)$/);
      if (!tail) return null;
      body = `${tail[1].replace(/,\s*$/, '')},\n                 sm: { ${inner} }${tail[2]}`;
    }
  }
  return src.replace(m[0], `${m[1]}${body}${m[3]}`);
}

export function camWriter() {
  return {
    name: 'aevum-cam-writer',
    apply: 'serve',
    configureServer(server) {
      const file = fileURLToPath(WORLD);
      server.middlewares.use('/__cam', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('POST only'); }
        let raw = '';
        req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
        req.on('end', async () => {
          res.setHeader('content-type', 'application/json');
          try {
            const { name, pos, look, small } = JSON.parse(raw);
            if (!/^[A-Za-z_$][\w$]*$/.test(name || '')) throw new Error('bad stop name');
            const ok3 = (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite);
            if (!ok3(pos) || !ok3(look)) throw new Error('pos and look must each be three finite numbers');

            const src = await readFile(file, 'utf8');
            const next = patchSource(src, name, pos, look, !!small);
            if (!next) throw new Error(`could not locate ${name}${small ? '.sm' : ''} in world.js`);

            // Parse the result before committing it. This file is the whole 3D
            // world; a regex that damaged it would be a bad way to find out.
            await transform(next, { loader: 'js', format: 'esm' });

            // Writing world.js would otherwise trip HMR, which reloads the
            // module and tears the live scene down: the model reloads and the
            // tuning session is lost at the moment it succeeds. The overlay has
            // already applied the value in memory, so a reload buys nothing.
            // Unwatch across the write so hand edits still reload afterwards.
            server.watcher.unwatch(file);
            try {
              await writeFile(file, next);
            } finally {
              setTimeout(() => server.watcher.add(file), 400);
            }
            res.end(JSON.stringify({ ok: true, name, small: !!small }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
      });
    },
  };
}
