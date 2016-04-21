(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":3}],2:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],4:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":1,"trim":5}],5:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],6:[function(require,module,exports){
"use strict";
var window = require("global/window")
var once = require("once")
var isFunction = require("is-function")
var parseHeaders = require("parse-headers")
var xtend = require("xtend")

module.exports = createXHR
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    var callback = options.callback
    if(typeof callback === "undefined"){
        throw new Error("callback argument missing")
    }
    callback = once(callback)

    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        callback(err, response, response.body)

    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data || null
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            aborted=true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}

function noop() {}

},{"global/window":2,"is-function":3,"once":7,"parse-headers":4,"xtend":8}],7:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],8:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],9:[function(require,module,exports){
var xhr = require('xhr')

//var currentImage = document.getElementById('carousel-image')
var currentState = 0

var leftButton = document.getElementById('left-control')
var rightButton = document.getElementById('right-control')

var indicators = []
var itemImages = []

console.log('here!')
xhr('/carousel-photos', function (err, resp, body) {
	if (err) console.log(err)
	else{ 
		setInterval(moveRight, 15000)
		var images = JSON.parse(body)
		images.forEach(function(imageUri, index) {
			var newLi = document.createElement('li')
			newLi.setAttribute('class', 'indicator')
			
			document.getElementById('indicator-ol').appendChild(newLi)
			indicators.push(newLi)
			
			var newItem = document.createElement('div')
			newItem.setAttribute('class', 'item')
			
			var newImage = document.createElement('img')
			newImage.setAttribute('src', "img/carousel-images/"+ images[index])
			newItem.appendChild(newImage)
			document.getElementById('slide-wrapper').appendChild(newItem)
			
			itemImages.push(newItem)
		})
			
		indicators[currentState].setAttribute('class', 'indicator active')
		itemImages[currentState].setAttribute('class', 'item active')	

		function moveLeft() {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === 0){ currentState = images.length-1 } 
			else { currentState-- }
			
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		function moveRight() {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === images.length-1){ currentState = 0 } 
			else { currentState++ }
			
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		
		leftButton.onclick = moveLeft
		rightButton.onclick = moveRight
		
		document.addEventListener('touchstart', handleTouchStart, false);
		document.addEventListener('touchmove', handleTouchMove, false);
		var xDown = null
		var yDown = null 

		function handleTouchStart(evt) {
			xDown = evt.touches[0].clientX                                      
			yDown = evt.touches[0].clientY                                      
		}                
		function handleTouchMove(evt) {
			if ( ! xDown || ! yDown ) {
				return
			}
			var xUp = evt.touches[0].clientX                                    
			var yUp = evt.touches[0].clientY
			
			var xDiff = xDown - xUp
			var yDiff = yDown - yUp

			if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
				if ( xDiff > 0 ) { moveLeft() } 
				else { moveRight() }                       
			} else {
				if ( yDiff > 0 ) {
					/* up swipe */ 
				} else { 
					/* down swipe */
				}                                                                 
			}
			/* reset values */
			xDown = null;
			yDown = null;                                             
		}	
	}
})


},{"xhr":6}],10:[function(require,module,exports){
var dropdown = document.getElementById('dropdownLi')
document.getElementById('dropdown-ul').style.display='none'

dropdown.onclick = function () {
	var dropdownUl = document.getElementById('dropdown-ul')
	var dropdownIcon = document.getElementById('dropdown-icon')
	if (dropdownUl.style.display === 'none') {
		dropdownUl.style.display = 'inline-block'
		dropdownIcon.style.color = '#5ac40f'
	} else {
		dropdownUl.style.display = 'none'
		dropdownIcon.style.color = '#0eb5fe'
	}
}

},{}],11:[function(require,module,exports){
		/*
		var active = 0 var leftControl = document.getElementById('left-control')
		var rightControl = document.getElementById('right-control')
		var indicators = document.getElementsByClassName('indicator')
		var numItems = indicators.length
		
		console.log('indicators', indicators)
		console.log('1 indicator', indicators[active])
		for (var i =0 ; i < indicators.length ; i++){
				//console.log('i', i)
				//console.log('* indicator', indicators[i])
		}	
		leftControl.onclick = function () {
			if(active === 0){ 
				console.log('2 indicators', indicators)
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				console.log('3 indicators', indicators)
				// set new active value
				active = numItems - 1 
				console.log('numItems', numItems)
				console.log('active', active)
				console.log('2 indicators', indicators)
				console.log('AI', indicators[active])
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			}	
			else { 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active-- 
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			 }
		}
		rightControl.onclick = function () {
			console.log('Aaaaah!!!')
			if(active === numItems - 1){ 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active = 0 
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			}	
			else { 
				// remove active class from old indicator
				indicators[active].removeAttribute('class', 'active')
			
				// set new active value
				active++
				
				// remove active class from old indicator
				indicators[active].setAttribute('class', 'active')
			 }
		}
		*/

},{}],12:[function(require,module,exports){
var videos = document.getElementById('video-grid').getElementsByClassName('grid-vid')
document.onload = player(0)

function player (i){
	var video = videos[i]
	
	video.play()
	video.onended = function(){
		video.currentTime = 0
		if(i === 4) player(0)
		else player(i+1)	
	}
}

},{}]},{},[9,10,11,12]);
