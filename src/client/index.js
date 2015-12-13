import Promise from 'promise';
import reduceState from './cache';
import reader from './reader';

export default function (runQuery) {
  var state = {cache: {}};
  function dispatch(action) {
    state = reduceState(state, action);
  }
  return {
    get(query, params) {
      let {result, loaded} = reader(state.cache, query, params);
      if (loaded) return Promise.resolve(result);
      return runQuery(query, params).then(
        payload => {
          dispatch({type: 'BICYCLE_SERVER_RESPONSE', payload, nodes: Object.keys(payload)});
          return reader(state.cache, query, params).result;
        }
      );
    },
    getSync(query, params) {
      let {result, loaded} = reader(state.cache, query, params);
      if (!loaded) {
        runQuery(query, params).done(
          payload => {
            dispatch({type: 'BICYCLE_SERVER_RESPONSE', payload, nodes: Object.keys(payload)});
          }
        );
      }
      return result;
    }
  };
};
