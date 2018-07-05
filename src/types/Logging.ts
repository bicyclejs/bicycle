import MutationResult from './MutationResult';

export default interface Logging {
  readonly disableDefaultLogging: boolean;
  readonly onError: (e: {error: Error}) => any;
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
