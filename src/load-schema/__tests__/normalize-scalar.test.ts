// @flow

import freeze from '../../utils/freeze';
import normalizeScalar from '../../load-schema/normalize-scalar';

test('no name throws', () => {
  expect(() => normalizeScalar(freeze({}), [])).toThrowError(
    /Expected Scalar\.name to be a string but got void/,
  );
});
test('name must be alphabetic characters', () => {
  expect(() =>
    normalizeScalar(freeze({name: 'something_else'}), []),
  ).toThrowError(
    /Expected Scalar\.name to match \[A-Za-z\]\+ but got 'something_else'/,
  );
});
test('description not a string throws', () => {
  expect(() =>
    normalizeScalar(freeze({name: 'Something', description: null}), []),
  ).toThrowError(
    /Expected Something\.description to be a undefined \| string but got null/,
  );
});
test('no base type throws', () => {
  expect(() => normalizeScalar(freeze({name: 'Something'}), [])).toThrowError(
    /Something\.baseType has an invalid type\. Types must be strings or objects\./,
  );
});
test('parse/serialize throws', () => {
  expect(() =>
    normalizeScalar(
      freeze({name: 'Something', validate() {}, serialize() {}}),
      [],
    ),
  ).toThrowError(/Invalid key "serialize" in Scalar/);
  expect(() =>
    normalizeScalar(freeze({name: 'Something', validate() {}, parse() {}}), []),
  ).toThrowError(/Invalid key "parse" in Scalar/);
});
test('.validate', () => {
  test('non-function validate throws', () => {
    expect(() =>
      normalizeScalar(
        freeze({name: 'Something', validate: 'not a function'}),
        [],
      ),
    ).toThrowError(
      /Expected Something\.validate to be a function but got string/,
    );
  });
  test('validates input', () => {
    const result = normalizeScalar(
      freeze({
        name: 'Something',
        validate: (val: any) => {
          expect(val).toBe('Something');
          return true;
        },
      }),
      [],
    );
    expect(result.kind).toBe('ScalarType');
    expect(result.name).toBe('Something');
    expect(result.validate('Something')).toBe(true);
  });
});
