declare function Promise$await<T>(p: PromisePolyfill<T> | Promise<T> | T): T;
declare class PromisePolyfill<+R> {
  constructor(callback: (
    resolve: (result: PromisePolyfill<R> | Promise<R> | R) => void,
    reject: (error: any) => void,
  ) => mixed): void;

  then<U>(
    onFulfill?: ?(value: R) => PromisePolyfill<U> | Promise<U> | U,
    onReject?: ?(error: any) => PromisePolyfill<U> | Promise<U> | U,
  ): PromisePolyfill<U>;

  done<U>(
    onFulfill?: ?(value: R) => mixed,
    onReject?: ?(error: any) => mixed,
  ): void;

  catch<U>(
    onReject: (error: any) => PromisePolyfill<U> | Promise<U> | U
  ): PromisePolyfill<U>;

  static resolve<T>(object: PromisePolyfill<T> | Promise<T> | T): PromisePolyfill<T>;
  static reject<T>(error?: any): Promise<T>;

  static all<Elem, T:Iterable<Elem>>(promises: T): PromisePolyfill<$TupleMap<T, typeof Promise$await>>;
  // static all<T, Elem: PromisePolyfill<T> | Promise<T> | T>(Promises: Array<Elem>): PromisePolyfill<Array<T>>;
  static race<T, Elem: PromisePolyfill<T> | Promise<T> | T>(promises: Array<Elem>): PromisePolyfill<T>;

  static denodeify(fn: Function): Function;
}
declare module 'promise' {
  declare var exports: typeof PromisePolyfill;
}
declare module 'leven' {
  declare var exports: (a: string, b: string) => number;
}
declare module 'deep-freeze' {
  declare var exports: <T>(o: T) => T;
}
declare module 'character-parser' {
  declare type TokenType = (
    '//' |
    '/**/' |
    '\'' |
    '"' |
    '`' |
    '//g' |
    ')' |
    '}' |
    ']'
  );
  declare class CharacterParserState {
    stack: Array<TokenType>;
    regexpStart: boolean;
    escaped: boolean;
    hasDollar: boolean;
    src: string;
    history: string;
    lastChar: string;
    current(): TokenType;
    isString(): boolean;
    isComment(): boolean;
    isNesting(): boolean;
  }
  declare var exports: {
    parse: (
      (
        src: string,
        state?: CharacterParserState,
        options?: {start?: number, end?: number},
      ) => CharacterParserState
    ),
    parseUntil: (
      (src: string, delimiter: string, options?: {start?: number, ignoreNesting?: boolean}) => {
        start: number,
        end: number,
        src: string,
      }
    ),
    parseChar: (
      (character: string, state: ?CharacterParserState) => CharacterParserState
    ),
    defaultState: () => CharacterParserState,
  };
}
declare module 'body-parser' {
  declare type express$NextFunction = (err?: ?Error) => mixed;
  declare type express$Request = any;
  declare type express$Response = any;
  declare type express$Middleware = (
    (req: express$Request, res: express$Response, next: express$NextFunction) => mixed
  );
  declare type JSON$revivier = (key: any, value: any) => any;
  declare type bodyParser$typeFn = (req: express$Request) => boolean;
  declare type bodyParser$verifyFn = (
    (req: express$Request, res: express$Response, buf: Buffer, encoding: string) => mixed
  );
  declare type bodyParser$jsonOptions = {
    inflate?: boolean,
    limit?: number | string,
    reviver?: JSON$revivier,
    strict?: boolean,
    type?: string | bodyParser$typeFn,
    verify?: bodyParser$verifyFn,
  };
  declare var exports: {
    json: (options?: bodyParser$jsonOptions) => express$Middleware,
    // TODO: raw, text, etc
  };
}
