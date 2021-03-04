# Airport Distance #

## Production Setup ##

1. `NODE_MODE=production` or undefined
2. yarn install
3. yarn build
4. yarn start

## Development Setup ##

1. `NODE_MODE=development`
2. yarn install
3. yarn server-dev
4. yarn client-dev

## Environment Variables ##

```(bash)
PORT=3010
NODE_MODE=production
```

For development, you should create a `.env` file to store all the environment variables above, they will be loaded when running `yarn start`.

The `./server/env.ts` file holds the default values for each of these variables.

- PORT: the port on which to run the node server
- NODE_MODE: specify whether to configure the server for development or production

## Using VS Code for debugging ##

To debug the client code, install 'Debugger for Chrome' VS Code extension and launch the browser using the provided launch configuration. This should happen after `yarn client-dev`.

To debug the node server code, run `yarn server-debug` and if the debugger doesn't get attached (no 'Debugger attached' message), make sure the 'Node Debug (legacy)' VS Code extension is enabled (it is disabled by default).
