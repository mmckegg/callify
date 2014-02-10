var Through = require('through')
var falafel = require('falafel')
var syntaxError = require('syntax-error')

module.exports = function(transforms){
  return function( file ){

    if (/\.json$/.test(file)) return Through();

    var content = ''

    var tr = Through(write, end)

    function write(data){
      content += data
    }

    function end(){
      try {
        tr.queue(transform(content, file, tr))
      } catch (ex){
        var error = syntaxError(content, file) || ex
        tr.emit('error', error)
      }
      tr.queue(null)
    }

    return tr
  }

  function transform(content, file, stream){
    var requires = {}

    return falafel(content, function(node){

      // find requires
      var mod; if (mod = isRequire(node)) {
        if (mod[1] in transforms){
          requires[mod[0]] = mod[1]
        }
      }

      // transform calls
      var calls; if (calls = isCall(node)){
        if (calls[0] in requires){
          var func = transforms[requires[calls[0]]]
          if (typeof func === 'function'){
            func(node, {file: file, requires: requires, calls: calls, stream: stream})
          }
        }
      }

    }).toString()

  }
}

function isRequire (node) {
  var c = node.callee;
  var parent = node.parent

  if (c && node.type === 'CallExpression' 
    && c.type === 'Identifier' 
    && c.name === 'require'
  ){
    if ( parent.type === 'VariableDeclarator' 
      && parent.type === 'VariableDeclarator' 
      && parent.id.type === 'Identifier'
    ){
      return [parent.id.name, node.arguments[0].value]
    } else if (parent.type === 'MemberExpression' 
      && parent.property.type === 'Identifier' 
      && parent.parent.type === 'VariableDeclarator' 
      && parent.parent.type === 'VariableDeclarator' 
      && parent.parent.id.type === 'Identifier'
    ){
      return [parent.parent.id.name, node.arguments[0].value + '.' + parent.property.name]
    }
  }
}

function isCall (node) {
  if (node && node.type === 'CallExpression'){
    return getCallMembers(node.callee)
  }
}

function getCallMembers(node){
  if (node.type === 'MemberExpression' && node.property.type === 'Identifier'){
    return (getCallMembers(node.object) || []).concat(node.property.name)
  } else if (node.type === 'Identifier'){
    return [node.name]
  }
  return []
}