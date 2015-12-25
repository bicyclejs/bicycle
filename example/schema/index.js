import fs from 'fs';
import server from '../../src/server';

const schema = {};
fs.readdirSync(__dirname).forEach(folder => {
  if (/\./.test(folder)) return;
  schema[folder] = [];
  fs.readdirSync(__dirname + '/' + folder).forEach(file => {
    let description = require('./' + folder + '/' + file);
    if (description.default) description = description.default;
    schema[folder].push(description);
  });
});

export default server(schema, () => {});
