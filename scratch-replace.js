const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = [...walk('./app'), ...walk('./components')];

const replacements = [
  { search: /text-\[\#141b4d\]/gi, replace: 'text-foreground' },
  { search: /bg-\[\#141b4d\]/gi, replace: 'bg-foreground' },
  { search: /border-\[\#141b4d\]/gi, replace: 'border-foreground' },
  
  { search: /text-\[\#e9e8e8\]/gi, replace: 'text-background' },
  { search: /bg-\[\#e9e8e8\]/gi, replace: 'bg-background' },
  { search: /border-\[\#e9e8e8\]/gi, replace: 'border-background' },
  
  { search: /text-\[\#64708c\]/gi, replace: 'text-muted-foreground' },
  { search: /text-\[\#3f4444\]/gi, replace: 'text-muted-foreground' },
  
  { search: /bg-\[\#f6f8fc\]/gi, replace: 'bg-background' },
  { search: /bg-\[\#f0f4fb\]/gi, replace: 'bg-muted' },
  { search: /bg-\[\#fbfcff\]/gi, replace: 'bg-muted' },
  { search: /bg-\[\#1f285c\]/gi, replace: 'bg-muted' },
  
  { search: /bg-white/g, replace: 'bg-card' }, // Some cards are bg-white
  { search: /border-\[\#dbe2f0\]/gi, replace: 'border-border' },
  { search: /border-\[\#cbd5e8\]/gi, replace: 'border-border' },
  
  // Specific complex shadows
  { search: /shadow-\[0_12px_30px_rgba\(23,29,82,0\.06\)\]/gi, replace: 'shadow-md' },
  { search: /shadow-\[0_8px_24px_rgba\(23,29,82,0\.08\)\]/gi, replace: 'shadow-sm' },
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    changedCount++;
  }
});

console.log(`\nComplete. Updated ${changedCount} files.`);
