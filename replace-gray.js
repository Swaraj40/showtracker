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
  { regex: /text-gray-100/g, replacement: 'text-foreground' },
  { regex: /text-gray-200/g, replacement: 'text-foreground' },
  { regex: /text-gray-300/g, replacement: 'text-foreground-muted' },
  { regex: /text-gray-600/g, replacement: 'text-foreground-muted' },
  { regex: /text-gray-700/g, replacement: 'text-foreground-muted' },
  { regex: /bg-gray-700/g, replacement: 'bg-surface-elevated' }
];

walk(path.join(__dirname, 'src'), (err, files) => {
  if (err) throw err;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
});
