import { createStore, combineReducers } from 'redux';
import applyMiddleware from 'redux-wait';
import thunkMiddleware from 'redux-thunk';
import apiMiddleware from '../middleware/api';
import loggerMiddleware from 'redux-logger';
import * as reducers from '../reducers';

function basicLoggerMiddleware({ getState }) {
  return (next) => (action) => {
    const time = new Date();
    const message = `action ${action.type} @ ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;

    console.log(message);

    return next(action);
  };
}
const reducer = combineReducers(reducers);
const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  apiMiddleware,
  typeof console !== 'undefined' && console && console.group ? loggerMiddleware : basicLoggerMiddleware
)(createStore);

/**
 * Creates a preconfigured store for this example.
 */
export default function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}
