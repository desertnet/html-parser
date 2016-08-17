import {expect} from 'chai'
import {Token as ScannerToken} from '@desertnet/scanner'
import Instr from '../lib/Instr'
import Op from '../lib/Op'
import TextNode from '../lib/HTMLNode/TextNode'
import CommentNode from '../lib/HTMLNode/CommentNode'

describe("Op", function () {
  describe("#instruction", function () {
    it("should return the instruction for the parser", function () {
      var op = new Op(
        Instr.POP_NODE
      );
      expect(op.instruction()).to.be.equal(Instr.POP_NODE);
    })
  })

  describe("#setToken", function () {
    it("should throw an error if called on an op other than ADD_TOKEN", function () {
      var op = new Op(
        Instr.POP_NODE
      );
      var tok = new ScannerToken("foo", "foo", 0, 1, 0);
      expect(function () { op.setToken(tok) }).to.throw();
    })

    it("should set the token for ADD_TOKEN ops", function () {
      var op = new Op(
        Instr.ADD_TOKEN
      );
      var tok = new ScannerToken("foo", "foo", 0, 1, 0);
      op.setToken(tok);
      expect(op.token()).to.be.equal(tok);
    })
  })

  describe("#token", function () {
    it("should throw an error if called before setToken", function () {
      var op = new Op(
        Instr.ADD_TOKEN
      );
      expect(function () { op.token() }).to.throw();
    })
  })

  describe("#setNode", function () {
    var node = new CommentNode();

    it("should throw an error if called on an op other than PUSH_NODE", function () {
      var op = new Op(
        Instr.POP_NODE
      );
      expect(function () { op.setNode(node) }).to.throw();
    })

    it("should set the node for PUSH_NODE ops", function () {
      var op = new Op(
        Instr.PUSH_NODE
      );
      op.setNode(node);
      expect(op.node()).to.be.equal(node);
    })
  })

  describe("#node", function () {
    it("should throw an error when called before setNode", function () {
      var op = new Op(
        Instr.PUSH_NODE
      );
      expect(function () { op.node() }).to.throw();
    })
  })

  describe("#toString", function () {
    it("should return a string containing the instr name and node for PUSH_NODE ops", function () {
      var op = new Op(Instr.PUSH_NODE);
      op.setNode(new TextNode());
      expect(op.toString()).to.be.equal("PUSH_NODE:TEXT");
    })

    it("should return a string containing the instr name and token type for ADD_TOKEN ops", function () {
      var op = new Op(Instr.ADD_TOKEN);
      var token = new ScannerToken("text", "foo", 0, 1, 0);
      op.setToken(token);
      expect(op.toString()).to.be.equal("ADD_TOKEN:text");
    })

    it("should return a string containing just the instr name for POP_NODE ops", function () {
      var op = new Op(Instr.POP_NODE);
      expect(op.toString()).to.be.equal("POP_NODE");
    })
  })
})
