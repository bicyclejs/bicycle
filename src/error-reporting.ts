import Logging from './types/Logging';

export default function reportError(err: Error, logging: Logging) {
  if (!(logging && logging.disableDefaultLogging)) {
    console.error(err.stack || err);
  }
  if (logging) {
    logging.onError({error: err});
  }
}
