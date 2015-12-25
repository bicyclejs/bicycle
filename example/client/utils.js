export function pluralize(count, word) {
  return count === 1 ? word : word + 's';
}

export function classNames(...args) {
  // based on https://github.com/JedWatson/classnames
  let classes = '';

  args.forEach(arg => {
    if (arg) {
      const argType = typeof arg;

      if (argType === 'string' || argType === 'number') {
        classes += ' ' + arg;
      } else if (Array.isArray(arg)) {
        classes += ' ' + classNames(...arg);
      } else if (argType === 'object') {
        Object.keys(arg).forEach(key => {
          if (arg[key]) {
            classes += ' ' + key;
          }
        });
      }
    }
  });

  return classes.substr(1);
}

export function uuid() {
  let i, random;
  let uuid = '';

  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
      .toString(16);
  }

  return uuid;
}
