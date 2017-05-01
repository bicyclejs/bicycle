// @flow

import type {ErrorInterface, Logging} from './flow-types';

export default function reportError(err: ErrorInterface, logging: Logging) {
  if (!(logging && logging.disableDefaultLogging)) {
    console.error(err.stack);
  }
  if (logging) {
    logging.onError({error: err});
  }
}
