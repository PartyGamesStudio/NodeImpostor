import enBaseWordPool from "./base.js";
import enPersonWordPool from "./persons.js";
import enMediaWordPool from "./media.js";

const enWordPool = [
  ...enBaseWordPool,
  ...enPersonWordPool,
  ...enMediaWordPool
];

export default enWordPool;
export { enWordPool };
