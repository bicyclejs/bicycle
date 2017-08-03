// @flow

import freeze from '../../utils/freeze';
import normalizeScalar from '../../load-schema/normalize-scalar';

test('no name throws', () => {
  expect(() => normalizeScalar(freeze({}), [])).toThrowError(
    /Expected Scalar\.name to be a string but got undefined/,
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
  ).toThrowError(/Expected Something\.description to be a string but got null/);
});
test('no methods throws', () => {
  expect(() => normalizeScalar(freeze({name: 'Something'}), [])).toThrowError(
    /Something expected either a validate method or a serialize and parse method/,
  );
});
test('validate + parse/serialize throws', () => {
  expect(() =>
    normalizeScalar(
      freeze({name: 'Something', validate() {}, serialize() {}}),
      [],
    ),
  ).toThrowError(/Something has a validate method and serialize\/parse/);
  expect(() =>
    normalizeScalar(freeze({name: 'Something', validate() {}, parse() {}}), []),
  ).toThrowError(/Something has a validate method and serialize\/parse/);
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
