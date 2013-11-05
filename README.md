callify
===

Create browserify transforms that change or inline external module function calls.

Uses [falafel](https://github.com/substack/node-falafel) for scanning calls to specified modules.

[![NPM](https://nodei.co/npm/callify.png?compact=true)](https://nodei.co/npm/callify/)

## Example

Find all fs.readFileSync calls and inline the result:

```js
// transform.js

var callify = require('callify')
var staticEval = require('static-eval')

module.exports = callify({

  // specify in the module names you want to hook and what to do with the node
  
  'fs': function(node, params){
    if (params.calls[1] === 'readFileSync'){
      var args = getArgs(node, params)
      var content = readFileSync.apply(this, args)
      node.update(JSON.stringify(content))
    }
  }
})

function getArgs(node, params){
  return node.arguments.map(function(arg){ 
    return staticEval(arg, {
      __filename: params.file,
      __dirname: path.dirname(params.file)
    }) 
  })
}
```

```js
// entry.js
var filesys = require("fs")
var content = filesys.readFileSync(__dirname + "/content.txt", "utf8")
```

```bash
$ browserify entry.js -t ./transform.js > output.js
```

```js
// output.js
var filesys = require("fs")
var content = "file contents"
```