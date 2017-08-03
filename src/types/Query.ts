interface Query {
  readonly [key: string]: true | Query;
}
export default Query;
export interface QueryUpdate {
  readonly [key: string]: boolean | QueryUpdate;
}
