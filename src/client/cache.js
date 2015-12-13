// actions:
//  server response
//  begin query
//  begin update

function reduceCache(cache, response) {
  let result = {...cache};
  Object.keys(response).forEach(key => {
    result[key] = cache[key] ? {...cache[key], ...response[key]} : response[key];
  });
  return result;
}

export default function reduceState(state, action) {
  switch (action.type) {
    case 'BICYCLE_SERVER_RESPONSE':
      return {...state, cache: reduceCache(state.cache, action.payload)};
    default:
      return state;
  }
}

