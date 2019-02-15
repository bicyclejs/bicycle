import {readdirSync, readFileSync, writeFileSync} from 'fs';
import processFile from './helpers/processFile';

readdirSync(`docs`).forEach(doc => {
  writeFileSync(
    `docs/${doc}`,
    processFile(readFileSync(`docs/${doc}`, 'utf8')),
  );
});
