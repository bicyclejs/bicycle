export const REQUEST = 'BICYCLE_REQUEST';
export const SUCCESS = 'BICYCLE_SUCCESS';
export const FAILURE = 'BICYCLE_FAILURE';

export function request(query) {
  return {
    type: REQUEST,
    query: query
  };
};
export function success(query, results) {
  return {
    type: SUCCESS,
    query: query,
    results: results
  };
};

export function failure(query, error) {
  return {
    type: FAILURE,
    query: query,
    error: error
  };
};
