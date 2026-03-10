const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const htmlPath = path.join(ROOT, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('[check_v3] index.html not found at', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
let okInline = 0;
let okExternal = 0;
let fail = 0;

scripts.forEach((scriptTag, i) => {
  const srcMatch = scriptTag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) {
    const src = srcMatch[1].trim();
    if (src.includes('${')) return;
    // Skip remote/CDN scripts; we only syntax-check local files in the repo.
    if (/^https?:\/\//i.test(src)) return;

    const abs = path.join(ROOT, src.replace(/\//g, path.sep));
    if (!fs.existsSync(abs)) {
      console.log('SCRIPT ' + i + ' ERROR: Missing local script file: ' + src);
      fail++;
      return;
    }

    try {
      const externalBody = fs.readFileSync(abs, 'utf8');
      new Function(externalBody);
      okExternal++;
    } catch (e) {
      console.log('SCRIPT ' + i + ' (' + src + ') ERROR:', String(e.message).substring(0, 180));
      fail++;
    }
    return;
  }

  const body = scriptTag.replace(/<\/?script\b[^>]*>/gi, '');
  if (!body.trim()) return;
  try {
    new Function(body);
    okInline++;
  } catch (e) {
    console.log('SCRIPT ' + i + ' (inline) ERROR:', String(e.message).substring(0, 180));
    fail++;
  }
});

console.log('Inline OK:', okInline, ' External OK:', okExternal, ' Failed:', fail);
process.exit(fail > 0 ? 1 : 0);
