import { foo } from './foo'
import { bar } from './bar.js'
import { baz } from './.baz/index'
export { foo } from './foo'
export { bar } from './bar.js'
export { baz }

foo()
bar()
baz()
