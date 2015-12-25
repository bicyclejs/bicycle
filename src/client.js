import request from 'then-request';
import {parse, Source} from 'graphql/language';
import objectKey from './object-key';

function defaultNetworkLayer(url, options = {}) {
  return req => request('POST', url, {...options, json: req}).getBody('utf8').then(JSON.parse);
}
export default Client;

function Client(network) {
  this._network = network || defaultNetworkLayer('/bicycle');
  this._cache = {};
}
Client.prototype._select = function (node, subFields, cacheAliases) {
  const result = {};
  Object.keys(subFields).forEach(cacheKey => {
    const resultName = subFields[cacheKey].alias || subFields[cacheKey].source;
    let cacheAlias = cacheKey;
    if (cacheAliases[cacheKey]) cacheAlias = cacheAliases[cacheKey];
    if (!subFields[cacheKey].subFields) {
      result[resultName] = node[cacheAlias];
    } else if (Array.isArray(node[cacheAlias])) {
      result[resultName] = node[cacheAlias].map(id => {
        return this._select(this._cache[id], subFields[cacheKey].subFields, cacheAliases);
      });
    } else {
      result[resultName] = this._select(this._cache[node[cacheAlias]], subFields[cacheKey].subFields, cacheAliases);
    }
  });
  return result;
};
Client.prototype.subscribe = function (q, params, fn) {
  console.log(q.str);
  const cacheAliases = {};
  Object.keys(q.cacheAliases).forEach(key => {
    cacheAliases[key] = q.cacheAliases[key](params);
  });
  this._network({
    query: q.str,
    params,
  }).done(result => {
    Object.keys(result.data).forEach(key => {
      deepMergeCache(this._cache, result.data, cacheAliases);
    });
    fn(this._select(this._cache['QueryRoot'], q.ast, cacheAliases));
    console.log(this._cache);
  });
};
function inputValueToString(value, params) {
  switch (value.kind) {
    case 'StringValue':
      return {str: JSON.stringify(value.value), constant: true};
    case 'Variable':
      if (params && (value.name.value in params)) {
        return {str: JSON.stringify(params[value.name.value]), constant: true};
      }
      return {str: '$' + value.name.value, constant: false};
    default:
      throw new Error('Unexpected input type ' + value.kind);
  }
}
function inputTypeToString(t) {
  switch (t.kind) {
    case 'NonNullType':
      return inputTypeToString(t.type) + '!';
    case 'NamedType':
      return t.name.value;
    default:
      debugger;
      throw new Error('Unexpected input type ' + t.kind);
  }
}
function normalizeQuery(selectionSet, cacheAliases) {
  const results = {
    'id': {source: 'id', args: null, subFields: null},
  };
  selectionSet.selections.forEach(selection => {
    const result = {
      source: selection.name.value,
      args: null,
      subFields: null,
      alias: selection.alias && selection.alias.value,
    };
    let requestAlias = selection.name.value;
    if (selection.arguments && selection.arguments.length) {
      let isConstant = true;
      const args = selection.arguments.sort(
        (a, b) => {
          return a.name.value < b.name.value ? 1 : -1;
        }
      ).map(arg => {
        const {str, constant} = inputValueToString(arg.value);
        if (!constant) isConstant = false;
        return arg.name.value + ': ' + str;
      }).join(', ');
      requestAlias += '_' + objectKey(args);
      result.args = args;
      if (!isConstant) {
        cacheAliases[requestAlias] = (params) => {
          const concreteArgs = selection.arguments.sort(
            (a, b) => {
              return a.name.value < b.name.value ? 1 : -1;
            }
          ).map(arg => {
            const {str} = inputValueToString(arg.value, params);
            return arg.name.value + ': ' + str;
          }).join(', ');
          return selection.name.value + '_' + objectKey(concreteArgs);
        };
      }
    }

    if (selection.selectionSet) {
      result.subFields = normalizeQuery(selection.selectionSet, cacheAliases);
    }
    results[requestAlias] = deepMerge(results[requestAlias], result);
  });
  return results;
}
function normalQueryToString(query) {
  return Object.keys(query).map(alias => {
    return (
      (
        alias === query[alias].source ? '' : alias + ': '
      ) +
      query[alias].source +
      (
        query[alias].args ? '(' + query[alias].args + ')' : ''
      ) +
      (
        query[alias].subFields ? '{' + normalQueryToString(query[alias].subFields) + '}' : ''
      )
    );
  }).join(',');
}
Client.QL = function (query, ...params) {
  const basicAst = parse(new Source(query.join(''), 'Bicycle Request'));
  const cacheAliases = {};
  const ast = normalizeQuery(basicAst.definitions[0].selectionSet, cacheAliases);
  const str = (
    'query ' +
    (
      basicAst.definitions[0].variableDefinitions && basicAst.definitions[0].variableDefinitions.length ?
      '(' +
      basicAst.definitions[0].variableDefinitions.map(v => {
        return '$' + v.variable.name.value + ': ' + inputTypeToString(v.type);
      }).join(', ') +
      ')' : ''
    ) +
    '{' + normalQueryToString(ast) + '}'
  );
  return {str, ast, cacheAliases};
};

function deepMerge(oldObj, newObj) {
  if (Array.isArray(newObj)) {
    oldObj = oldObj || [];
    const result = [];
    for (let i = 0; i < Math.max(oldObj.length, newObj.length); i++) {
      if (i < newObj.length) {
        result.push(deepMerge(oldObj[i], newObj[i]));
      } else {
        result.push(oldObj[i]);
      }
    }
    return result;
  } else if (newObj && typeof newObj === 'object') {
    oldObj = oldObj || {};
    Object.keys(newObj).forEach(key => {
      oldObj[key] = deepMerge(oldObj[key], newObj[key]);
    });
    return oldObj;
  } else {
    return newObj;
  }
}
function deepMergeCache(oldObj, newObj, cacheAliases) {
  if (Array.isArray(newObj)) {
    oldObj = oldObj || [];
    const result = [];
    for (let i = 0; i < Math.max(oldObj.length, newObj.length); i++) {
      if (i < newObj.length) {
        result.push(deepMergeCache(oldObj[i], newObj[i]));
      } else {
        result.push(oldObj[i]);
      }
    }
    return result;
  } else if (newObj && typeof newObj === 'object') {
    oldObj = oldObj || {};
    Object.keys(newObj).forEach(key => {
      let cacheAlias = key;
      if (key in cacheAliases) cacheAlias = cacheAliases[key];
      oldObj[cacheAlias] = deepMergeCache(oldObj[cacheAlias], newObj[key], cacheAliases);
    });
    return oldObj;
  } else {
    return newObj;
  }
}
