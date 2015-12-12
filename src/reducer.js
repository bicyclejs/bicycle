import * as actions from './actions';
import {
  queryUnion,
  queryExclude,
  resultsUnion
} from './utils';

const INITIAL_STATE = {
  objectsById: {},
  loading: {}
};

export default function (state = INITIAL_STATE, action) {
  let objectsById = rObjectsById(
    state.objectsById,
    action
  );
  let loading = rLoading(
    state.loading,
    action
  );
  if (
    objectsById !== state.objectsById ||
    loading !== state.loading
  ) {
    return {objectsById, loading};
  } else {
    return state;
  }
};

function rObjectsById(state, action) {
  if (action.type === actions.SUCCESS) {
    return resultsUnion(state, action.results);
  }
  return state;
}
function rLoading(state, action) {
  if (action.type === actions.REQUEST) {
    state = queryUnion(state, action.query);
  }
  if (
    action.type === actions.SUCCESS ||
    action.type === actions.FAILURE
  ) {
    state = queryExclude(state, action.query);
  }
  return state;
};
