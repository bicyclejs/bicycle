// @flow

import leven from 'leven';

/**
 * Find the closest match for a string in a list of valid strings.  This can be used to suggest corrections for typos.
 */
export default function suggestMatch(validKeys: Array<string>, key: string): string {
  if (process.env.NODE_ENV === 'production') return '';
  const closestMatch = validKeys.reduce((best, validKey) => {
    const distance = leven(key, validKey);
    return distance < best.distance ? {distance, validKey} : best;
  }, {distance: Infinity, validKey: ''});
  return (
    closestMatch.distance < (key.length / 2)
    ? ` maybe you meant to use "${closestMatch.validKey}"`
    : ``
  );
}
