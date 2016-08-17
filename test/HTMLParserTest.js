import chai, {expect} from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import HTMLParser from '../lib/HTMLParser'
import Instr from '../lib/Instr'
import Op from '../lib/Op'
import TagNode from '../lib/HTMLNode/TagNode'
import TextNode from '../lib/HTMLNode/TextNode'
import AttrNode from '../lib/HTMLNode/AttrNode'
import CloseTagNode from '../lib/HTMLNode/CloseTagNode'

chai.use(sinonChai)

describe("HTMLParser", function () {
  var parser;

  beforeEach(function () {
    parser = new HTMLParser();
  })

  describe("#parse", function () {
    var parse = function (html) {
      return parser.parse(html).toString();
    };

    it("should parse the empty string", function () {
      expect(parse("")).to.be.equal("");
    })

    it("should parse a text node", function () {
      expect(parse("hi")).to.be.equal("'hi'");
    })

    it("should parse a comment", function () {
      expect(parse("<!-- hiya -->")).to.be.equal("<!-- hiya -->");
    })

    it("should parse a comment with dashes", function () {
      expect(parse("<!-- hello--world -->")).to.be.equal("<!-- hello--world -->");
    })

    it("should parse a named HTML entity", function () {
      expect(parse("&gt;")).to.be.equal("&(gt);");
    })

    it("should parse a hex HTML entity", function () {
      expect(parse("&#x20AC;")).to.be.equal("&(#x20AC);");
    })

    it("should parse a lone ampersand", function () {
      expect(parse("lone & ampersand")).to.be.equal("'lone ''&'' ampersand'");
    })

    it("should parse a lone ampersand inside an attribute value", function () {
      expect(parse('<a href="http://example.com/foo?a=1&b=2"></a>'))
        .to.be.equal("<a href='http://example.com/foo?a=1&b=2'></a>")
    })

    it("should parse a lone >", function () {
      expect(parse("lone > gt")).to.be.equal("'lone ''>'' gt'");
    })

    it("should parse a void tag", function () {
      expect(parse("<br>")).to.be.equal("<br>");
    })

    it("should parse a tag with an attribute delimited by double quotes", function () {
      expect(parse('<br clear="right">')).to.be.equal("<br clear='right'>");
    })

    it("should parse a tag with two attributes", function () {
      expect(parse('<br clear="right"  style="foo:bar">')).to.be.equal("<br clear='right' style='foo:bar'>");
    })

    it("should parse an empty attribute", function () {
      expect(parse('<hr prop>')).to.be.equal("<hr prop=''>");
    })

    it("should parse a self closing void tag", function () {
      expect(parse('<hr />')).to.be.equal("<hr>");
    })

    it("should parse a lone closing tag", function () {
      expect(parse('</div>')).to.be.equal("</div>");
    })

    it("should parse a simple div tag", function () {
      expect(parse('<div>foo</div>')).to.be.equal("<div>'foo'</div>");
    })

    it("should avoid throwing ScannerError on a `&` followed by whitespace", function () {
      expect(function () { parser.parse("&C\n") }).not.to.throw();
    })
  })

  describe("validate", function () {
    var validate = HTMLParser.validate;

    it("should consider header tags valid HTML", function () {
      expect(validate("<h1>foo</h1>")).to.deep.equal([]);
    })

    it("should not consider a correctly named entity to be an error", () => {
      expect(validate("&eacute;")).to.deep.equal([])
    })

    it("should consider a misspelled named entity an error", function () {
      const errors = validate("&foobar;")
      expect(errors.length).to.be.equal(1)
    })
  })

  describe("#finalize", function () {
    var tagNode;

    beforeEach(function () {
      tagNode = new TagNode();
      tagNode.tagName = "br";
    })

    it("should unfinished nodes from the stack", function () {
      parser.pushNode(tagNode);
      parser.finalize();
      expect(function () { parser.currentNode() }).to.throw();
      expect(parser.currentOpenElement()).to.be.equal(parser.parseTree());
    })

    it("should move open elements into the parse tree", function () {
      parser.pushOpenElement(tagNode);
      parser.finalize();
      expect(parser.parseTree().lastChild).to.be.equal(tagNode);
    })

    it("should add errors to the topmost unfinished node", function () {
      var attrNode = new AttrNode();
      parser.pushNode(tagNode);
      parser.pushNode(attrNode);
      parser.finalize();
      expect(tagNode.ownErrors.length).to.be.equal(0);
      expect(attrNode.ownErrors.length).to.be.equal(1);
    })
  })

  describe("#executeOp", function () {
    it("should call popNode when passed a POP_NODE op", function () {
      sinon.stub(parser, 'popNode');
      var op = new Op(Instr.POP_NODE);
      parser.executeOp(op);
      expect(parser.popNode).to.have.been.called;
    })

    it("should call pushNode when passed a PUSH_NODE op", function () {
      sinon.spy(parser, 'pushNode');
      var op = new Op(Instr.PUSH_NODE);
      var node = new TextNode();
      op.setNode(node);
      parser.executeOp(op);
      expect(parser.pushNode).to.have.been.calledWith(op.node());
    })

    it("should call node.addToken when passed a ADD_TOKEN op", function () {
      var node = new TextNode();
      sinon.spy(node, 'addToken');

      var op = new Op(Instr.ADD_TOKEN);
      var tok = {type: "text", value: "foo", index: 0, line: 1, column: 0};
      op.setToken(tok);

      parser.pushNode(node);
      parser.executeOp(op);
      expect(node.addToken).to.have.been.calledWith(tok);
    })
  })

  describe("#currentNode", function () {
    it("should return the node at the top of the node stack", function () {
      var node = new TextNode();
      parser.pushNode(node);
      expect(parser.currentNode()).to.be.equal(node);
    })

    it("should throw an error when the node stack is empty", function () {
      expect(function () { parser.currentNode() }).to.throw();
    })
  })

  describe("#popNode", function () {
    it("should remove the node at the top of the stack", function () {
      var node1 = new TextNode();
      var node2 = new TextNode();
      parser.pushNode(node1);
      parser.pushNode(node2);
      parser.popNode();
      expect(parser.currentNode()).to.be.equal(node1);
    })

    it("should call the applyCompletedNode method", function () {
      sinon.spy(parser, 'applyCompletedNode');

      var node = new TextNode();
      parser.pushNode(node);
      parser.popNode();
      expect(parser.applyCompletedNode).to.have.been.calledWith(node);
    })

    it("should throw an error if the node stack is empty", function () {
      expect(function () { parser.popNode() }).to.throw();
    })
  })

  describe("#applyCompletedNode", function () {
    it("should add a text node to the currently open element", function () {
      var node = new TextNode();
      parser.applyCompletedNode(node);
      expect(parser.currentOpenElement().children.pop()).to.be.equal(node);
    })

    it("should add an attribute node to the current tag node", function () {
      var attr = new AttrNode();
      parser.pushNode(new TagNode());
      parser.applyCompletedNode(attr);
      expect(parser.currentNode().attributes()[0]).to.be.equal(attr);
    })

    it("should throw an error if it attempts to add an attribute node to a non-tag node", function () {
      parser.pushNode(new TextNode());
      expect(function () {
        parser.applyCompletedNode(new AttrNode());
      }).to.throw();
    })

    it("should add void tags to the current open element", function () {
      var br = new TagNode();
      br.tagName = "br";
      parser.applyCompletedNode(br);
      var openElement = parser.currentOpenElement();
      expect(openElement !== br);
      expect(openElement.lastChild).to.be.equal(br);
    })

    it("should push non-void tags onto the open element stack", function () {
      var div = new TagNode();
      div.tagName = "div";
      parser.applyCompletedNode(div);
      expect(parser.currentOpenElement()).to.be.equal(div);
    })

    it("should call mostRecentOpenElementWithName when passed a close tag node", function () {
      sinon.spy(parser, 'mostRecentOpenElementWithName');
      var close = new CloseTagNode();
      close.tagName = "FOO";
      parser.applyCompletedNode(close);
      expect(parser.mostRecentOpenElementWithName).to.have.been.calledWith("foo");
    })

    it("should call addClosedElementToParent when passed a close tag with a matching open tag", function () {
      sinon.spy(parser, 'addClosedElementToParent');

      var div = new TagNode();
      div.tagName = "div";
      var closeDiv = new CloseTagNode();
      closeDiv.tagName = "div";

      parser.pushOpenElement(div);
      parser.applyCompletedNode(closeDiv);
      expect(parser.addClosedElementToParent).to.have.been.calledWith(div);
    })

    it("should call setRawtextModeForTag on the compiler object when called with a rawtext tag node", function () {
      var compiler = parser.compiler();
      sinon.spy(compiler, 'setRawtextModeForTag');
      var script = new TagNode();
      script.tagName = "script";
      parser.applyCompletedNode(script);
      expect(compiler.setRawtextModeForTag).to.have.been.calledWith("script");
    })

    it("should add a closing tag node to the tag node it closes", function () {
      var div = new TagNode();
      div.tagName = "div";
      var span = new TagNode();
      span.tagName = "span";
      var divClose = new CloseTagNode();
      divClose.tagName = "div";

      parser.pushOpenElement(div);
      parser.pushOpenElement(span);
      parser.applyCompletedNode(divClose);
      expect(div.closingTag()).to.be.equal(divClose);
    })

    it("should add a closing tag node to the current open element if there is no matching open tag", function () {
      var div = new TagNode();
      div.tagName = "div";
      var spanClose = new CloseTagNode();
      spanClose.tagName = "span";

      parser.pushOpenElement(div);
      parser.applyCompletedNode(spanClose);
      expect(parser.currentOpenElement().lastChild).to.be.equal(spanClose);
    })

    it("should set an error on bogus closing tags", function () {
      var div = new TagNode();
      div.tagName = "div";
      var spanClose = new CloseTagNode();
      spanClose.tagName = "span";

      parser.pushOpenElement(div);
      parser.applyCompletedNode(spanClose);
      expect(spanClose.ownErrors.length).to.be.equal(1);
    })
  })

  describe("#addClosedElementToParent", function () {
    var div1, div2, div3;

    beforeEach(function () {
      div1 = new TagNode();
      div1.tagName = "div";
      div2 = new TagNode();
      div2.tagName = "div";
      div3 = new TagNode();
      div3.tagName = "div";
    })

    it("should cause the currentOpenElement to return the closing node's parent", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.addClosedElementToParent(div2);
      expect(parser.currentOpenElement()).to.be.equal(div1);
    })

    it("should make closed elements children of each other and the currently open element", function () {
      var closeDiv = new CloseTagNode();
      closeDiv.tagName = "div";

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      div1.appendChild(closeDiv);
      parser.addClosedElementToParent(div1);

      expect(parser.currentOpenElement().lastChild).to.be.equal(div1);
      expect(div1.lastChild).to.be.equal(div2);
      expect(div2.lastChild).to.be.equal(div3);
      expect(div3.lastChild).to.be.equal(null);
    })

    it("should set an error on closing tag when it closes other tags still open", function () {
      var span = new TagNode();
      span.tagName = "span";
      var closeDiv = new CloseTagNode();
      closeDiv.tagName = "div";
      div1.appendChild(closeDiv);

      parser.pushOpenElement(div1);
      parser.pushOpenElement(span);
      parser.addClosedElementToParent(div1);
      expect(closeDiv.ownErrors.length).to.be.equal(1);
    })

    it("should set an error on elements without closing tags", function () {
      var closeDiv = new CloseTagNode();
      closeDiv.tagName = "div";
      div1.appendChild(closeDiv);

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      parser.addClosedElementToParent(div1);

      expect(div1.ownErrors.length).to.be.equal(0);
      expect(div2.ownErrors.length).to.be.equal(1);
      expect(div3.ownErrors.length).to.be.equal(1);
    })
  })

  describe("#popElementsToAndIncluding", function () {
    var div1, div2, div3;

    beforeEach(function () {
      div1 = new TagNode();
      div1.tagName = "div";
      div2 = new TagNode();
      div2.tagName = "div";
      div3 = new TagNode();
      div3.tagName = "div";
    })

    it("should cause the currentOpenElement to return the closing node's parent", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.popElementsToAndIncluding(div2);
      expect(parser.currentOpenElement()).to.be.equal(div1);
    })

    it("should throw an error when trying to find an element not on the open element stack", function () {
      parser.pushOpenElement(div1);
      expect(function () { parser.popElementsToAndIncluding(div2) }).to.throw();
    })

    it("should return the closed elements", function () {
      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(div3);
      var closedElements = parser.popElementsToAndIncluding(div1);

      expect(closedElements).to.deep.equal([div3, div2, div1]);
    })
  })

  describe("#mostRecentOpenElementWithName", function () {
    it("should return the topmost element in the open element stack with a matching name", function () {
      var div1 = new TagNode();
      div1.tagName = "div";
      var div2 = new TagNode();
      div2.tagName = "div";
      var p = new TagNode();
      p.tagName = "p";

      parser.pushOpenElement(div1);
      parser.pushOpenElement(div2);
      parser.pushOpenElement(p);

      expect(parser.mostRecentOpenElementWithName("div")).to.be.equal(div2);
    })
  })

  describe("#currentOpenElement", function () {
    it("should return the root element for a brand new parser", function () {
      expect(parser.currentOpenElement()).to.be.equal(parser.parseTree());
    })

    it("should return the top of the open element stack", function () {
      var node = new TagNode();
      parser.pushOpenElement(node);
      expect(parser.currentOpenElement()).to.be.equal(node);
    })
  })

  describe("#popOpenElement", function () {
    it("should throw an error when trying to pop the root node", function () {
      expect(function () { parser.popOpenElement() }).to.throw();
    })
  })
})
