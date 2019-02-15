import {tmpdir} from 'os';
import * as ae from '@microsoft/api-extractor';
import cuid = require('cuid');
import {sync as rimraf} from 'rimraf';
import {readFileSync} from 'fs';
import assert = require('assert');

export function getApiPackage(entryPoint: string) {
  const outputFolder = tmpdir() + '/' + cuid();
  const extractor = new ae.Extractor(
    {
      compiler: {
        configType: 'tsconfig',
        rootFolder: '.',
      },
      project: {
        entryPointSourceFile: entryPoint,
      },
      apiReviewFile: {
        enabled: false,
      },
      apiJsonFile: {
        enabled: true,
        outputFolder,
      },
      dtsRollup: {
        enabled: false,
      },
    },
    {localBuild: true},
  );
  extractor.processProject({});
  const json = JSON.parse(
    readFileSync(outputFolder + '/bicycle.api.json', 'utf8'),
  );
  rimraf(outputFolder);
  const item = ae.ApiItem.deserialize(json) as ae.ApiPackage;
  assert(item instanceof ae.ApiPackage);
  const entryPoints = item.findEntryPointsByPath('');
  assert(entryPoints.length === 1);
  return entryPoints[0];
}

/**
 * convert an ApiItem to a JSON structure
 */
export function serialize(item: ae.ApiItem) {
  const result: any = {};
  item.serializeInto(result);
  return result;
}
