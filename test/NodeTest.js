describe("Foundation.HTML.Parser.Node", function () {
  var node;

  beforeEach(function () {
    node = new Foundation.HTML.Parser.Node.Root();
    node.addToken(new Foundation.Scanner.Token("text", "foo", 0, 1, 0));
    node.addToken(new Foundation.Scanner.Token("text", "bar", 3, 1, 3));
  })

  describe("#tokens", function () {
    it("should return the tokens in an array", function () {
      expect(node.tokens()).toEqual([
        new Foundation.Scanner.Token("text", "foo", 0, 1, 0),
        new Foundation.Scanner.Token("text", "bar", 3, 1, 3)
      ]);
    })
  })

  describe("#addToken", function () {
    it("should add a new parser error when an error token type is added", function () {
      var token = new Foundation.Scanner.Token("error", "foo", 45, 2, 33);
      node.addToken(token);
      var error = new Foundation.HTML.Parser.Error();
      error.addToken(token);
      expect(node.errors().shift().startIndex()).toBe(45);
    })
  })

  describe("#indexRange", function () {
    it("should return null if there are no tokens for this node", function () {
      var incompleteNode = new Foundation.HTML.Parser.Node.Root();
      expect(incompleteNode.indexRange()).toBe(null);
    })

    it("should return the range of character positions in the source string this node covers", function () {
      expect(node.indexRange()).toEqual([0, 5]);
    })
  })

  describe("#canHaveChildren", function () {
    it("should throw an error on base class", function () {
      expect(function () {
        Foundation.HTML.Parser.Node.prototype.canHaveChildren.call(node)
      }).toThrow();
    })
  })

  describe("#toString", function () {
    it("should throw an error when called on base class", function () {
      expect(function () {
        Foundation.HTML.Parser.Node.prototype.toString.call(node);
      }).toThrow();
    })
  })

  describe("#children", function () {
    it("should return a copy of the node's children array", function () {
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("foo");
      var text = new Foundation.HTML.Parser.Node.Text();
      tag.appendChild(text);
      var childrenCopy = tag.children();
      childrenCopy.pop();
      expect(tag.children()).toEqual([text]);
    })

    it("should return null when the node cannot contain children", function () {
      var text = new Foundation.HTML.Parser.Node.Text();
      expect(text.children()).toBe(null);
    })

    it("should return null when node can contian children but there are none", function () {
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("foo");
      expect(tag.children()).toBe(null);
    })
  })

  describe("#lastChild", function () {
    it("should return the last child in the node's children array", function () {
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("foo");
      var text1 = new Foundation.HTML.Parser.Node.Text();
      tag.appendChild(text1);
      var text2 = new Foundation.HTML.Parser.Node.Text();
      tag.appendChild(text2);
      var text3 = new Foundation.HTML.Parser.Node.Text();
      tag.appendChild(text3);
      expect(tag.lastChild()).toBe(text3);
    })

    it("should return null when there are no child nodes", function () {
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("foo");
      expect(tag.lastChild()).toBe(null);
    })
  })

  describe("#errors", function () {
    it("should return not only this node's errors but its childrens' too", function () {
      var error1 = new Foundation.HTML.Parser.Error();
      var error2 = new Foundation.HTML.Parser.Error();
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("div");
      node.addError(error1);
      tag.addError(error2);
      node.appendChild(tag);
      expect(node.errors()).toEqual([error1, error2]);
    })
  })
})

describe("Foundation.HTML.Parser.Node.Root", function () {
  var root;

  beforeEach(function () {
    root = new Foundation.HTML.Parser.Node.Root();
  })

  describe("#canHaveChildren", function () {
    it("should return true", function () {
      expect(root.canHaveChildren()).toBe(true);
    })
  })
})

describe("Foundation.HTML.Parser.Node.Text", function () {
  var text;

  beforeEach(function () {
    text = new Foundation.HTML.Parser.Node.Text();
    text.addToken(new Foundation.Scanner.Token("text", "foo", 0, 1, 0));
  })

  describe("#canHaveChildren", function () {
    it("should return true", function () {
      expect(text.canHaveChildren()).toBe(false);
    })
  })

  describe("#appendChild", function () {
    it("should throw an error when called a because it doesn't support children", function () {
      var node = new Foundation.HTML.Parser.Node.Root();
      expect(function () {text.appendChild(node)}).toThrow();
    })
  })

  describe("#toString", function () {
    it("should return the string for text nodes", function () {
      expect(text.toString()).toBe("'foo'");
    })
  })
})


describe("Foundation.HTML.Parser.Node.Tag", function () {
  var p, br, closeP;

  beforeEach(function () {
    p = new Foundation.HTML.Parser.Node.Tag();
    p.addToken(new Foundation.Scanner.Token("tagStart", "<p", 0, 1, 0));

    br = new Foundation.HTML.Parser.Node.Tag();
    br.addToken(new Foundation.Scanner.Token("tagStart", "<br", 0, 1, 0));

    closeP = new Foundation.HTML.Parser.Node.CloseTag();
    closeP.setTagName("p");
  })

  describe("#canHaveChildren", function () {
    it("should return true for a tag that can have children", function () {
      expect(p.canHaveChildren()).toBe(true);
    })

    it("should return false for a void tag", function () {
      expect(br.canHaveChildren()).toBe(false);
    })
  })

  describe("#addToken", function () {
    it("should set the tagName when passed a tagStart token", function () {
      expect(p.tagName()).toBe("p");
    })
  })

  describe("#appendChild", function () {
    it("should append a node to the list of child nodes", function () {
      p.appendChild(br);
      expect(p.children()).toEqual([br]);
    })

    it("should not append close tag nodes to the list of child nodes", function () {
      p.appendChild(closeP);
      expect(p.lastChild()).toBe(null);
    })

    it("should append bogus closing tags to the list of child nodes and not make it the closing tag", function () {
      var closeDiv = new Foundation.HTML.Parser.Node.CloseTag();
      closeDiv.setTagName("div");
      p.appendChild(closeDiv);
      expect(p.lastChild()).toBe(closeDiv);
      expect(p.closingTag()).toBe(null);
    })
  })

  describe("#closingTag", function () {
    it("should return null when there is no closing tag", function () {
      expect(p.closingTag()).toBe(null);
    })

    it("should return the close tag node when it has one", function () {
      p.appendChild(closeP);
      expect(p.closingTag()).toBe(closeP);
    })
  })

  describe("#toString", function () {
    it("should return a string with open and close tag for an empty p tag node", function () {
      expect(p.toString()).toBe("<p>");
    })

    it("should return a string with just open tag for void tags", function () {
      expect(br.toString()).toEqual("<br>");
    })

    it("should return a string with tag and its contents for a p tag with a text node", function () {
      var text = new Foundation.HTML.Parser.Node.Text();
      text.addToken(new Foundation.Scanner.Token("text", "foo", 0, 1, 0));
      p.appendChild(text);
      expect(p.toString()).toBe("<p>'foo'");
    })
  })

  describe("#tagName", function () {
    it("should return the lowercased version of the tag name", function () {
      var tag = new Foundation.HTML.Parser.Node.Tag();
      tag.setTagName("FOO");
      expect(tag.tagName()).toBe("foo");
    })
  })

  describe("#errors", function () {
    it("should include errors in its attributes", function () {
      var attr = new Foundation.HTML.Parser.Node.Attr();
      var error = new Foundation.HTML.Parser.Error();
      attr.addError(error);
      p.addAttribute(attr);
      expect(p.errors()).toEqual([error]);
    })

    it("should include errors in its closing tag", function () {
      var error = new Foundation.HTML.Parser.Error();
      closeP.addError(error);
      p.appendChild(closeP);
      expect(p.errors()).toEqual([error]);
    })
  })
})

describe("Foundation.HTML.Parser.Node.Attr", function () {
  var dataAttr;

  beforeEach(function () {
    dataAttr = new Foundation.HTML.Parser.Node.Attr();
    dataAttr.addToken(new Foundation.Scanner.Token("attributeStart", "data-foo", 0, 1, 0));
    dataAttr.addToken(new Foundation.Scanner.Token("text", "bar", 0, 1, 0));
  })

  describe("#canHaveChildren", function () {
    it("should return false for attribute nodes", function () {
      expect(dataAttr.canHaveChildren()).toBe(false);
    })
  })

  describe("#toString", function () {
    it("should return a string with single quotes for the attribute value", function () {
      expect(dataAttr.toString()).toBe("data-foo='bar'");
    })
  })
})

describe("Foundation.HTML.Parser.Node.Comment", function () {
  var comment;

  beforeEach(function () {
    comment = new Foundation.HTML.Parser.Node.Comment();
    comment.addToken(new Foundation.Scanner.Token("text", "hello world", 0, 1, 0));
  })

  describe("#canHaveChildren", function () {
    it("should return false for comment nodes", function () {
      expect(comment.canHaveChildren()).toBe(false);
    })
  })

  describe("#toString", function () {
    it("should reutrn the comment in a string for comment nodes", function () {
      expect(comment.toString()).toBe("<!--hello world-->");
    })
  })
})

describe("Foundation.HTML.Parser.Node.Entity", function () {
  var pooEnt;

  beforeEach(function () {
    pooEnt = new Foundation.HTML.Parser.Node.Entity();
    pooEnt.addToken(new Foundation.Scanner.Token("hex", "#128169", 0, 1, 0));
  })

  describe("#canHaveChildren", function () {
    it("should return false for entity nodes", function () {
      expect(pooEnt.canHaveChildren()).toBe(false);
    })
  })

  describe("#toString", function () {
    it("should return the &entity; string for entity nodes", function () {
      expect(pooEnt.toString()).toBe("&(#128169);");
    })
  })
})

describe("Foundation.HTML.Parser.Node.CloseTag", function () {
  var closeTag;

  beforeEach(function () {
    closeTag = new Foundation.HTML.Parser.Node.CloseTag();
    closeTag.addToken(new Foundation.Scanner.Token("closeTagStart", "</p", 0, 1, 0));
    closeTag.addToken(new Foundation.Scanner.Token("endTag", ">", 3, 1, 3));
  })

  describe("#canHaveChildren", function () {
    it("should return false for close tag nodes", function () {
      expect(closeTag.canHaveChildren()).toBe(false);
    })
  })

  describe("#toString", function () {
    it("should return the close tag string for close tag nodes", function () {
      expect(closeTag.toString()).toBe("</p>");
    })
  })

  describe("#tagName", function () {
    it("should return the lowercased version of the tag name", function () {
      var tag = new Foundation.HTML.Parser.Node.CloseTag();
      tag.setTagName("FOO");
      expect(tag.tagName()).toBe("foo");
    })
  })

  describe("#addToken", function () {
    it("should set the tagName when passed a closeTagStart token", function () {
      var closeTag = new Foundation.HTML.Parser.Node.CloseTag();
      closeTag.addToken(new Foundation.Scanner.Token("closeTagStart", "</foo", 0, 1, 0));
      expect(closeTag.tagName()).toBe("foo");
    })

    it("should set the tagName when passed a closeTag token", function () {
      var closeTag = new Foundation.HTML.Parser.Node.CloseTag();
      closeTag.addToken(new Foundation.Scanner.Token("closeTag", "</foobar>", 0, 1, 0));
      expect(closeTag.tagName()).toBe("foobar");
    })
  })
})