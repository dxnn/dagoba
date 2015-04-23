describe('Asgard', function() {
  var aesir_count = 0
  var vanir_count = 0
  var edges_count = 0

  describe('Construct a graph', function() {
    
    it('should build an empty graph', function() {
      g = Dagoba.graph()  // NOTE: deliberately leaking 'g' for console operations
      g.should.be.an('object')
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(0)
    })

    it('should add the Aesir', function() {
      var aesir = [ ['Auðumbla', 'F'], ['Ymir', 'M'], ['Þrúðgelmir', 'M'], ['Bergelmir', 'M'], ['Búri', 'M'], ['Borr', 'M']
                  , ['Bölþorn', 'M'], ['Bestla', 'F'], ['Odin', 'M'], ['Vili', 'M'], ['Vé', 'M']
                  , ['Hœnir', 'M'], ['Fjörgynn', 'M'], ['Frigg', 'F'], ['Annar', 'M']
                  , ['Jörð', 'F'], ['Nepr', 'M'], ['Gríðr', 'F'], ['Forseti', 'M']
                  , ['Rindr', 'F'], ['Dellingr', 'M'], ['Nótt', 'F'], ['Nanna', 'F'], ['Baldr', 'M']
                  , ['Höðr', 'M'], ['Hermóðr', 'M'], ['Bragi', 'M'], ['Iðunn', 'F'], ['Víðarr', 'M']
                  , ['Váli', 'M'], ['Gefjon', 'F'], ['Ullr', 'M'], ['Týr', 'M'], ['Dagr', 'M']
                  , ['Thor', 'M'], ['Sif', 'F'], ['Járnsaxa', 'F'], ['Nörfi', 'M']
                  , ['Móði', 'M'], ['Þrúðr', 'F'], ['Magni', 'M']
                  , ['Ægir', 'M'], ['Rán', 'F'], ['Nine sisters', 'F'], ['Heimdallr', 'M']
                  ]

      aesir.forEach(function(pair) { g.addVertex({ _id: pair[0]
                                                 , species: 'Aesir'
                                                 , gender: pair[1] == 'M' ? 'male' : 'female' }) })
      
      aesir_count = aesir.length
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(aesir_count)
    })
    
    it('should add the Vanir', function() {
      var vanir = [ 'Alvaldi', 'Þjazi', 'Iði', 'Gangr', 'Fárbauti', 'Nál', 'Gymir', 'Aurboða', 'Njörðr', 'Skaði'
                  , 'Sigyn', 'Loki', 'Angrboða', 'Býleistr', 'Helblindi', 'Beli', 'Gerðr', 'Freyr', 'Freyja'
                  , 'Óðr', 'Vali', 'Narfi', 'Hyrrokkin', 'Fenrir', 'Jörmungandr', 'Hel', 'Fjölnir'
                  , 'Hnoss', 'Gersemi', 'Hati Hróðvitnisson', 'Sköll', 'Mánagarmr'
                  ]

      vanir.forEach(function(name) { g.addVertex({_id: name, species: 'Vanir'}) })
      
      vanir_count = vanir.length
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(aesir_count + vanir_count)
    })
    
    it('should add some edges', function() {
      var relationships =
        [  ['Ymir', 'Þrúðgelmir']
        ,  ['Þrúðgelmir', 'Bergelmir']
        ,  ['Bergelmir', 'Bölþorn']
        ,  ['Bölþorn', 'Bestla']
        ,  ['Bestla', 'Odin']
        ,  ['Bestla', 'Vili']
        ,  ['Bestla', 'Vé']

        ,  ['Auðumbla', 'Búri']
        ,  ['Búri', 'Borr']
        ,  ['Borr', 'Odin']
        ,  ['Borr', 'Vili']
        ,  ['Borr', 'Vé']

        ,  ['Ægir', 'Nine sisters']
        ,  ['Rán', 'Nine sisters']
        ,  ['Nine sisters', 'Heimdallr']

        ,  ['Fjörgynn', 'Frigg']
        ,  ['Frigg', 'Baldr']
        ,  ['Odin',  'Baldr']
        ,  ['Nepr',  'Nanna']
        ,  ['Nanna', 'Forseti']
        ,  ['Baldr', 'Forseti']

        ,  ['Nörfi', 'Nótt']
        ,  ['Nótt', 'Dagr']
        ,  ['Nótt', 'Jörð']
        ,  ['Annar', 'Jörð']
      
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
      
      edges_count = relationships.length
      g.edges.should.have.lengthOf(edges_count)
      g.vertices.should.have.lengthOf(aesir_count + vanir_count)
    })
  })
  
  describe('Queries from the chapter', function() {
    var getAesir = function(name) { return g.v(name).run()[0] }
    
    it("g.v('Thor') should be Thor", function() {
      var out = g.v('Thor').run()
      var thor = out[0]
      thor._id.should.equal('Thor')
      thor.species.should.equal('Aesir')
    })
    
    it("g.v('Thor', 'Odin') should be Thor and Odin", function() {
      var out = g.v('Thor', 'Odin').run()
      out.should.have.lengthOf(2)
      out.should.contain(getAesir('Odin'))
      out.should.contain(getAesir('Thor'))
    })
    
    it("g.v({species: 'Aesir'}) should be all Aesir", function() {
      var out = g.v({species: 'Aesir'}).run()
      out.should.have.lengthOf(aesir_count)
      out.forEach(function(node) { node.should.have.property('species', 'Aesir') })
    })
    
    it("g.v() should be all Aesir and Vanir", function() {
      var out = g.v().run()
      out.should.have.lengthOf(aesir_count + vanir_count)
    })
    
    
    it("g.v('Thor').in().out() should contain several copies of Thor, and his wives", function() {
      var out = g.v('Thor').in().out().run()
      out.should.contain(getAesir('Járnsaxa'))
      out.should.contain(getAesir('Sif'))
      out.should.contain(getAesir('Thor'))
      
      var out2 = g.v('Thor').out().in().unique().run()
      out2.should.contain(getAesir('Thor'))
      
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
      out.should.contain(getAesir('Thor'))
      
      var out2 = g.v('Thor').out().in().unique().run()
      out2.should.contain(getAesir('Thor'))
      
      var diff = out.length - out2.length
      diff.should.be.above(0)
    })
    
    it("filter functions should filter", function() {
      var out = g.v('Thor').out().in().unique()
                 .filter(function(asgardian) { return asgardian._id != 'Thor' })
                 .run()
      out.should.contain(getAesir('Baldr'))
      out.should.not.contain(getAesir('Thor'))
      out.should.have.lengthOf(1)
    })
    
    it('property works like a map', function() {
      var out1 = g.v('Thor').out('parent').out('parent').run().map(function(vertex) {return vertex._id})
      var out2 = g.v('Thor').out('parent').out('parent').property('_id').run()
      out1.should.deep.equal(out2)
    })
    
    it("g.v('Thor').out().in().unique().filter({survives: true}) should be the empty array, because we don't label survivors", function() {
      var out = g.v('Thor').out().in().unique().filter({survives: true}).run()
      out.should.deep.equal([])
    })
        
    it("g.v('Thor').out().in().unique().filter({gender: 'male'}) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().in().unique().filter({gender: 'male'}).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(getAesir('Thor'))
    })
        
    it("g.v('Thor').out().out().out().in().in().in() should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().in().in().in().run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(getAesir('Thor'))
    })
    
    it("g.v('Thor').out().out().out().in().in().in().unique().take(10) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().in().in().in().unique().take(10).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(getAesir('Thor'))
    })
    
    it("g.v('Thor').out().out().out().out().in().in().in().in().unique().take(12) should contain Thor and his sibling", function() {
      var out = g.v('Thor').out().out().out().out().in().in().in().in().unique().take(12).run()
      out.should.contain(getAesir('Baldr'))
      out.should.contain(getAesir('Thor'))
    })
    
    
    it("Asynchronous queries should work", function() {
      var q = g.v('Auðumbla').in().in().in().property('_id').take(1)

      q.run().should.deep.equal(['Vé'])
      q.run().should.deep.equal(['Vili'])
      q.run().should.deep.equal(['Odin'])
      q.run().should.be.empty
      q.run().should.be.empty
    })
    
    
    it("Gathering ancestors up to three generations back", function() {
      var out = g.v('Thor').out().as('parent').out().as('grandparent').out().as('great-grandparent')
                 .merge('parent', 'grandparent', 'great-grandparent').run()

      out.should.contain(getAesir('Odin'))
      out.should.contain(getAesir('Borr'))
      out.should.contain(getAesir('Búri'))
      out.should.contain(getAesir('Jörð'))
      out.should.contain(getAesir('Nótt'))
      out.should.contain(getAesir('Nörfi'))
      out.should.contain(getAesir('Bestla'))
      out.should.contain(getAesir('Bölþorn'))
      // NOTE: the incompleteness of Thor's ancestor data in this graph prevents e.g. Annar from appearing
    })
    
    it("Get Thor's sibling Baldr", function() {
      var out = g.v('Thor').as('me').out().in().except('me').unique().run()
      out.should.deep.equal([getAesir('Baldr')])
    })
    
    it("Get Thor's uncles and aunts", function() {
      var out = g.v('Thor').out().as('parent').out().in().except('parent').unique().run()
      out.should.deep.equal([getAesir('Vé'), getAesir('Vili'), getAesir('Dagr')])
    })
    
    
    ////// ALIASES ///////
    
    it("parents alias", function() {
      Dagoba.addAlias('parents', [['out', 'parent']])
      var out1 = g.v('Thor').parents().property('_id').run()
      var out2 = g.v('Thor').out('parent').property('_id').run()
      out1.should.deep.equal(out2)
    })
    
    it("children alias", function() {
      Dagoba.addAlias('children', [['in', 'parent']])
      var out1 = g.v('Thor').children().run()
      out1.should.deep.equal([getAesir('Magni'), getAesir('Þrúðr'), getAesir('Móði')])
    })
    
    it("parents then children", function() {
      var out1 = g.v('Thor').parents().children().run()
      out1.should.deep.equal([getAesir('Thor'), getAesir('Baldr'), getAesir('Thor')])
    })
    
    it("children then parents", function() {
      var out1 = g.v('Thor').children().parents().run()
      out1.should.deep.equal([getAesir('Járnsaxa'), getAesir('Thor'), getAesir('Sif'), getAesir('Thor'), getAesir('Sif'), getAesir('Thor')])
    })
    
    it("siblings alias", function() {
      Dagoba.addAlias('siblings', [['as', 'me'], ['out', 'parent'], ['in', 'parent'], ['except', 'me']])
      var out1 = g.v('Magni').siblings().run()
      out1.should.deep.equal([getAesir('Þrúðr'), getAesir('Móði')])
    })
    
    it("grandparents alias", function() {
      Dagoba.addAlias('grandparents', [['out', 'parent'], ['out', 'parent']])
      var out1 = g.v('Magni').grandparents().run()
      out1.should.deep.equal([getAesir('Odin'), getAesir('Jörð')])
    })
    
    it("cousins alias", function() {
      Dagoba.addAlias('cousins', [ ['out', 'parent'], ['as', 'folks']
                                 , ['out', 'parent'], ['in', 'parent'], ['except', 'folks']
                                 , ['in',  'parent'], ['unique']])
      var out1 = g.v('Magni').cousins().run()
      out1.should.deep.equal([getAesir('Forseti')])
    })
    
    it("manual cousins", function() {
      var out1 = g.v('Magni').parents().as('parents').parents().children().except('parents').children().unique().run()
      out1.should.deep.equal([getAesir('Forseti')])
    })
    
    it("more cousins", function() {
      var out1 = g.v('Forseti').cousins().run()
      out1.should.deep.equal([getAesir('Magni'), getAesir('Þrúðr'), getAesir('Móði')])
    })
    
    
    it("Odin's grandkids", function() {
      var q = g.v('Odin').children().children().take(2)
      q.run().should.deep.equal([getAesir('Magni'), getAesir('Þrúðr')])
    })
    
    it("sons alias", function() {
      Dagoba.addAlias('sons', [['in', 'parent'], ['filter', {gender: 'male'}]])
      var out = g.v('Thor').sons().run()
      out.should.deep.equal([getAesir('Magni'), getAesir('Móði')])
    })
    
    it("daughters alias", function() {
      Dagoba.addAlias('daughters', [['in', 'parent'], ['filter', {gender: 'female'}]])
      var out = g.v('Thor').daughters().run()
      out.should.deep.equal([getAesir('Þrúðr')])
    })
    
    it("Fjörgynn's daughters who have children with Bestla's sons", function() {
      // as it originally appeared, modified to work with our data model
      var out = g.v('Fjörgynn').daughters().as('me')
                 .in()
                 .out().out()
                 .filter({_id: 'Bestla'})
                 .back('me').unique().run()
      
      out.should.deep.equal([getAesir('Frigg')])
    })
    
    it("Fjörgynn's daughters who have children with Bestla's sons", function() {
      // final book version
      var out = g.v('Fjörgynn').in().as('me')                   // first gremlin's state.as is Frigg
                 .in()                                          // first gremlin's vertex is now Baldr
                 .out().out()                                   // make a clone of that gremlin for each grandparent
                 .filter({_id: 'Bestla'})                       // keep only the gremlin on grandparent Bestla
                 .back('me').unique().run()                     // jump the gremlin's vertex back to Frigg and exit
      
      out.should.deep.equal([getAesir('Frigg')])
    })
    
    
    it("no edge filter", function() {
      g.addEdge({'_label': 'spouse', _out: 'Frigg',   _in: 'Odin', order: 1})
      g.addEdge({'_label': 'spouse', _out: 'Jörð',    _in: 'Odin', order: 2})
      g.addEdge({'_label': 'owner',  _out: 'Fenrir',  _in: 'Odin', order: 2})
      var out = g.v('Odin').in().run()
      out.should.deep.equal([getAesir('Fenrir'), getAesir('Jörð'), getAesir('Frigg'), getAesir('Thor'), getAesir('Baldr')])
    })
    
    it("string edge filter", function() {
      var out = g.v('Odin').in('parent').run()
      out.should.deep.equal([getAesir('Thor'), getAesir('Baldr')])
    })
    
    it("array edge filter", function() {
      var out = g.v('Odin').in(['parent', 'spouse']).run()
      out.should.deep.equal([getAesir('Jörð'), getAesir('Frigg'), getAesir('Thor'), getAesir('Baldr')])
    })
    
    it("object edge filter", function() {
      var out = g.v('Odin').in({_label: 'spouse', order: 2}).run()
      out.should.deep.equal([getAesir('Jörð')])
    })
    
    
    it.skip('should do wonderous things', function() {
      console.log(
        // from old asgard example...
        g.addEdge({'_label': 'spouse', _in: 'Freyr', _out: 'Thor'})
    
      , g.v('Thor').out().in().run()
      , g.v('Thor').out('parent').in().run()
    
      , Dagoba.addAlias('parents', [['out', 'parent']])
      , Dagoba.addAlias('children', [['in', 'parent']])
    
      , g.v('Thor').parents().children().run()
      , g.v('Thor').parents('spouse').in().run()
      )
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
    
  })
})