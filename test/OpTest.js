describe("Foundation.HTML.Parser.Op", function () {
  describe("#instruction", function () {
    it("should return the instruction for the parser", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.POP_NODE
      );
      expect(op.instruction()).toBe(Instr.POP_NODE);
    })
  })

  describe("#setToken", function () {
    it("should throw an error if called on an op other than ADD_TOKEN", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.POP_NODE
      );
      var tok = new Foundation.Scanner.Token("foo", "foo", 0, 1, 0);
      expect(function () { op.setToken(tok) }).toThrow();
    })

    it("should set the token for ADD_TOKEN ops", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.ADD_TOKEN
      );
      var tok = new Foundation.Scanner.Token("foo", "foo", 0, 1, 0);
      op.setToken(tok);
      expect(op.token()).toBe(tok);
    })
  })

  describe("#token", function () {
    it("should throw an error if called before setToken", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.ADD_TOKEN
      );
      expect(function () { op.token() }).toThrow();
    })
  })

  describe("#setNode", function () {
    var node = new Foundation.HTML.Parser.Node.Comment();

    it("should throw an error if called on an op other than PUSH_NODE", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.POP_NODE
      );
      expect(function () { op.setNode(node) }).toThrow();
    })

    it("should set the node for PUSH_NODE ops", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.PUSH_NODE
      );
      op.setNode(node);
      expect(op.node()).toBe(node);
    })
  })

  describe("#node", function () {
    it("should throw an error when called before setNode", function () {
      var op = new Foundation.HTML.Parser.Op(
        Instr.PUSH_NODE
      );
      expect(function () { op.node() }).toThrow();
    })
  })

  describe("#toString", function () {
    it("should return a string containing the instr name and node for PUSH_NODE ops", function () {
      var op = new Foundation.HTML.Parser.Op(Instr.PUSH_NODE);
      op.setNode(new Foundation.HTML.Parser.Node.Text());
      expect(op.toString()).toBe("PUSH_NODE:TEXT");
    })

    it("should return a string containing the instr name and token type for ADD_TOKEN ops", function () {
      var op = new Foundation.HTML.Parser.Op(Instr.ADD_TOKEN);
      var token = new Foundation.Scanner.Token("text", "foo", 0, 1, 0);
      op.setToken(token);
      expect(op.toString()).toBe("ADD_TOKEN:text");
    })

    it("should return a string containing just the instr name for POP_NODE ops", function () {
      var op = new Foundation.HTML.Parser.Op(Instr.POP_NODE);
      expect(op.toString()).toBe("POP_NODE");
    })
  })
})
