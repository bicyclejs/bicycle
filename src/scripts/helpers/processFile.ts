import assert = require('assert');
import {runInNewContext} from 'vm';
import getApiItem from './getApiItem';
import printApiItem from './printApiItem';

function evaluate(expression: string): any {
  const sandbox = {sandboxvar: null as any};
  runInNewContext('sandboxvar=' + expression.trim(), sandbox);
  return sandbox.sandboxvar;
}
const PREFIX = '<!-- tsdoc:';
export default function processFile(src: string) {
  const split = src.split(PREFIX);
  for (let i = 1; i < split.length; i += 2) {
    assert(
      split[i + 1].indexOf('end -->') === 0,
      'expected "<!-- tsdoc:end -->"',
    );
    const config = split[i].split(' -->')[0];
    const match = /^start *([^\(]+)(?:\(([^\)]+)\))? *$/.exec(config);
    assert(match, 'Expected "<!-- tsdoc:start ./file#exp ({config}) -->"');
    const path = match![1];
    const options = match![2] ? evaluate(match![2]) : {};
    const apiItem = getApiItem(path);
    const documentation = printApiItem(apiItem, options);
    split[i] = config + ' -->\n\n' + documentation + '\n\n';
  }
  return split.join(PREFIX);
}
