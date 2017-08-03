import CacheUpdateType from '../CacheUpdateType';
import Cache, {CacheData, CacheObject} from './Cache';

export default interface NodeID {
  _type: CacheUpdateType.NODE_ID;
  // the node type's name
  n: string;
  // the node's id
  i: string | number;
};
export function createNodeID(name: string, id: string): NodeID {
  return {_type: CacheUpdateType.NODE_ID, n: name, i: id};
}
export function isID(id: CacheData): id is NodeID {
  return !!(
    id &&
    typeof id === 'object' &&
    (id as NodeID)._type === CacheUpdateType.NODE_ID
  );
}
export function getNode(cache: Cache, id: NodeID): CacheObject {
  const nodeCache = cache[id.n] || (cache[id.n] = {});
  return nodeCache[id.i] || (nodeCache[id.i] = {});
}
