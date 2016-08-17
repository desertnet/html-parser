# html-parser


This HTML parser and validator is not a strict HTML parser in the vein of the XHTML strict validators of old. Instead, it aims to parse HTML as browsers do and only surface errors that are likely to confuse browsers or that are indicative of a confused HTML author.

## Installation

```sh
npm install --save @desertnet/html-parser
```

## Usage

```javascript
const HTMLParser = require('@desertnet/html-parser')

const html = `
<p>
  <b>I forgot to close my b tag.
</p>

<p>
  I&npsb;misspelled the no-break-space entity.
</p>
`.trim()

const errors = HTMLParser.validate(html)

errors.forEach(error => {
  console.log(`${error.message} (line: ${error.line}, column: ${error.column})`)
})
```

Outputs:

```
Could not find closing tag for "<b>". (line: 2, column: 3)
Unexpected closing tag, "</p>". Expected closing tag for "<b>". (line: 3, column: 1)
Invalid HTML entity name for "&npsb;". (line: 6, column: 5)
```

## API

### HTMLParser.validate(htmlString)

Static method on `HTMLParser` constructor. It parses the HTML fragment in `htmlString` and returns an array of `HTMLParseError`s. If there were no errors, an empty array is returned.

### HTMLParser

The `HTMLParser` constructor. It takes no arguments.

```javascript
const parser = new HTMLParser()
```

#### .parse(htmlString)

Parses the HTML fragment in `htmlString` and returns an `HTMLNode` object containing the parsed HTML.

```javascript
const parseTree = parser.parse('<h1>Hello world!</h1>')
```

### HTMLParseError

Represents an error discovered durning parsing of an HTML fragment.

```javascript
parseTree.errors.forEach(error => {
  console.log(`${error.message} (line: ${error.line}, column: ${error.column})`)
})
```

#### .message

Property that is a string containing an English description of the error.

#### .startIndex

Property that is a number indicating the index into the source string where the error begins.

#### .endIndex

Property that is a number indicating the index into the source string where the error ends.

#### .line

Property that is a number indicating the line number where the error begins. Line numbers being at `1`, not `0`.

#### .column

Property that is a number indicating the column of the line where the error begins. Columns also begin at `1`, not `0`.

### HTMLNode

The base class for all node types. Returned by `HTMLParser`'s `.parse` method.

```javascript
console.log(indentedNodeList(parseTree))

function indentedNodeList (node, indent = '') {
  let str = ''
  if (node.children) {
    str += node.children.reduce((prev, child) => {
      return prev + indentedNodeList(child, `${indent}  `)
    }, '')
  }
  return `${indent}${node.type}\n${str}`
}
```

#### .type

Property indicating the type of node. It will be one of the following strings:

  - `ROOT`: Root node of the tree.
  - `TAG`: An HTML tag.
  - `ATTRIBUTE`: An attribute of an HTML tag.
  - `TEXT`: A text content node.
  - `ENTITY`: An HTML entity (i.e. `&amp;`)
  - `COMMENT`: An HTML comment tag.
  - `CLOSETAG`: A closing HTML tag.

#### .children

Property that is either `null`, or an array of `HTMLNode`s that are the node's children.

#### .indexRange

Property that, if non-null, will be an array of two numbers. The first is the index of the source string where the node begins, and the second is the index of the source string where the node ends.

#### .errors

Property that is an array of `HTMLParseError`s associated with this node and its descendants.

#### .ownErrors

Property that is an array of `HTMLParseError`s associated with only this node (not its descendants).

#### .tagName

On `TAG` and `CLOSETAG` type nodes, this is a string of the lowercased tag name.

#### .attributes

On `TAG` type nodes, this is an array of `ATTRIBUTE` nodes that belong to the tag.

#### .closingTag

On `TAG` type nodes, this is a `CLOSETAG` node, if a closing tag for this node was found.
