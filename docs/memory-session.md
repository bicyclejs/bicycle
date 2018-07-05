---
id: memory-session
title: MemorySessionStore
sidebar_label: Memory
---

This module implements a bicycle session store in memory.  This session store is suitable if you are able to keep all active sessions in memory.  For larger deployments you should consider storing the session in something like redis or mongo.

## Usage

The constructor takes a single argument `size` which defaults to 100. You should think of the size as the maximum number of active sessions.

```js
import MemorySessionStore from 'bicycle/sessions/MemorySessionStore';

// by default, memory session store keeps the 100 most recently
// used sessions
const session = new MemorySessionStore();

// you can save memory on the server, at the expense of clients being more
// likely to need to re-fetch all the data by limiting the sessions
const session = new MemorySessionStore(10);

// you can reduce the likelihood of clients needing to re-fetch all the data
// by increasing the numbdr of sessions that are kept
const session = new MemorySessionStore(10000);
```
