const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const localUri = process.argv.includes('--local')
  ? process.argv[process.argv.indexOf('--local') + 1]
  : 'mongodb://localhost:27017/dreamdecol';

const atlasUri = process.argv.includes('--atlas')
  ? process.argv[process.argv.indexOf('--atlas') + 1]
  : process.env.MONGODB_URI;

const dropFirst = process.argv.includes('--drop');
const yesFlag = process.argv.includes('--yes');
const regenIds = process.argv.includes('--regen-ids');
const skipArgIndex = process.argv.indexOf('--skip');
const skipList = skipArgIndex !== -1 && process.argv[skipArgIndex + 1]
  ? process.argv[skipArgIndex + 1].split(',').map(s => s.trim()).filter(Boolean)
  : [];

async function migrate() {
  if (!atlasUri) {
    console.error('Atlas URI not provided. Set MONGODB_URI in .env or pass --atlas <uri>');
    process.exit(1);
  }

  console.log('Local URI:', localUri);
  console.log('Atlas URI:', atlasUri.split('?')[0]);
  console.log('Drop collections on target first:', dropFirst);

  const localConn = await mongoose.createConnection(localUri, { useNewUrlParser: true, useUnifiedTopology: true }).asPromise().catch(err => {
    console.error('Failed to connect to local MongoDB:', err.message);
    process.exit(1);
  });

  const atlasConn = await mongoose.createConnection(atlasUri, { useNewUrlParser: true, useUnifiedTopology: true }).asPromise().catch(err => {
    console.error('Failed to connect to Atlas MongoDB:', err.message);
    process.exit(1);
  });

  try {
    const cols = await localConn.db.listCollections().toArray();
    const collections = cols.map(c => c.name).filter(n => !n.startsWith('system.'));

    const outDir = path.join(process.cwd(), '..', 'dump_json');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const name of collections) {
      if (skipList.includes(name)) {
        console.log(`Skipping collection ${name} (in skip list)`);
        continue;
      }
      console.log(`\n--- Migrating collection: ${name}`);
      const docs = await localConn.db.collection(name).find().toArray();
      console.log(`Found ${docs.length} documents in local.${name}`);

      const filePath = path.join(outDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      console.log(`Wrote ${filePath}`);

      if (dropFirst) {
        if (!yesFlag) {
          // Ask for confirmation before destructive action
          const readline = require('readline');
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise(resolve => rl.question(`Drop existing collection atlas.${name}? (yes/no): `, ans => { rl.close(); resolve(ans); }));
          if (String(answer).toLowerCase() !== 'yes') {
            console.log(`Skipping drop for atlas.${name} and skipping migration for this collection.`);
            continue;
          }
        }
        try {
          await atlasConn.db.dropCollection(name);
          console.log(`Dropped existing atlas.${name}`);
        } catch (err) {
          if (err.codeName === 'NamespaceNotFound') {
            console.log('No existing collection to drop.');
          } else {
            console.warn('Drop collection warning:', err.message);
          }
        }
      }

      if (docs.length > 0) {
        // Insert in batches to avoid exceeding document size limits
        const batchSize = 500;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = docs.slice(i, i + batchSize).map(d => {
            if (regenIds) {
              const copy = Object.assign({}, d);
              delete copy._id;
              return copy;
            }
            return d;
          });
          try {
            await atlasConn.db.collection(name).insertMany(batch, { ordered: false });
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} to atlas.${name}`);
          } catch (err) {
            console.error('InsertMany error (partial ok):', err.message);
          }
        }
      } else {
        console.log('No documents to insert for this collection.');
      }
    }

    console.log('\nMigration completed.');
    console.log(`JSON exports available in ${outDir}`);
  } finally {
    await localConn.close();
    await atlasConn.close();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
