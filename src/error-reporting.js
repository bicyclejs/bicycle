// @flow

import type {ErrorInterface} from './flow-types';

let defaultErrorReporting = true;
const handlers = [];
export function reportError(err: ErrorInterface) {
  if (defaultErrorReporting) {
    console.error(err.stack);
  }
  handlers.forEach(handler => handler(err));
}
export function silenceDefaultErrorReporting() {
  defaultErrorReporting = false;
}
export function onError(handler: (err: ErrorInterface) => mixed) {
  handlers.push(handler);
}
