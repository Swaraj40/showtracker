const fs = require('fs');
let code = fs.readFileSync('src/lib/tmdb.ts', 'utf8');

// Replace getHeaders
code = code.replace(/const getHeaders = \(\) => \{\n  const apiKey = process\.env\.TMDB_API_KEY\n  return \{\n    Authorization: `Bearer \$\{apiKey\}`,(.*?)  \}\n\}/s, `const getHeaders = () => {
  const apiKey = process.env.TMDB_API_KEY
  const isV4 = apiKey && apiKey.length > 50;
  const headers: any = { accept: 'application/json' }
  if (isV4) headers.Authorization = \`Bearer \${apiKey}\`
  return headers;
}

const getUrl = (endpoint: string) => {
  const apiKey = process.env.TMDB_API_KEY;
  const isV4 = apiKey && apiKey.length > 50;
  if (isV4) return \`\${TMDB_BASE_URL}\${endpoint}\`;
  const separator = endpoint.includes('?') ? '&' : '?';
  return \`\${TMDB_BASE_URL}\${endpoint}\${separator}api_key=\${apiKey}\`;
}`);

// Replace all fetch calls
code = code.replace(/fetch\(\`\$\{TMDB_BASE_URL\}\/([^`]+)\`/g, 'fetch(getUrl(`/$1`)');

fs.writeFileSync('src/lib/tmdb.ts', code);
console.log('Fixed tmdb.ts');
