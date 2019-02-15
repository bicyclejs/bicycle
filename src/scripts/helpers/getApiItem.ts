import assert = require('assert');
import * as utils from './utils';

export default function getApiItem(path: string) {
  const spl = path.split('#');
  assert(spl.length === 2);
  const [filename, member] = spl;
  assert(filename.indexOf('./') === 0);
  const pkg = utils.getApiPackage(`lib/${filename.substr(2)}.d.ts`);
  const exportedMembers = pkg.findMembersByName(member);
  assert(exportedMembers.length === 1);

  const exportedMember = exportedMembers[0];

  return exportedMember;
}
