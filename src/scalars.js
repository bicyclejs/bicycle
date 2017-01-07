// @flow
// built in scalars

export default [
  {
    name: 'string',
    description: 'A string of arbitrary text',
    serialize(value: mixed): string {
      if (typeof value !== 'string') {
        throw new Error('Expected string but got ' + typeof value);
      }
      return '' + value;
    },
    parse(value: mixed): string {
      if (typeof value !== 'string') {
        throw new Error('Expected string but got ' + typeof value);
      }
      return '' + value;
    },
  },
  {
    name: 'boolean',
    description: 'Either `true` or `false`',
    serialize(value: mixed): boolean {
      if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
        throw new Error('Expected boolean but got ' + typeof value);
      }
      return !!value;
    },
    parse(value: mixed): boolean {
      if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
        throw new Error('Expected boolean but got ' + typeof value);
      }
      return !!value;
    },
  },
  {
    name: 'number',
    description: 'Any floating point number',
    serialize(value: mixed): number {
      if (typeof value !== 'number') {
        throw new Error('Expected number but got ' + typeof value);
      }
      return value;
    },
    parse(value: mixed): number {
      if (typeof value !== 'number') {
        throw new Error('Expected number but got ' + typeof value);
      }
      return value;
    },
  },
];
