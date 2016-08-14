/**
 * Possible instructions used in a Op, and
 * by the parser's executeCode method.
 * @enum {string}
 */
const Instr = {
  PUSH_NODE: "PUSH_NODE",
  POP_NODE: "POP_NODE",
  ADD_TOKEN: "ADD_TOKEN"
}

export default Instr
