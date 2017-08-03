import {defaultState, parseChar} from 'character-parser';
import {inspect} from 'util';
import createError from '../utils/create-error';

// TODO: actually use this as a fallback when JSON.parse fails

// parse from string of the form (name: "value" ...) into a JSON object (to match the args format for updates)
export default function parseArgs(args: string): {[key: string]: any} {
  const result = {};
  const fullArgsString = args;
  let state = 'key';
  args = args.trim().substr(1); // ignore initial open bracket
  let currentKey = '';
  let currentValue = '';
  let cpState = defaultState();
  while (args.length) {
    switch (state) {
      case 'key':
        if (args[0] === ':') {
          state = 'value';
          cpState = defaultState();
          currentKey = currentKey.trim();
          args = args.substr(1);
          if (!currentKey) {
            throw createError(
              `Argument name cannot be empty string, full string was "${fullArgsString}"`,
              {
                exposeProd: true,
                code: 'ERROR_PARSING_ARGS',
                data: {fullArgsString},
              },
            );
          }
        } else if (args[0] === ')' && !currentKey.trim()) {
          state = 'terminated';
          args = args.substr(1);
        } else {
          currentKey += args[0];
          args = args.substr(1);
        }
        break;
      case 'value':
        if (cpState.isNesting() || (args[0] !== ')' && args[0] !== ',')) {
          currentValue += args[0];
          cpState = parseChar(args[0], cpState);
          args = args.substr(1);
        } else if (args[0] === ')') {
          result[currentKey] = parseValue(currentValue.trim(), currentKey);
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
        throw createError(
          `Closing bracket was reached before end of arguments, full string was "${fullArgsString}"`,
          {
            exposeProd: true,
            code: 'ERROR_PARSING_ARGS',
            data: {fullArgsString},
          },
        );
    }
  }
  if (state !== 'terminated') {
    throw createError(
      `End of args string reached with no closing bracket, full string was "${fullArgsString}"`,
      {exposeProd: true, code: 'ERROR_PARSING_ARGS', data: {fullArgsString}},
    );
  }
  return result;
}
function parseValue(value: string, argName: string): any {
  try {
    return value === 'undefined' || !value ? null : JSON.parse(value);
  } catch (ex) {
    throw createError(
      `Could not parse arg "${argName} with value ${inspect(
        value,
      )}, make sure the argument values are always valid JSON strings.`,
      {exposeProd: true, code: 'ERROR_PARSING_ARG', data: {argName, value}},
    );
  }
}
