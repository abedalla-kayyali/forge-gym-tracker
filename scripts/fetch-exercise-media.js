/* eslint-disable no-console */
const https = require('https');
const { writeFile } = require('fs/promises');

const OUTPUT_FILE = 'data/form-inspector-media.json';
const EXERCISES_TO_MAP = [
  'Barbell Bench Press',
  'Push-Up',
  'Bulgarian Split Squat',
  'Archer Push-Up',
  'Pistol Squat',
  'Bodyweight Row',
  'Elevated Row',
  'Archer Row',
  'Wall Handstand',
  'Freestanding Handstand',
  'Handstand Push-Up',
  'Dragon Flag',
  'Jump Squat'
];

const DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function normalize(name) {
  return String(name || '').trim().toLowerCase();
}

function fetchWorkouts() {
  return new Promise((resolve, reject) => {
    https.get(DATA_URL, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Unexpected status ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function buildMapping() {
  console.log('Downloading Free Exercise DB catalog...');
  const exercises = await fetchWorkouts();
  const mapping = {};
  EXERCISES_TO_MAP.forEach(name => {
    const match = exercises.find(ex => normalize(ex.name) === normalize(name));
    if (!match) {
      console.warn(`No media entry found for "${name}"`);
      mapping[normalize(name)] = { type: 'gif', src: '' };
      return;
    }
    const imageKey = Array.isArray(match.images) && match.images[0];
    mapping[normalize(name)] = {
      type: 'gif',
      src: imageKey ? `${IMAGE_BASE_URL}${imageKey}` : ''
    };
  });

  await writeFile(OUTPUT_FILE, JSON.stringify(mapping, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${Object.keys(mapping).length} entries to ${OUTPUT_FILE}.`);
}

buildMapping().catch(err => {
  console.error('Failed to download media catalog:', err);
  process.exit(1);
});
