describe('Basics', function() {

  describe('Build a simple graph', function() {
    var g
    var v1 = {_id: 1, name: 'foo', type: 'banana'}
    var v2 = {_id: 2, name: 'bar', type: 'orange'}
    var e1 = { _out: 1, _in: 2, _label: 'fruitier'}

    it('should build an empty graph', function() {
      g = Dagoba.graph()
      g.should.be.an('object')
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(0)
    })

    it('should add a vertex v1', function() {
      g.addVertex(v1)
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(1)
    })

    it('should add another vertex v2', function() {
      g.addVertex(v2)
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(2)
    })

    it('should add an edge v1->v2', function() {
      g.addEdge(e1)
      g.edges.should.have.lengthOf(1)
      g.vertices.should.have.lengthOf(2)
    })

    it('g.v(1) should return v1', function() {
      var out = g.v(1).run()
      out.should.deep.equal([v1])
    })

    it('g.v(1).out() should follow out edge v1->v2 and return v2', function() {
      var out = g.v(1).out().run()
      out.should.deep.equal([v2])
    })

    it('g.v(2).in() should follow in edge v2<-v1 and return v1', function() {
      var out = g.v(2).in().run()
      out.should.deep.equal([v1])
    })

    it('g.v(2).out() should follow no edge and return nothing', function() {
      var out = g.v(2).out().run()
      out.should.be.empty
    })
  })
  
  describe('Build a bigger graph', function() {
    var g, V, E

    it('should build the graph', function() {
      var vertices = [ {_id:1, name:"Fred"}
                     , {_id:2, name:"Bob"}
                     , {_id:3, name:"Tom"}
                     , {_id:4, name:"Dick"}
                     , {_id:5, name:"Harry"} 
                     , {_id:6, name:"Lucy"} 
                     ]
                     
      var edges = [ { _out: 1, _in: 2, _label: "son"}
                  , { _out: 2, _in: 3, _label: "son"}
                  , { _out: 2, _in: 4, _label: "son"}
                  , { _out: 2, _in: 5, _label: "son"} 
                  , { _out: 2, _in: 6, _label: "daughter"} 
                  , { _out: 3, _in: 4, _label: "brother"} 
                  , { _out: 4, _in: 5, _label: "brother"} 
                  , { _out: 5, _in: 3, _label: "brother"} 
                  , { _out: 3, _in: 5, _label: "brother"} 
                  , { _out: 4, _in: 3, _label: "brother"} 
                  , { _out: 5, _in: 4, _label: "brother"} 
                  , { _out: 3, _in: 6, _label: "sister"} 
                  , { _out: 4, _in: 6, _label: "sister"} 
                  , { _out: 5, _in: 6, _label: "sister"} 
                  , { _out: 6, _in: 3, _label: "brother"} 
                  , { _out: 6, _in: 4, _label: "brother"} 
                  , { _out: 6, _in: 5, _label: "brother"} 
                  ]
                  
      g = Dagoba.graph(vertices, edges)
                  
      g.vertices.should.have.lengthOf(6)
      g.edges.should.have.lengthOf(17)
      V = vertices, E = edges
      V.unshift('')
    })

    it('g.v(1).out().out() should get all grandkids', function() {
      var out = g.v(1).out().out().run()
      out.should.deep.equal([ V[6], V[5], V[4], V[3] ])
    })

    it("g.v(1).out().in().out() means 'fred is his son's father'", function() {
      var out = g.v(1).out().in().out().run()
      out.should.deep.equal([ V[2] ])
    })

    it("g.v(1).out().out('daughter') should get the granddaughters", function() {
      var out = g.v(1).out().out('daughter').run()
      out.should.deep.equal([ V[6] ])
    })

    it("g.v(3).out('sister') means 'who is tom's sister?'", function() {
      var out = g.v(3).out('sister').run()
      out.should.deep.equal([ V[6] ])
    })

    it("g.v(3).out().in('son').in('son') means 'who is tom's brother's grandfather?'", function() {
      var out = g.v(3).out().in('son').in('son').run()
      out.should.deep.equal([ V[1], V[1] ])
    })

    it("g.v(3).out().in('son').in('son').unique() should return the unique grandfather", function() {
      var out = g.v(3).out().in('son').in('son').unique().run()
      out.should.deep.equal([ V[1] ])
    })

  //          , { fun: function(g, V, E) { return g.v(1).outAllN('son', 2).property('name').run()  /* all male hiers */ }
  //            , got: function(g, V, E) { return ["Bob","Harry","Dick","Tom"] } }
    
  })
  
  
  
  
})