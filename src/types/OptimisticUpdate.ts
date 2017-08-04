import Cache, {CacheUpdate} from './Cache';
import OptimisticValue from './OptimisticValue';

type OptimisticUpdate = ((
  mutation: {objectName: string; methodName: string; args: any},
  cache: Cache,
  getOptimisticValue: (name: string) => OptimisticValue,
) => void | null | CacheUpdate);
export default OptimisticUpdate;
