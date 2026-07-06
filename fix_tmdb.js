const fs = require('fs');
let code = fs.readFileSync('src/lib/tmdb.ts', 'utf8');

const helper = `
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

function fixImagePaths(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((o: any) => fixImagePaths(o));
  }
  if (typeof obj === 'object') {
    const result: any = { ...obj };
    for (const key in result) {
      if (typeof result[key] === 'string' && result[key].startsWith('/')) {
        if (key === 'poster_path' || key === 'still_path' || key === 'profile_path') {
          result[key] = TMDB_IMAGE_BASE + result[key];
        } else if (key === 'backdrop_path') {
          result[key] = TMDB_IMAGE_BASE_ORIGINAL + result[key];
        }
      } else if (typeof result[key] === 'object') {
        result[key] = fixImagePaths(result[key]);
      }
    }
    return result;
  }
  return obj;
}
`;

code = code.replace('export type TMDBMovieDetails = TMDBMovie & {\n  runtime: number\n  status: string\n}', 'export type TMDBMovieDetails = TMDBMovie & {\n  runtime: number\n  status: string\n}\n\n' + helper);

// Wrap responses
code = code.replace(/return data\.results \|\| \[\]/g, 'return fixImagePaths(data.results || [])');
code = code.replace(/return data\.episodes \|\| \[\]/g, 'return fixImagePaths(data.episodes || [])');
code = code.replace(/return data/g, 'return fixImagePaths(data)');
code = code.replace(/return res\.json\(\)/g, 'return fixImagePaths(await res.json())');

fs.writeFileSync('src/lib/tmdb.ts', code);
