// source: https://github.com/substack/json-stable-stringify
// modified to remove options

export default function (obj, replacer) {
  const seen = [];
  return (function stringify(node) {
    if (replacer) node = replacer(node);
    if (node === undefined) {
      return undefined;
    }
    if (typeof node !== 'object' || node === null) {
      return JSON.stringify(node);
    }
    if (Array.isArray(node)) {
      if (seen.indexOf(node) !== -1) {
        throw new TypeError('Converting circular structure to JSON');
      }
      else seen.push(node);
      const out = [];
      for (let i = 0; i < node.length; i++) {
        const item = stringify(node[i]) || 'undefined';
        out.push(item);
      }
      return '[' + out.join(',') + ']';
    } else {
      if (seen.indexOf(node) !== -1) {
        throw new TypeError('Converting circular structure to JSON');
      }
      else seen.push(node);

      const keys = Object.keys(node).sort();
      const out = [];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = stringify(node[key]);

        if (!value) continue;

        const keyValue = key + ':' + value;
        out.push(keyValue);
      }
      return '{' + out.join(',') + '}';
    }
  })(obj);
}
