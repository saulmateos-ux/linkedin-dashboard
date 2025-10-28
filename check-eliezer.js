import { getProfile } from './lib/db.js';

const profile = await getProfile(7);
console.log('Eliezer profile:', JSON.stringify(profile, null, 2));
process.exit(0);
