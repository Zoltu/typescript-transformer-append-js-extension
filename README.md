# Abstract
Teach the TypeScript compiler to emit JavaScript files that can be run natively in the browser using es2015 module syntax.

## Motivation
Browsers now support loading modules natively, without needing to rely on bundlers.  However, unlike in NodeJS, the browser cannot try a bunch of different paths to find a file, it must fetch the correct file in a single standard HTTP request on the first try.  This means that when you do `import { Foo } from './foo'`, the browser will try to fetch a file at the path `http://my-domain/path/foo`.  Unless you configure your HTTP server to serve up JS files when no extension is provided, the web server will likely not find any file at that path because the actual file lives  at `http://my-domain/path/foo.js`.  One potential solution to this problem is to write your TS like `import { Foo } from './foo.js'`.  TypeScript is clever enough that it will realize that you _really_ meant `foo.ts` during compilation, and it will successfully find type information.  However, ts-node is [not clever enough](https://github.com/TypeStrong/ts-node/issues/783) to handle these faux paths so if you want a library that works in either ts-node or browser you are out of luck.

The hope is that eventually TypeScript will [add support for appending the `.js` extension as a compiler option](https://github.com/microsoft/TypeScript/issues/16577), but for the time being we'll have to do it ourself.

# Usage
1. Install `typescript`, `ttypescript`, and this transformer into your project if you don't already have them.
	```
	npm install --save-dev typescript
	npm install --save-dev ttypescript
	npm install --save-dev @zoltu/typescript-transformer-append-js-extension
	```
1. Add the transformer to your es2015 module `tsconfig-es.json` (or whatever `tsconfig.json` you are using to build es2015 modules)
	```json
	// tsconfig-es.json
	{
		"compilerOptions": {
			"module": "es2015",
			"plugins": [
				{ "transform": "@zoltu/typescript-transformer-append-js-extension/output/index.js" }
			]
		},
	}
	```
1. Write some typescript with normal imports
	```typescript
	// foo.ts
	export function foo() { console.log('foo') }
	```
	```typescript
	// index.ts
	import { foo } from './foo'
	foo()
	```
1. Compile using `ttsc`
	```
	npx ttsc --project tsconfig-es.json
	```
