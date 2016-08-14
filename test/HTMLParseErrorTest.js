import TagNode from '../lib/Node/TagNode'

describe("Foundation.HTML.Parser.Error", function () {
  var error, token;

  beforeEach(function () {
    error = new Foundation.HTML.Parser.Error();
    token = new Foundation.Scanner.Token("foo", "bar", 8, 3, 2);
  })

  describe("#addToken", function () {
    it("should correctly set the startIndex", function () {
      error.addToken(token);
      expect(error.startIndex()).toBe(8);
    })

    it("should correctly set the line", function () {
      error.addToken(token);
      expect(error.line()).toBe(3);
    })

    it("should correctly set the column", function () {
      error.addToken(token);
      expect(error.column()).toBe(2);
    })

    it("should correctly set the endIndex", function () {
      error.addToken(token);
      expect(error.endIndex()).toBe(11);
    })
  })

  describe("#addTokensFromNode", function () {
    it("should add tokens from the given node", function () {
      var node = new TagNode();
      node.addToken(token);
      error.addTokensFromNode(node);
      expect(node.tokens()).toEqual([token]);
    })
  })
})
