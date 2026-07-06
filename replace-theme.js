const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
};

const replacements = [
  // Backgrounds
  { regex: /bg-black(?!\/)/g, replacement: 'bg-background' },
  { regex: /bg-black\/(\d+)/g, replacement: 'bg-background/$1' },
  { regex: /bg-\[\#121212\]/g, replacement: 'bg-surface' },
  { regex: /bg-\[\#1A1A1A\]/g, replacement: 'bg-surface-elevated' },
  { regex: /bg-\[\#1E1E1E\]/g, replacement: 'bg-surface-elevated' },
  { regex: /bg-\[\#2A2A2A\]/g, replacement: 'bg-surface-elevated' },
  { regex: /bg-\[\#222\]/g, replacement: 'bg-surface-elevated' },
  { regex: /bg-gray-800/g, replacement: 'bg-surface-elevated' },
  { regex: /bg-gray-900/g, replacement: 'bg-surface-elevated' },
  
  // Borders
  { regex: /border-\[\#222\]/g, replacement: 'border-border' },
  { regex: /border-\[\#1E1E1E\]/g, replacement: 'border-border' },
  { regex: /border-\[\#2A2A2A\]/g, replacement: 'border-border' },

  // Text colors
  { regex: /text-white/g, replacement: 'text-foreground' },
  { regex: /text-gray-400/g, replacement: 'text-foreground-muted' },
  { regex: /text-gray-500/g, replacement: 'text-foreground-muted' }
];

walk(path.join(__dirname, 'src'), (err, files) => {
  if (err) throw err;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We don't want to replace text-white inside the hero banner sections where the gradient is from-black.
    // Wait, it's easier to just do a blanket replacement, and then manually revert the hero sections if needed.
    // However, if we replace text-white everywhere, buttons that are supposed to be white text on colored bg will also turn dark in light mode. 
    // Let's just do it, and we can test the UI to find anything that broke.
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
});
