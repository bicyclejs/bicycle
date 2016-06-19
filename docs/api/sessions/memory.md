# bicycle/sessions/memory

This module implements a bicycle session store in memory.  It's perfect for small scale applications and for testing/development.  For larger deployments you should consider storing the session in something like redis or mongo.

## Usage

```js
import MemorySession from 'bicycle/sessions/memory';

// by default, sessions expire after 30 minutes of inactivity.
const session = new MemorySession();

// you can save memory on the server, at the expense of clients being more
// likely to need to re-fetch all the data by making the sessions shorter
const ONE_MINUTE = 60 * 1000;
const session = new MemorySession(ONE_MINUTE);

// you can reduce the likelihood of clients needing to re-fetch all the data
// by increasing the timeout, at the expense of more memory
const ONE_DAY = 24 * 60 * 60 * 1000;
const session = new MemorySession(ONE_DAY);
```
