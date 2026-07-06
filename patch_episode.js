const fs = require('fs');
let code = fs.readFileSync('src/app/(main)/show/[id]/EpisodeItem.tsx', 'utf8');

// Replace import
code = code.replace(/import \{ getSeasonDetails, TMDBEpisode \} from '@\/lib\/tmdb'/, "import { TMDBEpisode } from '@/lib/tmdb'\nimport { getSeasonDetailsAction } from './actions'");

// Replace function call
code = code.replace(/getSeasonDetails\(showId, seasonNumber\)/g, 'getSeasonDetailsAction(showId, seasonNumber)');

fs.writeFileSync('src/app/(main)/show/[id]/EpisodeItem.tsx', code);
