describe('Asgard', function() {
  // var g

  describe('Construct a graph', function() {
    
    it('should build an empty graph', function() {
      g = Dagoba.graph()
      g.should.be.an('object')
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(0)
    })

    it('should add the Aesir', function() {
      var aesir = [ ['Ymir', 'M'], ['Þrúðgelmir', 'M'], ['Bergelmir', 'M'], ['Búri', 'M'], ['Borr', 'M']
                  , ['Bölþorn', 'M'], ['Bestla', 'F'], ['Odin', 'M'], ['Vili', 'M'], ['Ve', 'M']
                  , ['Hœnir', 'M'], ['Fjörgynn', 'M'], ['Frigg', 'F']
                  , ['Jörð', 'F'], ['Nepr', 'M'], ['Gríðr', 'F'], ['Forseti', 'M']
                  , ['Rindr', 'F'], ['Dellingr', 'M'], ['Nótt', 'F'], ['Nanna', 'F'], ['Baldr', 'M']
                  , ['Höðr', 'M'], ['Hermóðr', 'M'], ['Bragi', 'M'], ['Iðunn', 'F'], ['Víðarr', 'M']
                  , ['Váli', 'M'], ['Gefjon', 'F'], ['Ullr', 'M'], ['Týr', 'M'], ['Dagr', 'M']
                  , ['Thor', 'M'], ['Sif', 'F'], ['Járnsaxa', 'F']
                  , ['Móði', 'M'], ['Þrúðr', 'F'], ['Magni', 'M']
                  , ['Ægir', 'M'], ['Rán', 'F'], ['Nine sisters', 'F'], ['Heimdallr', 'M']
                  ]

      aesir.forEach(function(pair) { g.addVertex({ _id: pair[0]
                                                 , species: 'Aesir'
                                                 , gender: pair[1] == 'M' ? 'male' : 'female' }) })
      
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(42)
    })
    
    it('should add the Vanir', function() {
      var vanir = [ 'Alvaldi', 'Þjazi', 'Iði', 'Gangr', 'Fárbauti', 'Nál', 'Gymir', 'Aurboða', 'Njörðr', 'Skaði'
                  , 'Sigyn', 'Loki', 'Angrboða', 'Býleistr', 'Helblindi', 'Beli', 'Gerðr', 'Freyr', 'Freyja'
                  , 'Óðr', 'Vali', 'Narfi', 'Hyrrokkin', 'Fenrir', 'Jörmungandr', 'Hel', 'Fjölnir'
                  , 'Hnoss', 'Gersemi', 'Hati Hróðvitnisson', 'Sköll', 'Mánagarmr'
                  ]

      vanir.forEach(function(name) { g.addVertex({_id: name, species: 'Vanir'}) })
      
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(74)
    })
    
    it('should add some edges', function() {
      var relationships =
        [  ['Ymir', 'Þrúðgelmir']
        ,  ['Þrúðgelmir', 'Bergelmir']
        ,  ['Bergelmir', 'Búri']
        ,  ['Bergelmir', 'Bölþorn']
        ,  ['Búri', 'Borr']
        ,  ['Bölþorn', 'Bestla']
        ,  ['Bestla', 'Odin']
        ,  ['Bestla', 'Vili']
        ,  ['Bestla', 'Ve']
        ,  ['Bestla', 'Hœnir']

        ,  ['Ægir', 'Nine sisters']
        ,  ['Rán', 'Nine sisters']
        ,  ['Nine sisters', 'Heimdallr']

        ,  ['Fjörgynn', 'Frigg']
        ,  ['Frigg', 'Baldr']
        ,  ['Odin',  'Baldr']
        ,  ['Nepr',  'Nanna']
        ,  ['Nanna', 'Forseti']
        ,  ['Baldr', 'Forseti']

        ,  ['Jörð', 'Thor']
        ,  ['Odin', 'Thor']
        ,  ['Thor', 'Móði']
        ,  ['Thor', 'Þrúðr']
        ,  ['Sif',  'Móði']
        ,  ['Sif',  'Þrúðr']
        ,  ['Thor', 'Magni']
        ,  ['Járnsaxa', 'Magni']

        ]

      relationships.forEach(function(pair) {
        g.addEdge({_in: pair[0], _out: pair[1], _label: 'parent'})
      })
      
      g.edges.should.have.lengthOf(27)
      g.vertices.should.have.lengthOf(74)
    })
  })
  
  describe('Queries from the chapter', function() {
    var thor
    var getAesir = function(name) { return g.v(name).run()[0] }
    
    it("g.v('Thor') should be Thor", function() {
      var out = g.v('Thor').run()
      thor = out[0]
      thor._id.should.equal('Thor')
      thor.species.should.equal('Aesir')
    })
    
    it("g.v('Thor', 'Odin') should be Thor and Odin", function() {
      var out = g.v('Thor', 'Odin').run()
      out.should.have.lengthOf(2)
      out.should.contain(getAesir('Odin'))
      out.should.contain(thor)
    })
    
    it("g.v({species: 'Aesir'}) should be all Aesir", function() {
      var out = g.v({species: 'Aesir'}).run()
      out.should.have.lengthOf(42)
      out.forEach(function(node) { node.should.have.property('species', 'Aesir') })
    })
    
    it("g.v() should be all Aesir and Vanir", function() {
      var out = g.v().run()
      out.should.have.lengthOf(74)
    })
    
    
    it("g.v('Thor').in().out() should contain several copies of Thor, and his wives", function() {
      var out = g.v('Thor').in().out().run()
      out.should.contain(getAesir('Járnsaxa'))
      out.should.contain(getAesir('Sif'))
      out.should.contain(thor)
      
      var out2 = g.v('Thor').out().in().unique().run()
      out2.should.contain(thor)
      
      var diff = out.length - out2.length
      diff.should.be.above(0)
    })
    
    it("g.v('Thor').in().in().out().out() should be the empty array, because we don't know Thor's grandchildren", function() {
      var out = g.v('Thor').in().in().out().out().run()
      out.should.deep.equal([])
    })
        
    
    it("g.v('Thor').out().in() should contain several copies of Thor, and his sibling", function() {
      var out = g.v('Thor').out().in().run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(thor)
      
      var out2 = g.v('Thor').out().in().unique().run()
      out2.should.contain(thor)
      
      var diff = out.length - out2.length
      diff.should.be.above(0)
    })
    
      // g.v('Thor').out().in().unique().filter(function(asgardian) {return asgardian._id != 'Thor'}).run()
      
      // g.v('Thor').out().in().unique()
       // .filter(function(asgardian) { return asgardian.weight > asgardian.height })
       // .run()
    
    
    
    it("g.v('Thor').out().in().unique().filter({survives: true}) should be the empty array, because we don't label survivors", function() {
      var out = g.v('Thor').out().in().unique().filter({survives: true}).run()
      out.should.deep.equal([])
    })
        
    it("g.v('Thor').out().in().unique().filter({gender: 'male'}) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().in().unique().filter({gender: 'male'}).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(thor)
    })
        
    it("g.v('Thor').out().out().out().in().in().in() should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().in().in().in().run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(thor)
    })
    
    it("g.v('Thor').out().out().out().in().in().in().unique().take(10) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().in().in().in().unique().take(10).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(thor)
    })
    
    it("g.v('Thor').out().out().out().out().in().in().in().in().unique().take(12) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().out().in().in().in().in().unique().take(12).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(thor)
    })
    
    
    
    
      /*
         q = g.v('Auðumbla').in().in().in().property('name').take(1)

         q.run() // ["Odin"]
         q.run() // ["Vili"]
         q.run() // ["Vé"]
         q.run() // []
      */
    
      // g.v('Thor').out().as('parent').out().as('grandparent').out().as('great-grandparent')
           // .merge('parent', 'grandparent', 'great-grandparent').run()
      // g.v('Thor').as('me').out().in().except('me').unique().run()
      // g.v('Thor').out().as('parent').out().in().except('parent').unique().run()

    
      /*
         Dagoba.addAlias('parents', 'out', ['parent'])
         Dagoba.addAlias('children', 'in', ['parent'])
         Dagoba.addAlias('siblings', [['out', 'parent'], ['in', 'parent']])
         Dagoba.addAlias('grandparents', [['out', 'parent'], ['out', 'parent']])
         Dagoba.addAlias('cousins', [['out', 'parent'], ['as', 'folks'], ['out', 'parent'], ['in', 'parent'], ['except', 'folks'], ['in', 'parents'], ['unique']])        
      */
    
      // g.v('Thor').parents().children()
      // g.v('Thor').children().parents()
    
      // g.v('Forseti').parents().as('parents').parents().children().except('parents').children().unique()
      // g.v('Forseti').cousins()
      
      // var q = g.v('Thor').children().children().take(2)
      // q.run()
    
      // g.v('Odin').in().run()
      // g.v('Odin').in('son').run()
      // g.v('Odin').in(['daughter', 'son']).run()
      // g.v('Odin').in({position: 2, _label: daughter}).run()
          
      /*
         g.v('Fjörgynn').in('daughter').as('me')                 // first gremlin's state.as is Frigg
          .in()                                                  // first gremlin's vertex is now Baldr
          .out().out()                                           // put copy of that gremlin on each grandparent
          .filter({_id: 'Bestla'})                               // only keep the gremlin on grandparent Bestla
          .back('me').unique().run()                             // jump the gremlin's vertex back to Frigg and exit
      */
    
    
    it('should ...', function() {
      // same:
      // g.v('Thor').out('father').out('father').run().map(function(vertex) {return vertex.name})
      // g.v('Thor').out('father').out('father').property('name').run()

      // g.v('Thor').out('father').in('father')
      // g.v('Thor').out('father').out('father').run()
      
    })
    
      
      
      // adverbs:
      // g.v('Thor').out().as('parent').out().as('grandparent').out().as('great-grandparent').merge(['parent', 'grandparent', 'great-grandparent']).run()
      // g.v('Thor').out().all().times(3).run()
      // g.v('Thor').out().as('a').out().as('b').out().as('c').merge(['a', 'b', 'c']).run()
      // g.v('Thor').out().all().out().all().out().all().run()
      // g.v('Thor').out().start().in().out().end().times(4).run()
      // g.v('Ymir').in().filter({survives: true})` and `g.v('Ymir').in().in().in().in().filter({survives: true})
      // g.v('Ymir').in().filter({survives: true}).every()
      // g.v('Ymir').in().filter({survives: true}).bfs()
      // g.v('Ymir').in().filter({survives: true}).in().bfs()
    
    it('should do wonderous things', function() {
      console.log(
        // from old asgard example...
        g.addEdge({'_label': 'spouse', _in: 'Freyr', _out: 'Thor'})
    
      , g.v('Thor').out().in().run()
      , g.v('Thor').out('parent').in().run()
    
      , Dagoba.addAlias('parents', 'out', ['parent'])
      , Dagoba.addAlias('children', 'in', ['parent'])
    
      , g.v('Thor').parents().children().run()
      , g.v('Thor').parents('spouse').in().run()
      )
    })
  })
})