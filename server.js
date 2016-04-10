var fs = require('fs')
var http = require('http')
var ecstatic = require('ecstatic')
var st = ecstatic('public')

var server = http.createServer(function(req, res) {
	if(req.url === '/carousel-photos') {
		console.log('in ajax route')
		fs.readdir('public/img/carousel-images', function(err, images) {
			if (err) {
				console.log(err)
			} else {
				res.end(JSON.stringify(images))
			}
		})
	}
	else st(req, res)
})

server.listen(process.env.PORT || 5000)
console.log('Server running on port 5000')
