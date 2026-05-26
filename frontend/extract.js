const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex to match template: `...`
  // We use a regex that matches until the closing backtick, making sure we handle inner backticks if any (rare in Angular templates).
  const templateMatch = content.match(/template:\s*`([\s\S]*?)`\s*(,|})/);
  if (templateMatch) {
    let templateContent = templateMatch[1];
    
    // Some components might have `App` scaffold that has \` etc but we just extract
    const htmlPath = filePath.replace('.ts', '.html');
    fs.writeFileSync(htmlPath, templateContent.trim() + '\n');
    
    const relativeHtmlPath = path.basename(htmlPath);
    content = content.replace(templateMatch[0], `templateUrl: './${relativeHtmlPath}'${templateMatch[2]}`);
    changed = true;
  }

  // Regex to match styles: [`...`]
  const stylesMatch = content.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]\s*(,|})/);
  if (stylesMatch) {
    let stylesContent = stylesMatch[1];
    
    const cssPath = filePath.replace('.ts', '.css');
    fs.writeFileSync(cssPath, stylesContent.trim() + '\n');
    
    const relativeCssPath = path.basename(cssPath);
    content = content.replace(stylesMatch[0], `styleUrl: './${relativeCssPath}'${stylesMatch[2]}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Processed: ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.component.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src', 'app'));
