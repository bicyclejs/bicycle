const enum CacheUpdateType {
  // we no longer delete fields, this leads to a smoother experience
  // if the user navigates to a page they have recently visited
  // DELETE_FIELD = 0,
  ERROR = 1,
  NODE_ID = 2,
}
export default CacheUpdateType;
