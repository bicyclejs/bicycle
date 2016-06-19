# bicycle/sessions/devnull

This module implements a bicycle session store but doesn't actually save anything.  It's primarily intended for internal
use in server sider rendering.

## Usage

```js
import DevNullSession from 'bicycle/sessions/devnull';

const session = new DevNullSession();
```
