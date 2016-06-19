# bicycle/network-layer

This module is the default implementation of the networking layer for bicycle client.  You could use your own
implementation if you want to make requests over a different protocol (e.g. websockets).

## Usage

You can call the `loadSchema` function directly to load a schema that you already have in an object.

```js
import BicycleClient from 'bicycle/client';
import NetworkLayer from 'bicycle/network-layer';

const client = new BicycleClient(new NetworkLayer());
```

You can customize the path (which defaults to `/bicycle`) that requests are sent to or add headers by passing them to
the `NetworkLayer` constructor:

```js
const client = new BicycleClient(new NetworkLayer('/custom-bicyle-path', {headers: {'x-csrf-token': CSRF_TOKEN}}));
```
