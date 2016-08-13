describe("Foundation.HTML.Parser", function () {
  var parser;

  beforeEach(function () {
    parser = new Foundation.HTML.Parser();
  })

  describe("#parse", function () {
    var parse = function (html) {
      return parser.parse(html).toString();
    };

    it("should parse the empty string", function () {
      expect(parse("")).toBe("");
    })

    it("should parse a text node", function () {
      expect(parse("hi")).toBe("'hi'");
    })

    it("should parse a comment", function () {
      expect(parse("<!-- hiya -->")).toBe("<!-- hiya -->");
    })

    it("should parse a comment with dashes", function () {
      expect(parse("<!-- hello--world -->")).toBe("<!-- hello--world -->");
    })

    it("should parse a named HTML entity", function () {
      expect(parse("&gt;")).toBe("&(gt);");
    })

    it("should parse a hex HTML entity", function () {
      expect(parse("&#x20AC;")).toBe("&(#x20AC);");
    })

    it("should parse a lone ampersand", function () {
      expect(parse("lone & ampersand")).toBe("'lone ''&'' ampersand'");
    })

    it("should parse a lone ampersand inside an attribute value", function () {
      expect(parse('<a href="http://example.com/foo?a=1&b=2"></a>'))
        .toBe("<a href='http://example.com/foo?a=1&b=2'></a>")
    })

    it("should parse a lone >", function () {
      expect(parse("lone > gt")).toBe("'lone ''>'' gt'");
    })

    it("should parse a void tag", function () {
      expect(parse("<br>")).toBe("<br>");
    })

    it("should parse a tag with an attribute delimited by double quotes", function () {
      expect(parse('<br clear="right">')).toBe("<br clear='right'>");
    })

    it("should parse a tag with two attributes", function () {
      expect(parse('<br clear="right"  style="foo:bar">')).toBe("<br clear='right' style='foo:bar'>");
    })

    it("should parse an empty attribute", function () {
      expect(parse('<hr prop>')).toBe("<hr prop=''>");
    })

    it("should parse a self closing void tag", function () {
      expect(parse('<hr />')).toBe("<hr>");
    })

    it("should parse a lone closing tag", function () {
      expect(parse('</div>')).toBe("</div>");
    })

    it("should parse a simple div tag", function () {
      expect(parse('<div>foo</div>')).toBe("<div>'foo'</div>");
    })

    it("should avoid throwing ScannerError on a `&` followed by whitespace", function () {
      expect(function () { parser.parse("&C\n") }).not.toThrow();
    })
  })

  describe("validate", function () {
    var validate = Foundation.HTML.Parser.validate;

    it("should consider header tags valid HTML", function () {
      expect(validate("<h1>foo</h1>")).toEqual([]);
    })
  })

  describe("#finalize", function () {
    var tagNode;

    beforeEach(function () {
      tagNode = new Foundation.HTML.Parser.Node.Tag();
      tagNode.setTagName("br");
    })

    it("should unfinished nodes from the stack", function () {
      parser.pushNode(tagNode);
      parser.finalize();
      expect(function () { parser.currentNode() }).toThrow();
      expect(parser.currentOpenElement()).toBe(parser.parseTree());
    })

    it("should move open elements into the parse tree", function () {
      parser.pushOpenElement(tagNode);
      parser.finalize();
      expect(parser.parseTree().lastChild()).toBe(tagNode);
    })

    it("should add errors to the topmost unfinished node", function () {
      var attrNode = new Foundation.HTML.Parser.Node.Attr();
      parser.pushNode(tagNode);
      parser.pushNode(attrNode);
      parser.finalize();
      expect(tagNode.ownErrors().length).toBe(0);
      expect(attrNode.ownErrors().length).toBe(1);
    })
  })

  describe("#executeOp", function () {
    it("should call popNode when passed a POP_NODE op", function () {
      parser.popNode = spyOnMethods(parser, parser.popNode);
      var op = new Foundation.HTML.Parser.Op(Foundation.HTML.Parser.Instr.POP_NODE);
      parser.executeOp(op);
      expect(parser.popNode).toHaveBeenCalled();
    })

    it("should call pushNode when passed a PUSH_NODE op", function () {
      parser.pushNode = spyOnMethods(parser, parser.pushNode);
      var op = new Foundation.HTML.Parser.Op(Foundation.HTML.Parser.Instr.PUSH_NODE);
      var node = new Foundation.HTML.Parser.Node.Text();
      op.setNode(node);
      parser.executeOp(op);
      expect(parser.pushNode).toHaveBeenCalledWith(op.node());
    })

    it("should call node.addToken when passed a ADD_TOKEN op", function () {
      var node = new Foundation.HTML.Parser.Node.Text();
      node.addToken = spyOnMethods(node, node.addToken);

      var op = new Foundation.HTML.Parser.Op(Foundation.HTML.Parser.Instr.ADD_TOKEN);
      var tok = new Foundation.Scanner.Token("text", "foo", 0, 1, 0);
      op.setToken(tok);

      parser.pushNode(node);
      parser.executeOp(op);
      expect(node.addToken).toHaveBeenCalledWith(tok);
    })
  })

  describe("#currentNode", function () {
    it("should return the node at the top of the node stack", function () {
      var node = new Foundation.HTML.Parser.Node.Text();
      parser.pushNode(node);
      expect(parser.currentNode()).toBe(node);
    })

    it("should throw an error when the node stack is empty", function () {
      expect(function () { parser.currentNode() }).toThrow();
    })
  })

  describe("#popNode", function () {
    it("should remove the node at the top of the stack", function () {
      var node1 = new Foundation.HTML.Parser.Node.Text();
      var node2 = new Foundation.HTML.Parser.Node.Text();
      parser.pushNode(node1);
      parser.pushNode(node2);
      parser.popNode();
      expect(parser.currentNode()).toBe(node1);
    })

    it("should call the applyCompletedNode method", function () {
      parser.applyCompletedNode = spyOnMethods(parser, parser.applyCompletedNode);

      var node = new Foundation.HTML.Parser.Node.Text();
      parser.pushNode(node);
      parser.popNode();
      expect(parser.applyCompletedNode).toHaveBeenCalledWith(node);
    })

    it("should throw an error if the node stack is empty", function () {
      expect(function () { parser.popNode() }).toThrow();
    })
  })

  describe("#applyCompletedNode", function () {
    it("should add a text node to the currently open element", function () {
      var node = new Foundation.HTML.Parser.Node.Text();
      parser.applyCompletedNode(node);
      expect(parser.currentOpenElement().children().pop()).toBe(node);
    })

    it("should add an attribute node to the current tag node", function () {
      var attr = new Foundation.HTML.Parser.Node.Attr();
      parser.pushNode(new Foundation.HTML.Parser.Node.Tag());
      parser.applyCompletedNode(attr);
      expect(parser.currentNode().attributes()[0]).toBe(attr);
    })

    it("should throw an error if it attempts to add an attribute node to a non-tag node", function () {
      parser.pushNode(new Foundation.HTML.Parser.Node.Text());
      expect(function () {
        parser.applyCompletedNode(new Foundation.HTML.Parser.Node.Attr());
      }).toThrow();
    })

    it("should add void tags to the current open element", function () {
      var br = new Foundation.HTML.Parser.Node.Tag();
      br.setTagName("br");
      parser.applyCompletedNode(br);
      var openElement = parser.currentOpenElement();
      expect(openElement !== br);
      expect(openElement.lastChild()).toBe(br);
    })

    it("should push non-void tags onto the open element stack", function () {
      var div = new Foundation.HTML.Parser.Node.Tag();
      div.setTagName("div");
      parser.applyCompletedNode(div);
      expect(parser.currentOpenElement()).toBe(div);
    })

    it("should call mostRecentOpenElementWithName when passed a close tag node", function () {
      parser.mostRecentOpenElementWithName = spyOnMethods(parser, parser.mostRecentOpenElementWithName);
      var close = new Foundation.HTML.Parser.Node.CloseTag();
      close.setTagName("FOO");
      parser.applyCompletedNode(close);
      expect(parser.mostRecentOpenElementWithName).toHaveBeenCalledWith("foo");
    })

    it("should call addClosedElementToParent when passed a close tag with a matching open tag", function () {
      parser.addClosedElementToParent = spyOnMethods(parser, parser.addClosedElementToParent);

      var div = new Foundation.HTML.Parser.Node.Tag();
      div.setTagName("div");
      var closeDiv = new Foundation.HTML.Parser.Node.CloseTag();
      closeDiv.setTagName("div");

      parser.pushOpenElement(div);
      parser.applyCompletedNode(closeDiv);
      expect(parser.addClosedElementToParent).toHaveBeenCalledWith(div);
    })

    it("should call setRawtextModeForTag on the compiler object when called with a rawtext tag node", function () {
      var compiler = parser.compiler();
      compiler.setRawtextModeForTag = spyOnMethods(compiler, compiler.setRawtextModeForTag);
      var script = new Foundation.HTML.Parser.Node.Tag();
      script.setTagName("script");
      parser.applyCompletedNode(script);
      expect(compiler.setRawtextModeForTag).toHaveBeenCalledWith("script");
    })

    it("should add a closing tag node to the tag node it closes", function () {
      var div = new Foundation.HTML.Parser.Node.Tag();
      div.setTagName("div");
      var span = new Foundation.HTML.Parser.Node.Tag();
      span.setTagName("span");
      var divClose = new Foundation.HTML.Parser.Node.CloseTag();
      divClose.setTagName("div");

      parser.pushOpenElement(div);
      parser.pushOpenElement(span);
      parser.applyCompletedNode(divClose);
      expect(div.closingTag()).toBe(divClose);
    })

    it("should add a closing tag node to the current open element if there is no matching open tag", function () {
      var div = new Foundation.HTML.Parser.Node.Tag();
      div.setTagName("div");
      var spanClose = new Foundation.HTML.Parser.Node.CloseTag();
      spanClose.setTagName("span");

      parser.pushOpenElement(div);
      parser.applyCompletedNode(spanClose);
      expect(parser.currentOpenElement().lastChild()).toBe(spanClose);
    })

    it("should set an error on bogus closing tags", function () {
      var div = new Foundation.HTML.Parser.Node.Tag();
      div.setTagName("div");
      var spanClose = new Foundation.HTML.Parser.Node.CloseTag();
      spanClose.setTagName("span");

      parser.pushOpenElement(div);
      parser.applyCompletedNode(spanClose);
      expect(spanClose.ownErrors().length).toBe(1);
    })
  })

  describe("#addClosedElementToParent", function () {
    var div1, div2, div3;

    beforeEach(function () {
      div1 = new Foundation.HTML.Parser.Node.Tag();
      div1.setTagName("div");
      div2 = new Foundation.HTML.Parser.Node.Tag();
      div2.setTagName("div");
      div3 = new Foundation.HTML.Parser.Node.Tag();
      div3.setTagName("div");
    })

    it("should cause the currentOpenElement to return the closing node's parent", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.addClosedElementToParent(div2);
      expect(parser.currentOpenElement()).toBe(div1);
    })

    it("should make closed elements children of each other and the currently open element", function () {
      var closeDiv = new Foundation.HTML.Parser.Node.CloseTag();
      closeDiv.setTagName("div");

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      div1.appendChild(closeDiv);
      parser.addClosedElementToParent(div1);

      expect(parser.currentOpenElement().lastChild()).toBe(div1);
      expect(div1.lastChild()).toBe(div2);
      expect(div2.lastChild()).toBe(div3);
      expect(div3.lastChild()).toBe(null);
    })

    it("should set an error on closing tag when it closes other tags still open", function () {
      var span = new Foundation.HTML.Parser.Node.Tag();
      span.setTagName("span");
      var closeDiv = new Foundation.HTML.Parser.Node.CloseTag();
      closeDiv.setTagName("div");
      div1.appendChild(closeDiv);

      parser.pushOpenElement(div1);
      parser.pushOpenElement(span);
      parser.addClosedElementToParent(div1);
      expect(closeDiv.ownErrors().length).toBe(1);
    })

    it("should set an error on elements without closing tags", function () {
      var closeDiv = new Foundation.HTML.Parser.Node.CloseTag();
      closeDiv.setTagName("div");
      div1.appendChild(closeDiv);

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      parser.addClosedElementToParent(div1);

      expect(div1.ownErrors().length).toBe(0);
      expect(div2.ownErrors().length).toBe(1);
      expect(div3.ownErrors().length).toBe(1);
    })
  })

  describe("#popElementsToAndIncluding", function () {
    var div1, div2, div3;

    beforeEach(function () {
      div1 = new Foundation.HTML.Parser.Node.Tag();
      div1.setTagName("div");
      div2 = new Foundation.HTML.Parser.Node.Tag();
      div2.setTagName("div");
      div3 = new Foundation.HTML.Parser.Node.Tag();
      div3.setTagName("div");
    })

    it("should cause the currentOpenElement to return the closing node's parent", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.popElementsToAndIncluding(div2);
      expect(parser.currentOpenElement()).toBe(div1);
    })

    it("should throw an error when trying to find an element not on the open element stack", function () {
      parser.pushOpenElement(div1);
      expect(function () { parser.popElementsToAndIncluding(div2) }).toThrow();
    })

    it("should return the closed elements", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      var closedElements = parser.popElementsToAndIncluding(div1);

      expect(closedElements).toEqual([div3, div2, div1]);
    })
  })

  describe("#mostRecentOpenElementWithName", function () {
    it("should return the topmost element in the open element stack with a matching name", function () {
      var div1 = new Foundation.HTML.Parser.Node.Tag();
      div1.setTagName("div");
      var div2 = new Foundation.HTML.Parser.Node.Tag();
      div2.setTagName("div");
      var p = new Foundation.HTML.Parser.Node.Tag();
      p.setTagName("p");

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(p);

      expect(parser.mostRecentOpenElementWithName("div")).toBe(div2);
    })
  })

  describe("#currentOpenElement", function () {
    it("should return the root element for a brand new parser", function () {
      expect(parser.currentOpenElement()).toBe(parser.parseTree());
    })

    it("should return the top of the open element stack", function () {
      var node = new Foundation.HTML.Parser.Node.Tag();
      parser.pushOpenElement(node);
      expect(parser.currentOpenElement()).toBe(node);
    })
  })

  describe("#popOpenElement", function () {
    it("should throw an error when trying to pop the root node", function () {
      expect(function () { parser.popOpenElement() }).toThrow();
    })
  })
})
