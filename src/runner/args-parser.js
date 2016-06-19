import cp from 'character-parser';
import {inspect} from 'util';

// parse from string of the form (name: "value" ...) into a JSON object (to match the args format for updates)
export default function parseArgs(args: string): {[key: string]: any} {
  const result = {};
  const fullArgsString = args;
  let state = 'key';
  args = args.trim().substr(1); // ignore initial open bracket
  let currentKey = '';
  let currentValue = '';
  let cpState = null;
  while (args.length) {
    switch (state) {
      case 'key':
        if (args[0] === ':') {
          state = 'value';
          cpState = cp.defaultState();
          currentKey = currentKey.trim();
          args = args.substr(1);
        } else {
          currentKey += args[0];
          args = args.substr(1);
        }
        break;
      case 'value':
        if (cpState.isNesting() || args[0] !== ')' && args[0] !== ',') {
          currentValue += args[0];
          cpState = cp.parseChar(args[0], cpState);
          args = args.substr(1);
        } else if (args[0] === ')') {
          if (currentKey.trim()) {
            result[currentKey] = parseValue(currentValue.trim(), currentKey);
          }
          state = 'terminated';
          args = args.substr(1);
        } else {
          result[currentKey] = parseValue(currentValue.trim(), currentKey);
          state = 'key';
          currentKey = '';
          currentValue = '';
          args = args.substr(1);
        }
        break;
      case 'terminated':
        throw new Error(
          `Closing bracket was reached before end of arguments, full string was "${fullArgsString}"`
        );
    }
  }
  return result;
}
function parseValue(value: string, argName: string): any {
  try {
    return (value === 'undefined' || !value) ? null : JSON.parse(value);
  } catch (ex) {
    throw new Error(`Could not parse arg "${argName} with value ${inspect(value)}`);
  }
}
