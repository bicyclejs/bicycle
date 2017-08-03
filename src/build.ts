import {readFileSync, writeFileSync} from 'fs';
import {lsrSync} from 'lsr';
const {sync: rimraf} = require('rimraf');

lsrSync(__dirname).forEach(entry => {
  if (
    entry.name === '__tests__' ||
    entry.name === 'test-schema' ||
    /^build\./.test(entry.name)
  ) {
    rimraf(entry.fullPath);
  }
});
writeFileSync(__dirname + '/LICENSE', readFileSync(__dirname + '/../LICENSE'));
writeFileSync(
  __dirname + '/README.md',
  readFileSync(__dirname + '/../README.md'),
);
writeFileSync(
  __dirname + '/HISTORY.md',
  readFileSync(__dirname + '/../HISTORY.md'),
);
const pkg = JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8'));

writeFileSync(
  __dirname + '/package.json',
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      keywords: pkg.keywords,
      dependencies: pkg.dependencies,
      repository: pkg.repository,
      author: pkg.author,
      license: pkg.license,
    },
    null,
    '  ',
  ) + '\n',
);

const history = readFileSync(__dirname + '/HISTORY.md', 'utf8');
if (history.indexOf('## v' + pkg.version + ':') === -1) {
  throw new Error('Missing history entry for ' + pkg.version);
}
