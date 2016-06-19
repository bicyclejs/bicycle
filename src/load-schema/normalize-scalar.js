import assert from 'assert';
import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-value';

function normalizeScalar(Scalar: Object): Object {
  assert(
    Scalar && typeof Scalar === 'object' && !Array.isArray(Scalar),
    `Expected Scalar to be an Object but got ${Scalar === null ? 'null' : typeof Scalar}`,
  );
  assert(
    typeof Scalar.name === 'string',
    `Expected Scalar.name to be a string but got ${typeName(Scalar.name)}`,
  );
  assert(
    /^[A-Za-z]+$/.test(Scalar.name),
    `Expected Scalar.name to match [A-Za-z]+ but got '${Scalar.name}'`,
  );
  assert(
    typeof Scalar.description === 'string' || typeof Scalar.description === 'undefined',
    `Expected ${Scalar.name}.description to be a string but got ${typeName(Scalar.description)}`,
  );
  assert(
    Scalar.validate || Scalar.serialize || Scalar.parse,
    `${Scalar.name} expected either a validate method or a serialize and parse method.`
  );
  if (Scalar.validate !== undefined) {
    assert(
      typeof Scalar.validate === 'function',
      `Expected ${Scalar.name}.validate to be a function but got ${typeName(Scalar.validate)}`,
    );
    if (Scalar.serialize !== undefined || Scalar.parse !== undefined) {
      throw new Error(`${Scalar.name} has a validate method and serialize/parse.  Choose one or the other`);
    }
    Scalar = {
      ...Scalar,
      serialize(value) {
        Scalar.validate(value);
        return value;
      },
      parse(value) {
        Scalar.validate(value);
        return value;
      },
    };
  } else {
    assert(
      typeof Scalar.serialize === 'function',
      `Expected ${Scalar.name}.serialize to be a function but got ${typeName(Scalar.serialize)}`,
    );
    assert(
      typeof Scalar.parse === 'function',
      `Expected ${Scalar.name}.parse to be a function but got ${typeName(Scalar.parse)}`,
    );
  }
  return freeze({
    kind: 'ScalarType',
    name: Scalar.name,
    description: Scalar.description,
    // serialize into something JSONable for a response
    serialize: Scalar.serialize,
    // parse from a JSON value
    parse: Scalar.parse,
  });
}

export default normalizeScalar;
