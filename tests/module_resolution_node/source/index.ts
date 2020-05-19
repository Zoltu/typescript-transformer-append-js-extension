import { foo } from './foo';
import { bar } from './bar.js';
import { baz as baz1 } from './.baz/index';
import { baz as baz2 } from './.baz/';
import { baz as baz3 } from './.baz';
import { qux } from './qux';
import { quux } from './quux';
export { Apple, Banana, Cherry } from './multiple-types'

foo();
bar();
baz1();
baz2();
baz3();
qux();
quux();
