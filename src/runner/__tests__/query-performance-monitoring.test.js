// @flow

import {runQuery, enablePerformanceMonitoring} from '../';
import loadSchema from '../../load-schema';

test('runQuery', async () => {
  enablePerformanceMonitoring();
  const log = [];
  const oldLog = console.log;
  (console: any).log = str => log.push(str);
  await runQuery(
    loadSchema({
      objects: [
        {
          name: 'Root',
          fields: {
            foo: {
              type: 'string',
              resolve() {
                return new Promise(resolve => setTimeout(() => resolve('foo'), 1000));
              },
            },
          },
        },
      ],
    }),
    {foo: true},
    {},
  );
  expect(log.join('\n').replace(/[0-9]+[a-z][a-z]?/g, 'TIME')).toMatchSnapshot();
  (console: any).log = oldLog;
});
