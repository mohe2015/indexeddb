
https://nodejs.org/api/esm.html#esm_self_referencing_a_package_using_its_name

https://nodejs.org/api/esm.html#esm_internal_package_imports

https://github.com/microsoft/TypeScript/issues/33079

sudo nixos-container create idb-mongodb --flake .
sudo nixos-container start  idb-mongodb

# Setup

```
(cd lib && yarn link)
(cd tests && yarn link @dev.mohe/indexeddb)

# New Project

> ✨ Bootstrapped with Create Snowpack App (CSA).

## Available Scripts

### npm start

Runs the app in the development mode.
Open http://localhost:8080 to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### npm run build

Builds a static copy of your site to the `build/` folder.
Your app is ready to be deployed!

**For the best production performance:** Add a build bundler plugin like "@snowpack/plugin-webpack" or "@snowpack/plugin-parcel" to your `snowpack.config.json` config file.

### Q: What about Eject?

No eject needed! Snowpack guarantees zero lock-in, and CSA strives for the same.
