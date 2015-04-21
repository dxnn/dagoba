describe('Asgard', function() {
  var g

  describe('Construct a graph', function() {
    
    it('should build an empty graph', function() {
      g = Dagoba.graph()
      g.should.be.an('object')
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(0)
    })

    it('should add the Aesir', function() {
      var aesir = [ 'Ymir', 'Þrúðgelmir', 'Bergelmir', 'Búri', 'Borr', 'Bölþorn', 'Bestla', 'Odin', 'Vili', 'Ve'
                  , 'Hœnir', 'Ægir', 'Rán', 'Fjörgynn', 'Frigg', 'Heimdallr', 'Nörfi', 'Jörð', 'Nepr', 'Gríðr'
                  , 'Rindr', 'Dellingr', 'Nótt', 'Nanna', 'Baldr', 'Höðr', 'Hermóðr', 'Bragi', 'Iðunn', 'Víðarr'
                  , 'Váli', 'Skjöldr', 'Gefjon', 'Ullr', 'Sif', 'Nine sisters', 'Thor', 'Járnsaxa', 'Týr', 'Dagr'
                  , 'Forseti', 'Scyldings', 'Móði', 'Þrúðr', 'Magni'
                  ]

      aesir.forEach(function(name) { g.addVertex({_id: name, species: 'Aesir'}) })
      
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(45)
    })
    
    it('should add the Vanir', function() {
      var vanir = [ 'Alvaldi', 'Þjazi', 'Iði', 'Gangr', 'Fárbauti', 'Nál', 'Gymir', 'Aurboða', 'Njörðr', 'Skaði'
                  , 'Sigyn', 'Loki', 'Angrboða', 'Býleistr', 'Helblindi', 'Beli', 'Gerðr', 'Freyr', 'Freyja'
                  , 'Óðr', 'Vali', 'Narfi', 'Hyrrokkin', 'Fenrir', 'Jörmungandr', 'Hel', 'Fjölnir'
                  , 'Hnoss', 'Gersemi', 'Hati Hróðvitnisson', 'Sköll', 'Mánagarmr'
                  ]

      vanir.forEach(function(name) { g.addVertex({_id: name, species: 'Vanir'}) })
      
      g.edges.should.have.lengthOf(0)
      g.vertices.should.have.lengthOf(77)
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
      g.vertices.should.have.lengthOf(77)
    })
    
  })
  
  describe('Construct a graph', function() {
    it('should do wonderous things', function() {
      console.log(
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