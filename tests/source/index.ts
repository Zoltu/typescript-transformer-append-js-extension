import { foo } from './foo'
import { bar } from './bar.js'
// NOTE: When tsconfig "moduleResolution": "node" then './.baz' -> './.baz/index.js'
//       otherwise you need to use './.baz/index'
import { baz } from './.baz'
export { foo } from "./foo"
export { bar } from "./bar.js"
export { baz }
export { Apple, Banana, Cherry } from './multiple-types'

foo()
bar()
baz()
