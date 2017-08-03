export default {
  name: 'JsonObject',
  baseType: 'any',
  validate(value) {
    return value && typeof value === 'object';
  },
};
