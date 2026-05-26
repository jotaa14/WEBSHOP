const fs = require('fs');
const path = require('path');

function fixCSS(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // In the TS file it was written as hover\\:bg-white\\/5
  // It extracted as hover\\:bg-white\\/5
  // We want hover\:bg-white\/5
  const original = content;
  content = content.replace(/\\\\/g, '\\');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed CSS escapes in: ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.css')) {
      fixCSS(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src', 'app'));
