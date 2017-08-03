export default interface OptimisticValue {
  isPending(): boolean;
  isRejected(): boolean;
  getError(): null | Error;
  toString(): string;
  inspect(): string;
  toJSON(): string;
  valueOf(): string;
};
