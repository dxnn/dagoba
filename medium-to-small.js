// eat a json file line by line, 
// modify each record,
// then spit it out to stdout
// ex: node medium-to-small.js > small.json

var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

var instream = fs.createReadStream('medium.json');

var rl = readline.createInterface({
    input: instream,
    terminal: false
});

rl.on('line', function(line) {
    var data = JSON.parse(line)
    delete data.description
    delete data.polls
    var newline = JSON.stringify(data)

    console.log(newline + ',') // writes to stdout
});