import TagNode from '../lib/Node/TagNode'
import HTMLParseError from '../lib/HTMLParseError'
import {expect} from 'chai'

describe("HTMLParseError", function () {
  var error, token;

  beforeEach(function () {
    error = new HTMLParseError();
    token = {type: "foo", value: "bar", index: 8, line: 3, column: 2};
  })

  describe("#addToken", function () {
    it("should correctly set the startIndex", function () {
      error.addToken(token);
      expect(error.startIndex()).to.be.equal(8);
    })

    it("should correctly set the line", function () {
      error.addToken(token);
      expect(error.line()).to.be.equal(3);
    })

    it("should correctly set the column", function () {
      error.addToken(token);
      expect(error.column()).to.be.equal(2);
    })

    it("should correctly set the endIndex", function () {
      error.addToken(token);
      expect(error.endIndex()).to.be.equal(11);
    })
  })

  describe("#addTokensFromNode", function () {
    it("should add tokens from the given node", function () {
      var node = new TagNode();
      node.addToken(token);
      error.addTokensFromNode(node);
      expect(node.tokens()).to.deep.equal([token]);
    })
  })
})
