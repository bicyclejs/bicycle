import BicycleRequest from './Request';
import MutationResult from './MutationResult';
import ServerResponse from './ServerResponse';

export default interface Logging {
  readonly disableDefaultLogging: boolean;
  readonly onError: (e: {error: Error}) => any;
  readonly onRequestStart: (e: {readonly request: BicycleRequest}) => any;
  readonly onRequestEnd: (
    e: {readonly request: BicycleRequest; readonly response: ServerResponse},
  ) => any;
  readonly onMutationStart: (
    e: {
      mutation: {readonly method: string; readonly args: Object};
      context: any;
    },
  ) => any;
  readonly onMutationEnd: (
    e: {
      mutation: {readonly method: string; readonly args: Object};
      result: MutationResult<any>;
      context: any;
    },
  ) => any;
  readonly onQueryStart: (e: {query: Object; context: any}) => any;
  readonly onQueryEnd: (
    e: {query: Object; cacheResult: Object; context: any},
  ) => any;
}
