import deBaseWordPool from "./base.js";
import dePersonWordPool from "./persons.js";
import deMediaWordPool from "./media.js";
import dePlayamarWordPool from "./playamar.js";

const deWordPool = [
  ...deBaseWordPool,
  ...dePersonWordPool,
  ...deMediaWordPool,
  ...dePlayamarWordPool
];

export default deWordPool;
export { deWordPool };
