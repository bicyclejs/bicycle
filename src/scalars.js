// built in scalars

export default [
  {
    name: 'id',
    description: 'This is a string, but you can use it to make your code more self-documenting',
    serialize(value) {
      return '' + value;
    },
    parse(value) {
      return '' + JSON.parse(value);
    },
    parseValue(value) {
      return '' + value;
    },
  },
  {
    name: 'string',
    description: 'A string of arbitrary text',
    serialize(value) {
      return '' + value;
    },
    parse(value) {
      return '' + JSON.parse(value);
    },
    parseValue(value) {
      return '' + value;
    },
  },
  {
    name: 'boolean',
    description: 'Either `true` or `false`',
    serialize(value) {
      return !!value;
    },
    parse(value) {
      return !!JSON.parse(value);
    },
    parseValue(value) {
      return !!value;
    },
  },
];
