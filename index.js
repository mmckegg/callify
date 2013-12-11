var Through = require('through')
var falafel = require('falafel')
var syntaxError = require('syntax-error')

module.exports = function(transforms){
  return function( file ){

    if (/\.json$/.test(file)) return Through();

    var content = ''

    return Through(function(data){ 
      content += data 
    }, function(){
      try {
        this.queue(transform(content, file))
      } catch (ex){
        var error = syntaxError(content, file) || ex
        this.emit('error', error)
      }
      this.queue(null)
    })

  }

  function transform(content, file){
    var requires = {}

    var params = {
      file: file,
      requires: requires
    }

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
          var transform = transforms[requires[calls[0]]]
          if (typeof transform === 'function'){
            transform(node, {file: file, requires: requires, calls: calls})
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