# How install it

`npm i server-load-modules`

# Why this project?
This project use `autoload` npm package to load modules. It's only a server-side package because it use filesystem.

# How it's works
For this example with have "my-project" as main project, and "my-module" as module.

1. You must define a module-architecture for your projects
> ex : add into "package.json" a property "my-project", with a sub-property "paths" which will list paths to load

```json
{
    "name": "my-module",
    "version": "1.0.0",
    ...
    "my-project": {
        "paths": [
            "./folder1",
            "./folder2"
        ]
    }
}
```

2. Call `server-load-modules` into my-project

```typescript
import { loadModules } from 'server-load-modules';
loadModules({
    propertyDetection: ['my-project', 'paths']
}).then(() => {
    // Execute code after load
});
```

# API
Parameters to loadModules are :
```typescript
interface ILoadParams {
    arbitraryAdd?: string[];
    baseFile?: string;
    basePath?: string;
    global?: EGlobal;
    propertyDetection?: string[];
    onDetection?: (content: any, module: string, fullContent: any) => Promise<string[]>;
}
```
* arbitraryAdd: Paths to load arbitrary (ex : Some folders to load in `my-project`), default: []
* baseFile: File to use for module detection, default: `package.json`
* basePath: Change base path for resolve paths, default: `./`
* global: Use global node_modules or not, default: `OPTIONAL`
    * Values are :
        * OPTIONAL: Try to load modules from `npm -g root`, but if cannot be done it ignore them
        * DISABLE: No try to load modules from `npm -g root`
        * REQUIRED: Try to load modules from `npm -g root`, and if cannot be done, stop load and reject
* propertyDetection: Properties to detect from `baseFile`, default: `[]`
* onDetection: Callback called on each module detected, default: `(e) => { return Promise.resolve(e); }`
    * Parameters are :
        * content: JSON of tag detected (with `propertyDetection` from `baseFile`)
        * module: Path of module
        * fullContent: JSON of entire file `baseFile`
