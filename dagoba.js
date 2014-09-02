/*
     ____  _____ _____ _____ _____ _____ 
    |    \|  _  |   __|     | __  |  _  |
    |  |  |     |  |  |  |  | __ -|     |
    |____/|__|__|_____|_____|_____|__|__|
    
    dagoba: a tiny in-memory graph database

    ex: 
    V = [ {name: 'alice'}                                         // alice gets auto-_id (prolly 1)
        , {_id: 10, name: 'bob', hobbies: ['asdf', {x:3}]}] 
    E = [ {_out: 1, _in: 10, _label: 'knows'} ]
    g = Dagoba.graph(V, E)
    
    g.addVertex({name: 'charlie', _id: 'charlie'})                // string ids are fine
    g.addVertex({name: 'delta', _id: '30'})                       // in fact they're all strings

    g.addEdge({_out: 10, _in: 30, _label: 'parent'})
    g.addEdge({_out: 10, _in: 'charlie', _label: 'knows'})

    g.v(1).out('knows').out().run()                               // returns [charlie, delta]
    
    q = g.v(1).out('knows').out().take(1)
    q.run()                                                       // returns [charlie]
    q.run()                                                       // returns [delta]    (but don't rely on result order!)
    q.run()                                                       // returns []


    Dagoba consists of two main parts: graphs and queries.
    A graph contains vertices and edges, and provides access to query initializers like g.v()
    A query contains pipes, which make up a pipeline, and a virtual machine for processing pipelines.
    There are some pipe types defined by default.
    There are also a few helper functions.
    That's all.
*/


Dagoba = {}                                                       // the namespace

Dagoba.G = {}                                                     // the prototype

Dagoba.graph = function(V, E) {                                   // the factory
  var graph = Object.create( Dagoba.G )
  graph.vertices = []                                             // fresh copies so they're not shared
  graph.edges    = []
  graph.vertexIndex = {}
  if(V && Array.isArray(V)) graph.addVertices(V)                  // arrays only, because you wouldn't
  if(E && Array.isArray(E)) graph.addEdges(E)                     // call this with singular V and E
  return graph
}

Dagoba.G.v = function() {                                         // a query initializer: g.v() -> query
  var query = Dagoba.query(this)
  query.add('vertex', [].slice.call(arguments))                   // add vertex as first query pipe
  return query
}

Dagoba.G.addVertex = function(vertex) {                           // accepts a vertex-like object, with properties
  if(!vertex._id)
    vertex._id = this.vertices.length+1                           // NOTE: this assumes no deletions
  else if(this.findVertexById(vertex._id))
    return Dagoba.onError('A vertex with that id already exists')
    
  this.vertices.push(vertex)
  this.vertexIndex[vertex._id] = vertex
  vertex._out = []; vertex._in = []                               // placeholders for edge pointers
  return vertex._id
}

Dagoba.G.addEdge = function(edge) {                               // accepts an edge-like object, with properties
  edge._in  = this.findVertexById(edge._in)
  edge._out = this.findVertexById(edge._out)
  if(!(edge._in && edge._out)) 
    return Dagoba.onError("That edge's " + (edge._in ? 'out' : 'in') + " vertex wasn't found")
    
  edge._out._out.push(edge)                                       // add edge to the edge's out vertex's out edges
  edge._in._in.push(edge)                                         // vice versa
  this.edges.push(edge)
}

Dagoba.G.addVertices = function(vertices) { vertices.forEach(this.addVertex.bind(this)) }
Dagoba.G.addEdges    = function(edges)    { edges   .forEach(this.addEdge  .bind(this)) }

Dagoba.G.findVertexById = function(vertex_id) {
  return this.vertexIndex[vertex_id] }

Dagoba.G.findVerticesByIds = function(ids) {
  return ids.length == 1 ? [].concat( this.findVertexById(ids[0]) || [] )
       : ids.map( this.findVertexById.bind(this) ).filter(Boolean) }

Dagoba.G.searchVertices = function(obj) {                         // find vertices that match obj's key-value pairs
  return this.vertices.filter(
    function(vertex) {
      return Object.keys(obj).reduce(
        function(acc, key) {
          return acc && obj[key] == vertex[key] }, true ) } ) }

Dagoba.G.findVertices = function(ids) {                           // our general vertex finding function
  return typeof ids[0] == 'object' ? this.searchVertices(ids[0])
       : ids.length == 0 ? this.vertices.slice()                  // OPT: slice is costly with lots of vertices
       : this.findVerticesByIds(ids) }

Dagoba.G.findEdgeById = function(edge_id) {                       // OPT: this doesn't short circuit
  return this.edges.filter(function(edge) {return edge._id == edge_id})[0]}

Dagoba.G.findOutEdges = function(vertex) { return vertex._out; }
Dagoba.G.findInEdges  = function(vertex) { return vertex._in;  }

Dagoba.G.toString = function() {                                  // kids, don't hand code JSON
  return '{"V":' + JSON.stringify(this.vertices, Dagoba.cleanvertex)
       + ',"E":' + JSON.stringify(this.edges,    Dagoba.cleanedge) 
       + '}' }

Dagoba.fromString = function(str) {                               // another graph constructor
  var obj = JSON.parse(str)
  return Dagoba.graph(obj.V, obj.E) 
}



Dagoba.Q = {}                                                     // prototype

Dagoba.query = function(graph) {                                  // factory (only called by a graph's query initializers)
  var query = Object.create( Dagoba.Q )
  
  query.   graph = graph                                          // the graph itself
  query.   state = []                                             // state for each step
  query. program = []                                             // list of steps to take  
  query.gremlins = []                                             // gremlins for each step

  return query
}

Dagoba.Q.run = function() {                                       // our virtual machine for query processing
  
  var graph = this.graph                                          // these are closed over in the helper
  var state = this.state                                          // so we give them a spot in the frame
  var program = this.program

  var max = program.length-1                                      // work backwards
  var pc = max                                                    // our program counter
  var done = -1                                                   // behindwhich things have finished
  var results = []                                                // results for this run
  var maybe_gremlin = false                                       // a mythical beast

  if(!program.length) return []                                   // don't bother
  
  // driver loop
  while(done < max) {
    maybe_gremlin = try_step(pc, maybe_gremlin)                   // maybe_gremlin is a gremlin, a signal string, or false
    
    if(maybe_gremlin == 'pull') {                                 // 'pull' is an out-of-band signal,
      maybe_gremlin = false                                       // telling us the pipe wants further input
      if(pc-1 > done) {
        pc--                                                      // try the previous pipe
        continue
      } else {
        done = pc                                                 // previous pipe is finished, so we are too
      }
    }
    
    if(maybe_gremlin == 'done') {                                 // 'done' is on out-of-band signal,
      done = pc                                                   // telling us the pipe is finished
      maybe_gremlin = false
    }
    
    pc++                                                          // move on to the next pipe
    
    if(pc > max) {
      if(maybe_gremlin)
        results.push(maybe_gremlin)                               // a gremlin popped out the end of the pipeline
      maybe_gremlin = false
      pc--                                                        // take a step back
    }
  }

  results = results.map(function(gremlin) {                       // THINK: make this a pipe type (or posthook)
    return gremlin.result != null ? gremlin.result : gremlin.vertex } )

  results = Dagoba.fireHooks('postquery', this, results)[0]       // do any requested post-processing
  
  return results
  
  // NOTE: this helper is inside our closure, so it has access to closure-level vars like 'program' and 'state'
  
  function try_step(pc, maybe_gremlin) {
    var step = program[pc]                                        // step is an array: first the pipe type, then its args
    var step_state = (state[pc] = state[pc] || {})                // the state for this step: ensure it's always an object

    if(!Dagoba.PipeTypes[step[0]])                                // most likely this actually results in a TypeError
      return Dagoba.onError('Unrecognized pipe type: ' + step[0]) // but if you do make it here you get a nice message
          || maybe_gremlin || 'pull'                              // and a gremlin, if there is one

    var pipetype = Dagoba.PipeTypes[step[0]]                      // a pipe type is just a function 
    return pipetype(graph, step.slice(1) || [], maybe_gremlin, step_state)
  }
}


Dagoba.Q.add = function(pipetype, args) {                         // add a new step to the query
  var step = [pipetype].concat(args)
  this.program.push(step)                                         // step is an array: first the pipe type, then its args
  return this
}

Dagoba.PipeTypes = {}                                             // every pipe has a type

Dagoba.addPipeType = function(name, fun) {                        // adds a new method to our query object
  Dagoba.PipeTypes[name] = fun
  Dagoba.Q[name] = function() {
    return this.add(name, [].slice.apply(arguments)) }            // capture the pipetype and args
}


// BUILT-IN PIPE TYPES


Dagoba.addPipeType('vertex', function(graph, args, gremlin, state) {
  if(!state.vertices) state.vertices = graph.findVertices(args)
  if(!state.vertices.length) return 'done'
  var vertex = state.vertices.pop()
  return Dagoba.makeGremlin(vertex, (gremlin||{}).state)          // use incoming gremlin state, if it exists
})
  
Dagoba.addPipeType('out', function(graph, args, gremlin, state) {
  if(!gremlin && (!state.edges || !state.edges.length)) return 'pull'
  
  if(!state.edges || !state.edges.length) {
    state.gremlin = gremlin
    state.edges = graph.findOutEdges(gremlin.vertex).filter(Dagoba.filterEdges(args[0]))
  }
  
  if(!state.edges.length) return 'pull'
  
  var vertex = state.edges.pop()._in // what?
  return Dagoba.gotoVertex(state.gremlin, vertex)
})

Dagoba.addPipeType('in', function(graph, args, gremlin, state) {
  if(!gremlin && (!state.edges || !state.edges.length)) return 'pull'
  
  if(!state.edges || !state.edges.length) {
    state.gremlin = gremlin
    state.edges = graph.findInEdges(gremlin.vertex).filter(Dagoba.filterEdges(args[0]))
  }
  
  if(!state.edges.length) return 'pull'
  
  var vertex = state.edges.pop()._out // what?
  return Dagoba.gotoVertex(state.gremlin, vertex)
})
  

// TODO: show how to refactor 'out', 'outN', and 'outAllN' using adverbs. also the 'in' equivalents. also make adverbs.

Dagoba.addPipeType('outAllN', function(graph, args, gremlin, state) {
  var filter = args[0]
  var limit = args[1]-1
  
  if(!state.edgeList) {                                           // initialize
    if(!gremlin) return 'pull'
    state.edgeList = []
    state.current = 0
    state.edgeList[0] = graph.findOutEdges(gremlin.vertex).filter(Dagoba.filterEdges(filter))
  }
  
  if(!state.edgeList[state.current].length) {                     // finished this round
    if(state.current >= limit || !state.edgeList[state.current+1] // totally done, or the next round has no items
                              || !state.edgeList[state.current+1].length) {
      state.edgeList = false
      return 'pull'
    }
    state.current++                                               // go to next round
    state.edgeList[state.current+1] = [] 
  }
  
  var vertex = state.edgeList[state.current].pop()._in
  
  if(state.current < limit) {                                     // add all our matching edges to the next level
    if(!state.edgeList[state.current+1]) state.edgeList[state.current+1] = []
    state.edgeList[state.current+1] = state.edgeList[state.current+1].concat(
      graph.findOutEdges(vertex).filter(Dagoba.filterEdges(filter))
    )
  }
  
  return Dagoba.gotoVertex(gremlin, vertex)
})
  
Dagoba.addPipeType('inAllN', function(graph, args, gremlin, state) {
  var filter = args[0]
  var limit = args[1]-1
  
  if(!state.edgeList) {                                           // initialize
    if(!gremlin) return 'pull'
    state.edgeList = []
    state.current = 0
    state.edgeList[0] = graph.findInEdges(gremlin.vertex).filter(Dagoba.filterEdges(filter))
  }
  
  if(!state.edgeList[state.current].length) {                     // finished this round
    if(state.current >= limit || !state.edgeList[state.current+1] // totally done, or the next round has no items
                              || !state.edgeList[state.current+1].length) {
      state.edgeList = false
      return 'pull'
    }
    state.current++                                               // go to next round
    state.edgeList[state.current+1] = [] 
  }
  
  var vertex = state.edgeList[state.current].pop()._out
  
  if(state.current < limit) {                                     // add all our matching edges to the next level
    if(!state.edgeList[state.current+1]) state.edgeList[state.current+1] = []
    state.edgeList[state.current+1] = state.edgeList[state.current+1].concat(
      graph.findInEdges(vertex).filter(Dagoba.filterEdges(filter))
    )
  }
  
  return Dagoba.gotoVertex(gremlin.state, vertex)
})
  
Dagoba.addPipeType('property', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  gremlin.result = gremlin.vertex[args[0]]
  return gremlin.result == null ? false : gremlin                 // undefined or null properties kill the gremlin
})
  
Dagoba.addPipeType('unique', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  if(state[gremlin.vertex._id]) return 'pull'                     // we've seen this gremlin, so get another instead
  state[gremlin.vertex._id] = true
  return gremlin
})
  
Dagoba.addPipeType('filter', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  if(typeof args[0] != 'function') 
    return Dagoba.onError('Filter arg is not a function: ' + args[0]) || gremlin
  if(!args[0](gremlin.vertex, gremlin)) return 'pull'             // gremlin fails filter function 
  return gremlin
})
  
Dagoba.addPipeType('take', function(graph, args, gremlin, state) {
  state.taken = state.taken ? state.taken : 0
  if(state.taken == args[0]) {
    state.taken = 0
    return 'done'
  }
  if(!gremlin) return 'pull'
  state.taken++ // FIXME: mutating! ugh!
  return gremlin
})

Dagoba.addPipeType('as', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  gremlin.state.as = gremlin.state.as ? gremlin.state.as : {}     // initialize gremlin's 'as' state
  gremlin.state.as[args[0]] = gremlin.vertex                      // set label to the current vertex
  return gremlin
})

Dagoba.addPipeType('back', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  return Dagoba.gotoVertex(gremlin, gremlin.state.as[args[0]])    // TODO: check for nulls
})

Dagoba.addPipeType('except', function(graph, args, gremlin, state) {
  if(!gremlin) return 'pull'
  if(gremlin.vertex == gremlin.state.as[args[0]]) return 'pull'   // TODO: check for nulls
  return gremlin
})


// HELPER FUNCTIONS

Dagoba.hooks = {}                                                 // callbacks triggered on various occasions

Dagoba.addHook = function(type, callback) {                       // add a new callback
  if(!Dagoba.hooks[type]) Dagoba.hooks[type] = []
  Dagoba.hooks[type].push(callback)
}

Dagoba.fireHooks = function(type, query) {                        // trigger callbacks of type 'type'
  var args = [].slice.call(arguments, 2)
  return ((Dagoba.hooks || {})[type] || []).reduce(
      function(acc, callback) {
          return callback.apply(query, acc)}, args) }

Dagoba.makeGremlin = function(vertex, state) {                    // gremlins are simple creatures: 
  return {vertex: vertex, state: state || {} } }                  // a current vertex, and some state

Dagoba.gotoVertex = function(gremlin, vertex) {                   // clone the gremlin 
  return Dagoba.makeGremlin(vertex, gremlin.state) }              // THINK: add path tracking here?

Dagoba.filterEdges = function(arg) {
  return function(thing) {
    return !arg ? true                                            // nothing is true
         : arg+'' === arg ? thing._label == arg                   // check the label
         : Array.isArray(arg) ? !!~arg.indexOf(thing._label)      // or a list of labels
         : Dagoba.objectFilter(thing, arg) } }                    // try it as an object

Dagoba.objectFilter = function(thing, obj) {
  for(var key in obj)
    if(thing[key] != obj[key])
      return false; return true }

Dagoba.cleanvertex = function(key, value) {return (key == '_in' || key == '_out') ? undefined : value} // for JSON.stringify
Dagoba.cleanedge   = function(key, value) {return key == '_in' ? value._id : key == '_out' ? value._id : value}

Dagoba.uniqueify = function (results) {                           // OPT: do this in the query via gremlin collision counting
  return [results.filter(function(item, index, array) {return array.indexOf(item) == index})]}

Dagoba.cleanclone = function (results) {                          // remove all _-prefixed properties
 return [results.map(function(item) {return JSON.parse(JSON.stringify(item, function(key, value) {return key[0]=='_' ? undefined : value}))})]}
  
Dagoba.onError = function(msg) {
  console.log(msg)
  return false 
}


// more todos
// - tune gremlins (collisions, history, etc)
// - interface: show query pieces and params,
// - interface: resumable queries
// - generational queries
// - intersections
// - adverbs

// TODO: deal with gremlin paths / history and gremlin "collisions"
// THINK: the user may retain a pointer to vertex, which they might mutate later >.<
// can take away user's ability to set _id and lose the index cache hash, because building it causes big rebalancing slowdowns and runs the GC hard. (or does it?) [this was with a million items, indexed by consecutive ints. generally we need settable _id because we need to grab vertices quickly by external key]


/*
        ---> no edge _id stuff
        ---> simplify driver loop helpers
        ---> refactor outAllN etc (mmm but adverbs?)
        ---> leo's queries !
*/


// re: Dagoba.Q.addPipeType
// TODO: accept string fun and allow extra params, for building quick aliases like
//       Dagoba.addPipeType('children', 'out') <-- if all out edges are kids
//       Dagoba.addPipeType('nthGGP', 'inN', 'parent')
// var methods = ['out', 'in', 'take', 'property', 'outAllN', 'inAllN', 'unique', 'filter', 'outV', 'outE', 'inV', 'inE', 'both', 'bothV', 'bothE']

// re: hooks
// NOTE: add these hooks if you need them. (our vertex payloads are immutable, and we uniqueify prior to taking.)
// Dagoba.addHook('postquery', Dagoba.uniqueify)
// Dagoba.addHook('postquery', Dagoba.cleanclone)
// THINK: the uniquify hook happens after the take component so it smushes results down, possibly returning fewer than you wanted...
