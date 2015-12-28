// built in scalars

export default [
  {
    name: 'string',
    description: 'A string of arbitrary text',
    serialize(value): string {
      return '' + value;
    },
    parse(value): string {
      return '' + JSON.parse(value);
    },
    parseValue(value): string {
      return '' + value;
    },
  },
  {
    name: 'boolean',
    description: 'Either `true` or `false`',
    serialize(value): boolean {
      return !!value;
    },
    parse(value): boolean {
      return !!JSON.parse(value);
    },
    parseValue(value): boolean {
      return !!value;
    },
  },
  {
    name: 'number',
    description: 'Any floating point number',
    serialize(value): number {
      if (typeof value !== 'number') {
        throw new Error('Expected number but got ' + typeof value);
      }
      return value;
    },
    parse(value): number {
      const result = JSON.parse(value);
      if (typeof result !== 'number') {
        throw new Error('Expected number but got ' + typeof result);
      }
      return result;
    },
    parseValue(value): number {
      if (typeof value !== 'number') {
        throw new Error('Expected number but got ' + typeof value);
      }
      return value;
    },
  },
];
