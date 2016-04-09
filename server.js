var http = require('http')
var ecstatic = require('ecstatic')
var st = ecstatic('public')

var server = http.createServer(function(req, res) {
	st(req, res)
})

server.listen(process.env.PORT || 5000)
console.log('Server running on port 5000')
