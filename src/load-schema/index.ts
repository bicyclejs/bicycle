import {readdirSync} from 'fs';
import normalizeObject from './normalize-object';
import normalizeScalar from './normalize-scalar';
import Schema from '../types/Schema';
import * as TA from './TypeAssertions';

export default function loadSchema(input: {
  objects: any[];
  scalars?: any[];
}): Schema<any> {
  const i = TA.ObjectKeys(['scalars', 'objects']).validate(input, 'input');
  const objects = TA.ArrayOf(TA.AnyObject).validate(i.objects, 'input.objects');
  const scalars = TA.Void
    .or(TA.ArrayOf(TA.AnyObject))
    .validate(i.scalars, 'input.objects');
  const types: Schema<any> = {Root: null as any};
  const typeNames: string[] = [];

  let rootObject: null | Record<string, {}> = null;
  objects.forEach(Type => {
    const typeName = TA.String.validate(Type.name, 'Type.name');
    if (typeName === 'Root') {
      if (rootObject !== null) {
        throw new Error(
          `Duplicate Root Object.  You can only have one Root Object.`,
        );
      }
      rootObject = Type;
    } else if (typeName) {
      if (typeNames.indexOf(typeName) !== -1) {
        throw new Error(
          `Duplicate Object, "${typeName}".  Each object & scalar must have a unique name.`,
        );
      }
      typeNames.push(typeName);
    }
  });

  if (scalars) {
    scalars.forEach(Scalar => {
      const scalarName = TA.String.validate(Scalar.name, 'Scalar.name');
      if (typeNames.indexOf(scalarName) !== -1) {
        throw new Error(
          `Duplicate Scalar, "${scalarName}".  Each object & scalar must have a unique name.`,
        );
      } else if (scalarName === 'Root') {
        throw new Error('You cannot have a scalar called Root');
      } else if (scalarName) {
        typeNames.push(scalarName);
      }
    });
  }
  if (scalars) {
    scalars.forEach(Scalar => {
      const scalarName = TA.String.validate(Scalar.name, 'Scalar.name');
      types[scalarName] = normalizeScalar(Scalar, typeNames);
    });
  }

  // objects have `id`s and a collection of `fields`
  objects.forEach(Type => {
    const typeName = TA.String.validate(Type.name, 'Type.name');
    types[typeName] = normalizeObject(Type, typeNames);
  });
  if (!types.Root) {
    throw new Error('You must provide a Root object');
  }
  return types;
}

export function loadSchemaFromFiles(dirname: string): Schema<any> {
  dirname = dirname.replace(/(\\|\/)$/, '');
  const schema: {objects: any[]; scalars: any[]} = {objects: [], scalars: []};
  readdirSync(dirname + '/objects').forEach(filename => {
    let t = require(dirname + '/objects/' + filename);
    if (t.default) t = t.default;
    schema.objects.push(t);
  });
  let scalars = null;
  try {
    scalars = readdirSync(dirname + '/scalars');
  } catch (ex) {
    if (ex.code !== 'ENOENT') throw ex;
  }
  if (scalars) {
    scalars.forEach(filename => {
      let t = require(dirname + '/scalars/' + filename);
      if (t.default) t = t.default;
      schema.scalars.push(t);
    });
  }
  return loadSchema(schema);
}
