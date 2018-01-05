# BicycleClient

If you don't need to customise any details about the networking, server side
rendering etc. you can just do:

```js
import BicycleClient from 'bicycle/client';

const client = new BicycleClient();

const unsubscribe = client.subscribe({{todos: {id: true, title: true, completed: true}}}, (result, loaded, errors) => {
  if (errors.length) {
    console.log('Something went wrong loading data');
  } else if (loaded) {
    console.dir(result);
  }
});
// call unsubscribe to stop listening
```

You can customize the path (which defaults to `/bicycle`) that requests are sent
to or add headers by passing them to the `NetworkLayer`:

```js
import BicycleClient, {NetworkLayer} from 'bicycle/client';

const client = new BicycleClient({
  networkLayer: new NetworkLayer('/custom-bicycle-path', {
    headers: {'x-csrf-token': CSRF_TOKEN},
  }),
});
```

If you are doing server sider rendering, you should pass the `serverPreparation`
value you got from bicycle as the second argument to the constructor:

```js
import BicycleClient, {NetworkLayer} from 'bicycle/client';

const client = new BicycleClient({
  networkLayer: new NetworkLayer('/custom-bicycle-path', {
    headers: {'x-csrf-token': CSRF_TOKEN},
  }),
  serverPreparation,
});
```

Alternatively, you can just declare a global variable called
`BICYCLE_SERVER_PREPARATION` which will be detected automatically.

## NetworkLayer

In addition to passing in the bicycle `NetworkLayer` with custom options, you
can also just provide your own implementation. Any object with a `.send(message)
=> Promise<result>` method will work fine. On the server side you can then call
`handleMessage` to process the message.

It should be noted that the built in NetworkLayer also works well on the server
side, providing you override the `'path'` to be a full absolute URI.
