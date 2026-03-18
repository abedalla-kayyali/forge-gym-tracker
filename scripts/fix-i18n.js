'use strict';
// Fix embedded unescaped quotes in i18n.js string values.
// The file has mojibake Arabic text where byte sequences produce
// embedded apostrophes (in single-quoted strings) and embedded
// double-quotes (in double-quoted strings).
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(filePath, 'utf8');
let fixedSingle = 0;
let fixedDouble = 0;

function fixStringValue(line, quoteChar) {
  // Given a line and a quote char (' or "), scan for string values
  // that start with quoteChar (after a : , [ or () and escape any
  // embedded unescaped instances of that same quoteChar inside the value.
  let out = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === quoteChar) {
      const beforeTrimmed = line.substring(0, i).replace(/\s+$/, '');
      const isValue = beforeTrimmed.endsWith(':') ||
                      beforeTrimmed.endsWith(',') ||
                      beforeTrimmed.endsWith('[') ||
                      beforeTrimmed.endsWith('(') ||
                      beforeTrimmed.endsWith('+');
      if (isValue) {
        let j = i + 1;
        let inner = '';
        while (j < line.length) {
          const c = line[j];
          if (c === '\\') {
            inner += c; j++;
            if (j < line.length) { inner += line[j]; j++; }
            continue;
          }
          if (c === quoteChar) {
            const after = line.substring(j + 1).replace(/^\s+/, '');
            const isClosing = (after === '' ||
                               after.startsWith(',') ||
                               after.startsWith(')') ||
                               after.startsWith(']') ||
                               after.startsWith(';') ||
                               after.startsWith(':') ||
                               after.startsWith('//') ||
                               after.startsWith('+') ||
                               after.startsWith('?') ||
                               after.startsWith('}'));
            if (isClosing) { break; }
            // Embedded quote — escape it
            inner += '\\' + quoteChar;
            if (quoteChar === "'") fixedSingle++; else fixedDouble++;
            j++; continue;
          }
          inner += c; j++;
        }
        out += quoteChar + inner + quoteChar;
        i = j + 1;
        continue;
      }
    }
    out += ch; i++;
  }
  return out;
}

const lines = src.split('\n').map(function(line) {
  line = fixStringValue(line, "'");
  line = fixStringValue(line, '"');
  return line;
});

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed ' + fixedSingle + ' apostrophes, ' + fixedDouble + ' double-quotes.');
