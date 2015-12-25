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
Client.prototype._select = function (node, subFields) {
  const result = {};
  Object.keys(subFields).forEach(cacheKey => {
    const resultName = subFields[cacheKey].alias || subFields[cacheKey].source;
    if (!subFields[cacheKey].subFields) {
      result[resultName] = node[cacheKey];
    } else if (Array.isArray(node[cacheKey])) {
      result[resultName] = node[cacheKey].map(id => {
        return this._select(this._cache[id], subFields[cacheKey].subFields);
      });
    } else {
      result[resultName] = this._select(this._cache[node[cacheKey]], subFields[cacheKey].subFields);
    }
  });
  return result;
};
Client.prototype.subscribe = function (q, fn) {
  console.log(q.str);
  this._network({
    query: q.str,
  }).done(result => {
    Object.keys(result.data).forEach(key => {
      deepMerge(this._cache, result.data);
    });
    fn(this._select(this._cache['QueryRoot'], q.ast));
  });
};
function inputValueToString(value) {
  switch (value.kind) {
    case 'StringValue':
      return JSON.stringify(value.value);
    default:
      throw new Error('Unexpected input type ' + value.kind);
  }
}
function normalizeQuery(selectionSet) {
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
    let cacheName = selection.name.value;
    if (selection.arguments && selection.arguments.length) {
      const args = selection.arguments.sort(
        (a, b) => {
          return a.name.value < b.name.value ? 1 : -1;
        }
      ).map(arg => arg.name.value + ': ' + inputValueToString(arg.value)).join(', ');
      cacheName += '_' + objectKey(args);
      result.args = args;
    }

    if (selection.selectionSet) {
      result.subFields = normalizeQuery(selection.selectionSet);
    }
    results[cacheName] = deepMerge(results[cacheName], result);
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
  const ast = normalizeQuery(
    parse(new Source(query.join(''), 'Bicycle Request')).definitions[0].selectionSet
  );
  console.dir(ast);
  const str = 'query {' + normalQueryToString(ast) + '}';
  return {str, ast};
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
