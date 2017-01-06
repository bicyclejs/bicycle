let defaultErrorReporting = true;
const handlers = [];
export function reportError(err) {
  if (defaultErrorReporting) {
    console.error(err.stack);
  }
  handlers.forEach(handler => handler(err));
}
export function silenceDefaultErrorReporting() {
  defaultErrorReporting = false;
}
export function onError(handler) {
  handlers.push(handler);
}
