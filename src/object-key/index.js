import crc from './crc';
import str from './str';

export default function (obj, replacer) {
  return crc(str(obj, replacer)).toString(36);
}
