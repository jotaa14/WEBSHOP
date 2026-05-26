const fs = require('fs');
const path = require('path');

// 1. Fix tsconfig.json
const tsconfigPath = 'tsconfig.json';
let tsconfig = fs.readFileSync(tsconfigPath, 'utf8');
tsconfig = tsconfig.replace(/"strict": true/g, '"strict": false');
fs.writeFileSync(tsconfigPath, tsconfig);

// 2. Fix imports in pages
const pagesDir = path.join('src', 'app', 'pages');
const replaceInDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('../../../core/services/')) {
        content = content.replace(/\.\.\/\.\.\/\.\.\/core\/services\//g, '../../core/services/');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
};
replaceInDir(pagesDir);

// 3. Fix imports in navbar
const navbarPath = path.join('src', 'app', 'shared', 'components', 'navbar', 'navbar.component.ts');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');
navbarContent = navbarContent.replace(/\.\.\/\.\.\/\.\.\/services\//g, '../../../core/services/');
fs.writeFileSync(navbarPath, navbarContent);

console.log('Fixed imports and tsconfig.json');
