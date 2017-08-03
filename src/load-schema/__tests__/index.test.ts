// @flow

import {loadSchemaFromFiles} from '../../load-schema';

test('it can load a schema from a file', () => {
  expect(
    loadSchemaFromFiles(__dirname + '/../../test-schema'),
  ).toMatchSnapshot();
});
