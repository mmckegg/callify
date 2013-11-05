var test = require('tape')
var callify = require('../')

var staticEval = require('static-eval')
var readFileSync = require('fs').readFileSync
var path = require('path')

test("replace fs.readFileSync calls with file content", function(t){

  var Transform = callify({
    'fs': function(node, params){
      if (params.calls[1] === 'readFileSync'){
        var args = getArgs(node, params)
        console.log(args)
        var content = readFileSync.apply(this, args)
        node.update(JSON.stringify(content))
      }
    }
  })

  var transform = Transform(__filename)

  transform.on('data', function(data){
    t.equal(data, 'var filesys = require("fs")\nvar content = "file contents"\n')
    t.end()
  })

  transform.write('var filesys = require("fs")\n')
  transform.write('var content = filesys.readFileSync(__dirname + "/content.txt", "utf8")\n')
  transform.end()

})

function getArgs(node, params){
  return node.arguments.map(function(arg){ 
    return staticEval(arg, {
      __filename: params.file,
      __dirname: path.dirname(params.file)
    }) 
  })
}