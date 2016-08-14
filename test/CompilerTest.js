import Instr from '../lib/Instr'
import Op from '../lib/Op'
import Compiler from '../lib/Compiler'

describe("Compiler", function () {
  var compiler, token;

  beforeEach(function () {
    jasmine.addMatchers({
      "toMatchCodeDescription": function (util, customEqualityTesters) {
        return {
          "compare": function (actual, expected) {
            var actualCode = /** @type {Array.<Op>} */ (actual);
            var actualCodeDesc = actualCode.join(" ");

            if (expected === undefined) {
              expected = "";
            }

            var result = {};

            result["pass"] = actualCodeDesc === expected;

            if (result["pass"]) {
              result["message"] = "Expected '" + actualCodeDesc + "' not to match '" + expected + "'";
            }
            else {
              result["message"] = "Expected '" + actualCodeDesc + "' to match '" + expected + "'";
            }

            return result;
          }
        }
      }
    })

    compiler = new Compiler();
    token = makeTok("text", "foo");
    resetMakeTok();
  })

  afterEach(function () {
    resetMakeTok();
  })

  describe("#generateCodeForTokenInDialect", function () {
    it("should throw an error when passed an unexpected dialect", function () {
      expect(function () {
        compiler.generateCodeForTokenInDialect(token, "bar");
      }).toThrow();
    })

    it("should call generateCodeForContentToken when passed a token in the content dialect", function () {
      compiler.generateCodeForContentToken = spyOnMethods(compiler, compiler.generateCodeForContentToken);
      compiler.generateCodeForTokenInDialect(token, "content");
      expect(compiler.generateCodeForContentToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForCommentToken when passed a token in the comment dialect", function () {
      compiler.generateCodeForCommentToken = spyOnMethods(compiler, compiler.generateCodeForCommentToken);
      compiler.generateCodeForTokenInDialect(token, "comment");
      expect(compiler.generateCodeForCommentToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForEntityToken when passed a token in the entity dialect", function () {
      compiler.generateCodeForEntityToken = spyOnMethods(compiler, compiler.generateCodeForEntityToken);
      compiler.generateCodeForTokenInDialect(token, "entity");
      expect(compiler.generateCodeForEntityToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForTagToken when passed a token in the tag dialect", function () {
      compiler.generateCodeForTagToken = spyOnMethods(compiler, compiler.generateCodeForTagToken);
      compiler.generateCodeForTokenInDialect(token, "tag");
      expect(compiler.generateCodeForTagToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForAttributeToken when passed a token in the attribute dialect", function () {
      compiler.generateCodeForAttributeToken = spyOnMethods(compiler, compiler.generateCodeForAttributeToken);
      compiler.generateCodeForTokenInDialect(token, "attribute");
      expect(compiler.generateCodeForAttributeToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForAttributeValueToken when passed a token in the attributeValue dialect", function () {
      compiler.generateCodeForAttributeValueToken = spyOnMethods(compiler, compiler.generateCodeForAttributeValueToken);
      compiler.generateCodeForTokenInDialect(token, "attributeValue");
      expect(compiler.generateCodeForAttributeValueToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForAttributeValueQuotedToken when passed a token in the attributeValueQuoted dialect", function () {
      compiler.generateCodeForAttributeValueQuotedToken = spyOnMethods(compiler, compiler.generateCodeForAttributeValueQuotedToken);
      compiler.generateCodeForTokenInDialect(token, "attributeValueQuoted");
      expect(compiler.generateCodeForAttributeValueQuotedToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForCloseTagToken when passed a token in the closeTag dialect", function () {
      compiler.generateCodeForCloseTagToken = spyOnMethods(compiler, compiler.generateCodeForCloseTagToken);
      compiler.generateCodeForTokenInDialect(token, "closeTag");
      expect(compiler.generateCodeForCloseTagToken).toHaveBeenCalledWith(token);
    })

    it("should call generateCodeForRawtextToken when passed a token in the rawtext dialect", function () {
      compiler.generateCodeForRawtextToken = spyOnMethods(compiler, compiler.generateCodeForRawtextToken);
      compiler.generateCodeForTokenInDialect(token, "rawtext");
      expect(compiler.generateCodeForRawtextToken).toHaveBeenCalledWith(token);
    })
  })

  describe("#generateCodeForContentToken", function () {
    it("should return correct code for a text token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("text", "foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:TEXT ADD_TOKEN:text POP_NODE");
    })

    it("should return correct code for an error token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("error", "foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:TEXT ADD_TOKEN:error POP_NODE");
    })

    it("should return correct code for a commentStart token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("commentStart", "<!--"));
      expect(code).toMatchCodeDescription("PUSH_NODE:CMNT ADD_TOKEN:commentStart");
    })

    it("should call pushDialect when passed a commentStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForContentToken(makeTok("commentStart", "<!--"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("comment");
    })

    it("should return correct code for an entityStart token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("entityStart", "&"));
      expect(code).toMatchCodeDescription("PUSH_NODE:ENT ADD_TOKEN:entityStart");
    })

    it("should call pushDialect when passed an entityStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForContentToken(makeTok("entityStart", "&"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("entity");
    })

    it("should return correct code for a tagStart token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("tagStart", "<foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:TAG ADD_TOKEN:tagStart");
    })

    it("should call pushDialect when passed a tagStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForContentToken(makeTok("tagStart", "<foo"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("tag");
    })

    it("should return the correct code for a closeTagStart token", function () {
      var code = compiler.generateCodeForContentToken(makeTok("closeTagStart", "</foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:CLOSE ADD_TOKEN:closeTagStart");
    })

    it("should call pushDialect when passed a closeTagStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForContentToken(makeTok("closeTagStart", "</foo"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("closeTag");
    })
  })

  describe("#generateCodeForCommentToken", function () {
    it("should return correct code for a text token", function () {
      var code = compiler.generateCodeForCommentToken(makeTok("text", "foo"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:text");
    })

    it("should return correct code for a dash token", function () {
      var code = compiler.generateCodeForCommentToken(makeTok("dash", "foo"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:dash");
    })

    it("should return correct code for a commentEnd token", function () {
      var code = compiler.generateCodeForCommentToken(makeTok("commentEnd", "-->"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:commentEnd POP_NODE");
    })

    it("should call popDialect when passed a commentEnd token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForCommentToken(makeTok("commentEnd", "-->"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })
  })

  describe("#generateCodeForEntityToken", function () {
    "hex dec named".split(" ").forEach(function (tokenType) {
      it("should return correct code for a " + tokenType + " token", function () {
        var code = compiler.generateCodeForEntityToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("ADD_TOKEN:" + tokenType);
      })
    })

    "entityEnd error".split(" ").forEach(function (tokenType) {
      it("should return correct code for an " + tokenType + " token", function () {
        var code = compiler.generateCodeForEntityToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("ADD_TOKEN:" + tokenType + " POP_NODE");
      })

      it("should call popDialect when passed an " + tokenType + " token", function () {
        compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
        compiler.generateCodeForEntityToken(makeTok(tokenType, "foo"));
        expect(compiler.popDialect).toHaveBeenCalledWith();
      })
    })
  })

  describe("#generateCodeForTagToken", function () {
    it("should return correct code for a tagEnd token", function () {
      var code = compiler.generateCodeForTagToken(makeTok("tagEnd", ">"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:tagEnd POP_NODE");
    })

    it("should call popDialect when passed a tagEnd token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForTagToken(makeTok("tagEnd", ">"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return correct code for a whitespace token", function () {
      var code = compiler.generateCodeForTagToken(makeTok("whitespace", "  "));
      expect(code).toMatchCodeDescription("ADD_TOKEN:whitespace");
    })

    it("should return correct code for an attributeStart token", function () {
      var code = compiler.generateCodeForTagToken(makeTok("attributeStart", "foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:ATTR ADD_TOKEN:attributeStart");
    })

    it("should call pushDialect when passed an attributeStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForTagToken(makeTok("attributeStart", "foo"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("attribute");
    })

    it("should set its scanner's dialect to attribute after being passed an attributeStart token", function () {
      compiler.generateCodeForTagToken(makeTok("attributeStart", "foo"));
      expect(compiler.currentDialect()).toBe("attribute");
    })

    it("should return correct code for a selfClose token", function () {
      var code = compiler.generateCodeForTagToken(makeTok("selfClose", "/"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:selfClose");
    })

    it("should return correct code for an error token", function () {
      var code = compiler.generateCodeForTagToken(makeTok("error", "'"));
      expect(code).toMatchCodeDescription("PUSH_NODE:ATTR ADD_TOKEN:error");
    })
  })

  describe("#generateCodeForAttributeToken", function () {
    it("should return the correct code for whitespace token", function () {
      var code = compiler.generateCodeForAttributeToken(makeTok("whitespace", "  "));
      expect(code).toMatchCodeDescription("ADD_TOKEN:whitespace");
    })

    it("should return the correct code for tagEnd token", function () {
      var code = compiler.generateCodeForAttributeToken(makeTok("tagEnd", ">"));
      expect(code).toMatchCodeDescription("POP_NODE ADD_TOKEN:tagEnd POP_NODE");
    })

    it("should call popDialect twice when passed a tagEnd token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeToken(makeTok("tagEnd", ">"));
      expect(compiler.popDialect.calls.count()).toBe(2);
    })

    it("should return the correct code for a selfClose token", function () {
      var code = compiler.generateCodeForAttributeToken(makeTok("selfClose", "/"));
      expect(code).toMatchCodeDescription("POP_NODE ADD_TOKEN:selfClose");
    })

    it("should call popDialect when passed a selfClose token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeToken(makeTok("selfClose", "/"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    "attributeValueStart attributeValueQuotedStart".split(" ").forEach(function (tokenType) {
      it("should return the correct code for an " + tokenType + " token", function () {
        var code = compiler.generateCodeForAttributeToken(makeTok(tokenType, "="));
        expect(code).toMatchCodeDescription("ADD_TOKEN:" + tokenType);
      })

      it("should call popDialect and pushDialect when passed an " + tokenType + " token", function () {
        compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
        compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
        compiler.generateCodeForAttributeToken(makeTok(tokenType, "="));
        expect(compiler.popDialect).toHaveBeenCalledWith();
        expect(compiler.pushDialect).toHaveBeenCalledWith(tokenType.replace(/Start$/, ""));
      })

      it("should set its scanner's dialect to " + tokenType.replace(/Start$/, "") + " after being passed an " + tokenType + " token", function () {
        compiler.generateCodeForAttributeToken(makeTok(tokenType, "="));
        expect(compiler.currentDialect()).toBe(tokenType.replace(/Start$/, ""));
      })
    })

    it("should set the expected attribute end token to dquo when passed an attributeValueQuotedStart with a double quote", function () {
      compiler.generateCodeForAttributeToken(makeTok("attributeValueQuotedStart", '="'));
      expect(compiler.expectedAttributeValueEndTokenType()).toBe("dquo");
    })

    it("should set the expected attribute end token to squo when passed an attributeValueQuotedStart with a single quote", function () {
      compiler.generateCodeForAttributeToken(makeTok("attributeValueQuotedStart", "='"));
      expect(compiler.expectedAttributeValueEndTokenType()).toBe("squo");
    })

    "attributeStart error".split(" ").forEach(function (tokenType) {
      it("should return the correct code for an " + tokenType + " token", function () {
        var code = compiler.generateCodeForAttributeToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("POP_NODE PUSH_NODE:ATTR ADD_TOKEN:" + tokenType);
      })
    })
  })

  describe("#generateCodeForAttributeValueToken", function () {
    it("should return the correct code for a whitespace token", function () {
      var code = compiler.generateCodeForAttributeValueToken(makeTok("whitespace", "  "));
      expect(code).toMatchCodeDescription("POP_NODE ADD_TOKEN:whitespace");
    })

    it("should call popDialect when passed a whitespace token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeValueToken(makeTok("whitespace", "  "));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return the correct code for an entityStart token", function () {
      var code = compiler.generateCodeForAttributeValueToken(makeTok("entityStart", "&foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:ENT ADD_TOKEN:entityStart");
    })

    it("should push the entity dialect when passed an entityStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForAttributeValueToken(makeTok("entityStart", "&foo"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("entity");
    })

    it("should return the correct code for a tagEnd token", function () {
      var code = compiler.generateCodeForAttributeValueToken(makeTok("tagEnd", ">"));
      expect(code).toMatchCodeDescription("POP_NODE ADD_TOKEN:tagEnd POP_NODE");
    })

    it("should call popDialect twice when passed a tagEnd token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeValueToken(makeTok("tagEnd", ">"));
      expect(compiler.popDialect.calls.count()).toBe(2);
    })

    "text error".split(" ").forEach(function (tokenType) {
      it("should return the correct code for a " + tokenType + " token", function () {
        var code = compiler.generateCodeForAttributeValueToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("ADD_TOKEN:" + tokenType);
      })
    })
  })

  describe("#generateCodeForAttributeValueQuotedToken", function () {
    it("should return the correct code for a dquo token when expecting dquo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("dquo");
      var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok("dquo", '"'));
      expect(code).toMatchCodeDescription("ADD_TOKEN:dquo POP_NODE");
    })

    it("should call popDialect when passed a dquo token when expecting dquo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("dquo");
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeValueQuotedToken(makeTok("dquo", '"'));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return the correct code for a dquo token when expecting squo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("squo");
      var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok("dquo", '"'));
      expect(code).toMatchCodeDescription("ADD_TOKEN:text");
    })

    it("should return the correct code for a squo token when expecting squo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("squo");
      var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok("squo", "'"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:squo POP_NODE");
    })

    it("should call popDialect when passed a squo token when expecting squo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("squo");
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForAttributeValueQuotedToken(makeTok("squo", "'"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return the correct code for a squo token when expecting dquo as the attribute value end token type", function () {
      compiler.setExpectedAttributeValueEndTokenType("dquo");
      var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok("squo", "'"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:text");
    })

    it("should return the correct code for an entityStart token", function () {
      var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok("entityStart", "&foo"));
      expect(code).toMatchCodeDescription("PUSH_NODE:ENT ADD_TOKEN:entityStart");
    })

    it("should call pushDialect when passed an entityStart token", function () {
      compiler.pushDialect = spyOnMethods(compiler, compiler.pushDialect);
      compiler.generateCodeForAttributeValueQuotedToken(makeTok("entityStart", "&foo"));
      expect(compiler.pushDialect).toHaveBeenCalledWith("entity");
    })

    "text error".split(" ").forEach(function (tokenType) {
      it("should return the correct code for a " + tokenType + " token", function () {
        var code = compiler.generateCodeForAttributeValueQuotedToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("ADD_TOKEN:" + tokenType);
      })
    })
  })

  describe("#generateCodeForCloseTagToken", function () {
    it("should return the correct code for a whitespace token", function () {
      var code = compiler.generateCodeForCloseTagToken(makeTok("whitespace", "  "));
      expect(code).toMatchCodeDescription("ADD_TOKEN:whitespace");
    })

    it("should return the correct code for an error token", function () {
      var code = compiler.generateCodeForCloseTagToken(makeTok("error", "foo"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:error");
    })

    it("should call popDialect when passed a tagEnd token", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.generateCodeForCloseTagToken(makeTok("tagEnd", ">"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return the correct code for a tagEnd token", function () {
      var code = compiler.generateCodeForCloseTagToken(makeTok("tagEnd", ">"));
      expect(code).toMatchCodeDescription("ADD_TOKEN:tagEnd POP_NODE");
    })
  })

  describe("#generateCodeForRawtextToken", function () {
    it("should return the correct code for a closeTag that matches the opening tag", function () {
      compiler.setExpectedRawtextClosingTagName("script");
      var code = compiler.generateCodeForRawtextToken(makeTok("closeTag", "</script>"));
      expect(code).toMatchCodeDescription("PUSH_NODE:CLOSE ADD_TOKEN:closeTag POP_NODE");
    })

    it("should call popDialect when passed a closeTag that matches the openening tag", function () {
      compiler.popDialect = spyOnMethods(compiler, compiler.popDialect);
      compiler.setExpectedRawtextClosingTagName("script");
      compiler.generateCodeForRawtextToken(makeTok("closeTag", "</script>"));
      expect(compiler.popDialect).toHaveBeenCalledWith();
    })

    it("should return the correct code for a closeTag token that does not match the opening tag", function () {
      compiler.setExpectedRawtextClosingTagName("script");
      var code = compiler.generateCodeForRawtextToken(makeTok("closeTag", "</div>"));
      expect(code).toMatchCodeDescription("PUSH_NODE:TEXT ADD_TOKEN:closeTag POP_NODE");
    })

    "text lt".split(" ").forEach(function (tokenType) {
      it("should return the correct code for an " + tokenType + " token", function () {
        var code = compiler.generateCodeForRawtextToken(makeTok(tokenType, "foo"));
        expect(code).toMatchCodeDescription("PUSH_NODE:TEXT ADD_TOKEN:" + tokenType + " POP_NODE");
      })
    })
  })

  describe("#expectedRawtextClosingTagName", function () {
    it("should always return the lowercase name", function () {
      compiler.setExpectedRawtextClosingTagName("FOO");
      expect(compiler.expectedRawtextClosingTagName()).toBe("foo");
    })
  })

  // ------------------------------------------------------------
  // Helper functions for testing opsForTokenInDialect functions.
  // ------------------------------------------------------------

  var makeTokOffset = 0;

  function makeTok (type, value) {
    return new Foundation.Scanner.Token(type, value, makeTokOffset, 1, makeTokOffset);
  }

  function resetMakeTok () {
    makeTokOffset = 0;
  }

  /** @param {...*} foo */
  function makeOps (foo) {
    var args = Array.prototype.slice.call(arguments, 0);
    return args.map(function (opDef) {
      var op = new Op(opDef[0] || opDef);
      if (Array.isArray(opDef)) {
        if (op.instruction() === Instr.PUSH_NODE) {
          op.setNode(opDef[1]);
        }
        else if (op.instruction() === Instr.ADD_TOKEN) {
          op.setToken(opDef[1]);
        }
        return op;
      }
      return op;
    });
  }
})
