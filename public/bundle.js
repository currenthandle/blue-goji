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
		console.log('in else')
		var images = JSON.parse(body)
		images.forEach(function(imageUri, index) {
			var newLi = document.createElement('li')
			//var newContent = document.createTextNode('rawr')
			//newLi.appendChild(newContent)
			newLi.setAttribute('class', 'indicator')
			
			document.getElementById('indicator-ol').appendChild(newLi)
			indicators.push(newLi)
			
			var newItem = document.createElement('div')
			newItem.setAttribute('class', 'item')
			
			var newImage = document.createElement('img')
			newImage.setAttribute('src', "img/carousel-images/"+ images[index])
			console.log('newItem', newItem)	
			newItem.appendChild(newImage)
			document.getElementById('slide-wrapper').appendChild(newItem)
			
			itemImages.push(newItem)
		})
		
			
		//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
		indicators[currentState].setAttribute('class', 'indicator active')
		itemImages[currentState].setAttribute('class', 'item active')	
		
		leftButton.onclick = function () {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === 0){ currentState = images.length-1 } 
			else { currentState-- }
			
			
			//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
		rightButton.onclick = function () {
			indicators[currentState].setAttribute('class', 'indicators')
			itemImages[currentState].setAttribute('class', 'item')
			
			if (currentState === images.length-1){ currentState = 0 } 
			else { currentState++ }
			
			//currentImage.setAttribute("src", "img/carousel-images/"+ images[currentState])
			indicators[currentState].setAttribute('class', 'indicator active')
			itemImages[currentState].setAttribute('class', 'item active')	
		}	
	}
})


},{"xhr":6}],10:[function(require,module,exports){
var dropdown = document.getElementById('dropdownLi')
document.getElementById('dropdown-ul').style.display='none'

dropdown.onclick = function () {
	var dropdownUl = document.getElementById('dropdown-ul')
	if (dropdownUl.style.display === 'none') {
		dropdownUl.style.display = 'inline-block'
	} else {
		dropdownUl.style.display = 'none'
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

},{}]},{},[9,10,11,12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm9yLWVhY2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsIm5vZGVfbW9kdWxlcy9pcy1mdW5jdGlvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS1oZWFkZXJzL3BhcnNlLWhlYWRlcnMuanMiLCJub2RlX21vZHVsZXMvdHJpbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94aHIvaW5kZXguanMiLCJub2RlX21vZHVsZXMveGhyL25vZGVfbW9kdWxlcy9vbmNlL29uY2UuanMiLCJub2RlX21vZHVsZXMveHRlbmQvaW1tdXRhYmxlLmpzIiwicHVibGljL2pzL2NvbWJvLWNhcm91c2VsLmpzIiwicHVibGljL2pzL2Ryb3Bkb3duLmpzIiwicHVibGljL2pzL29sZC1jYXJvdXNlbC5qcyIsInB1YmxpYy9qcy9wbGF5LXZpZGVvcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzLWZ1bmN0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JFYWNoXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gZm9yRWFjaChsaXN0LCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXNGdW5jdGlvbihpdGVyYXRvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgY29udGV4dCA9IHRoaXNcbiAgICB9XG4gICAgXG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobGlzdCkgPT09ICdbb2JqZWN0IEFycmF5XScpXG4gICAgICAgIGZvckVhY2hBcnJheShsaXN0LCBpdGVyYXRvciwgY29udGV4dClcbiAgICBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ3N0cmluZycpXG4gICAgICAgIGZvckVhY2hTdHJpbmcobGlzdCwgaXRlcmF0b3IsIGNvbnRleHQpXG4gICAgZWxzZVxuICAgICAgICBmb3JFYWNoT2JqZWN0KGxpc3QsIGl0ZXJhdG9yLCBjb250ZXh0KVxufVxuXG5mdW5jdGlvbiBmb3JFYWNoQXJyYXkoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGFycmF5LCBpKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVtpXSwgaSwgYXJyYXkpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hTdHJpbmcoc3RyaW5nLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzdHJpbmcubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgLy8gbm8gc3VjaCB0aGluZyBhcyBhIHNwYXJzZSBzdHJpbmcuXG4gICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgc3RyaW5nLmNoYXJBdChpKSwgaSwgc3RyaW5nKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZm9yRWFjaE9iamVjdChvYmplY3QsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgayBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmplY3Rba10sIGssIG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpe1xuICAgIG1vZHVsZS5leHBvcnRzID0gc2VsZjtcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7fTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvblxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24gKGZuKSB7XG4gIHZhciBzdHJpbmcgPSB0b1N0cmluZy5jYWxsKGZuKVxuICByZXR1cm4gc3RyaW5nID09PSAnW29iamVjdCBGdW5jdGlvbl0nIHx8XG4gICAgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiBzdHJpbmcgIT09ICdbb2JqZWN0IFJlZ0V4cF0nKSB8fFxuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAvLyBJRTggYW5kIGJlbG93XG4gICAgIChmbiA9PT0gd2luZG93LnNldFRpbWVvdXQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuYWxlcnQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuY29uZmlybSB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5wcm9tcHQpKVxufTtcbiIsInZhciB0cmltID0gcmVxdWlyZSgndHJpbScpXG4gICwgZm9yRWFjaCA9IHJlcXVpcmUoJ2Zvci1lYWNoJylcbiAgLCBpc0FycmF5ID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChoZWFkZXJzKSB7XG4gIGlmICghaGVhZGVycylcbiAgICByZXR1cm4ge31cblxuICB2YXIgcmVzdWx0ID0ge31cblxuICBmb3JFYWNoKFxuICAgICAgdHJpbShoZWFkZXJzKS5zcGxpdCgnXFxuJylcbiAgICAsIGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcm93LmluZGV4T2YoJzonKVxuICAgICAgICAgICwga2V5ID0gdHJpbShyb3cuc2xpY2UoMCwgaW5kZXgpKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgLCB2YWx1ZSA9IHRyaW0ocm93LnNsaWNlKGluZGV4ICsgMSkpXG5cbiAgICAgICAgaWYgKHR5cGVvZihyZXN1bHRba2V5XSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkocmVzdWx0W2tleV0pKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0ucHVzaCh2YWx1ZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IFsgcmVzdWx0W2tleV0sIHZhbHVlIF1cbiAgICAgICAgfVxuICAgICAgfVxuICApXG5cbiAgcmV0dXJuIHJlc3VsdFxufSIsIlxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHJpbTtcblxuZnVuY3Rpb24gdHJpbShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKTtcbn1cblxuZXhwb3J0cy5sZWZ0ID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKi8sICcnKTtcbn07XG5cbmV4cG9ydHMucmlnaHQgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xccyokLywgJycpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIHdpbmRvdyA9IHJlcXVpcmUoXCJnbG9iYWwvd2luZG93XCIpXG52YXIgb25jZSA9IHJlcXVpcmUoXCJvbmNlXCIpXG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCJpcy1mdW5jdGlvblwiKVxudmFyIHBhcnNlSGVhZGVycyA9IHJlcXVpcmUoXCJwYXJzZS1oZWFkZXJzXCIpXG52YXIgeHRlbmQgPSByZXF1aXJlKFwieHRlbmRcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVYSFJcbmNyZWF0ZVhIUi5YTUxIdHRwUmVxdWVzdCA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCB8fCBub29wXG5jcmVhdGVYSFIuWERvbWFpblJlcXVlc3QgPSBcIndpdGhDcmVkZW50aWFsc1wiIGluIChuZXcgY3JlYXRlWEhSLlhNTEh0dHBSZXF1ZXN0KCkpID8gY3JlYXRlWEhSLlhNTEh0dHBSZXF1ZXN0IDogd2luZG93LlhEb21haW5SZXF1ZXN0XG5cbmZvckVhY2hBcnJheShbXCJnZXRcIiwgXCJwdXRcIiwgXCJwb3N0XCIsIFwicGF0Y2hcIiwgXCJoZWFkXCIsIFwiZGVsZXRlXCJdLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBjcmVhdGVYSFJbbWV0aG9kID09PSBcImRlbGV0ZVwiID8gXCJkZWxcIiA6IG1ldGhvZF0gPSBmdW5jdGlvbih1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIG9wdGlvbnMgPSBpbml0UGFyYW1zKHVyaSwgb3B0aW9ucywgY2FsbGJhY2spXG4gICAgICAgIG9wdGlvbnMubWV0aG9kID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICAgICAgcmV0dXJuIF9jcmVhdGVYSFIob3B0aW9ucylcbiAgICB9XG59KVxuXG5mdW5jdGlvbiBmb3JFYWNoQXJyYXkoYXJyYXksIGl0ZXJhdG9yKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRvcihhcnJheVtpXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqKXtcbiAgICBmb3IodmFyIGkgaW4gb2JqKXtcbiAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGkpKSByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gaW5pdFBhcmFtcyh1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhcmFtcyA9IHVyaVxuXG4gICAgaWYgKGlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2YgdXJpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBwYXJhbXMgPSB7dXJpOnVyaX1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtcyA9IHh0ZW5kKG9wdGlvbnMsIHt1cmk6IHVyaX0pXG4gICAgfVxuXG4gICAgcGFyYW1zLmNhbGxiYWNrID0gY2FsbGJhY2tcbiAgICByZXR1cm4gcGFyYW1zXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVhIUih1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgb3B0aW9ucyA9IGluaXRQYXJhbXModXJpLCBvcHRpb25zLCBjYWxsYmFjaylcbiAgICByZXR1cm4gX2NyZWF0ZVhIUihvcHRpb25zKVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlWEhSKG9wdGlvbnMpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrXG4gICAgaWYodHlwZW9mIGNhbGxiYWNrID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgYXJndW1lbnQgbWlzc2luZ1wiKVxuICAgIH1cbiAgICBjYWxsYmFjayA9IG9uY2UoY2FsbGJhY2spXG5cbiAgICBmdW5jdGlvbiByZWFkeXN0YXRlY2hhbmdlKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgIGxvYWRGdW5jKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEJvZHkoKSB7XG4gICAgICAgIC8vIENocm9tZSB3aXRoIHJlcXVlc3RUeXBlPWJsb2IgdGhyb3dzIGVycm9ycyBhcnJvdW5kIHdoZW4gZXZlbiB0ZXN0aW5nIGFjY2VzcyB0byByZXNwb25zZVRleHRcbiAgICAgICAgdmFyIGJvZHkgPSB1bmRlZmluZWRcblxuICAgICAgICBpZiAoeGhyLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICBib2R5ID0geGhyLnJlc3BvbnNlXG4gICAgICAgIH0gZWxzZSBpZiAoeGhyLnJlc3BvbnNlVHlwZSA9PT0gXCJ0ZXh0XCIgfHwgIXhoci5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgICAgIGJvZHkgPSB4aHIucmVzcG9uc2VUZXh0IHx8IHhoci5yZXNwb25zZVhNTFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzSnNvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib2R5XG4gICAgfVxuXG4gICAgdmFyIGZhaWx1cmVSZXNwb25zZSA9IHtcbiAgICAgICAgICAgICAgICBib2R5OiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMCxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICB1cmw6IHVyaSxcbiAgICAgICAgICAgICAgICByYXdSZXF1ZXN0OiB4aHJcbiAgICAgICAgICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yRnVuYyhldnQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRUaW1lcilcbiAgICAgICAgaWYoIShldnQgaW5zdGFuY2VvZiBFcnJvcikpe1xuICAgICAgICAgICAgZXZ0ID0gbmV3IEVycm9yKFwiXCIgKyAoZXZ0IHx8IFwiVW5rbm93biBYTUxIdHRwUmVxdWVzdCBFcnJvclwiKSApXG4gICAgICAgIH1cbiAgICAgICAgZXZ0LnN0YXR1c0NvZGUgPSAwXG4gICAgICAgIGNhbGxiYWNrKGV2dCwgZmFpbHVyZVJlc3BvbnNlKVxuICAgIH1cblxuICAgIC8vIHdpbGwgbG9hZCB0aGUgZGF0YSAmIHByb2Nlc3MgdGhlIHJlc3BvbnNlIGluIGEgc3BlY2lhbCByZXNwb25zZSBvYmplY3RcbiAgICBmdW5jdGlvbiBsb2FkRnVuYygpIHtcbiAgICAgICAgaWYgKGFib3J0ZWQpIHJldHVyblxuICAgICAgICB2YXIgc3RhdHVzXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0VGltZXIpXG4gICAgICAgIGlmKG9wdGlvbnMudXNlWERSICYmIHhoci5zdGF0dXM9PT11bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vSUU4IENPUlMgR0VUIHN1Y2Nlc3NmdWwgcmVzcG9uc2UgZG9lc24ndCBoYXZlIGEgc3RhdHVzIGZpZWxkLCBidXQgYm9keSBpcyBmaW5lXG4gICAgICAgICAgICBzdGF0dXMgPSAyMDBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXR1cyA9ICh4aHIuc3RhdHVzID09PSAxMjIzID8gMjA0IDogeGhyLnN0YXR1cylcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBmYWlsdXJlUmVzcG9uc2VcbiAgICAgICAgdmFyIGVyciA9IG51bGxcblxuICAgICAgICBpZiAoc3RhdHVzICE9PSAwKXtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgIGJvZHk6IGdldEJvZHkoKSxcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiBzdGF0dXMsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgICAgICAgICAgdXJsOiB1cmksXG4gICAgICAgICAgICAgICAgcmF3UmVxdWVzdDogeGhyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKXsgLy9yZW1lbWJlciB4aHIgY2FuIGluIGZhY3QgYmUgWERSIGZvciBDT1JTIGluIElFXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoXCJJbnRlcm5hbCBYTUxIdHRwUmVxdWVzdCBFcnJvclwiKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGVyciwgcmVzcG9uc2UsIHJlc3BvbnNlLmJvZHkpXG5cbiAgICB9XG5cbiAgICB2YXIgeGhyID0gb3B0aW9ucy54aHIgfHwgbnVsbFxuXG4gICAgaWYgKCF4aHIpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY29ycyB8fCBvcHRpb25zLnVzZVhEUikge1xuICAgICAgICAgICAgeGhyID0gbmV3IGNyZWF0ZVhIUi5YRG9tYWluUmVxdWVzdCgpXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgeGhyID0gbmV3IGNyZWF0ZVhIUi5YTUxIdHRwUmVxdWVzdCgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIga2V5XG4gICAgdmFyIGFib3J0ZWRcbiAgICB2YXIgdXJpID0geGhyLnVybCA9IG9wdGlvbnMudXJpIHx8IG9wdGlvbnMudXJsXG4gICAgdmFyIG1ldGhvZCA9IHhoci5tZXRob2QgPSBvcHRpb25zLm1ldGhvZCB8fCBcIkdFVFwiXG4gICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHkgfHwgb3B0aW9ucy5kYXRhIHx8IG51bGxcbiAgICB2YXIgaGVhZGVycyA9IHhoci5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9XG4gICAgdmFyIHN5bmMgPSAhIW9wdGlvbnMuc3luY1xuICAgIHZhciBpc0pzb24gPSBmYWxzZVxuICAgIHZhciB0aW1lb3V0VGltZXJcblxuICAgIGlmIChcImpzb25cIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIGlzSnNvbiA9IHRydWVcbiAgICAgICAgaGVhZGVyc1tcImFjY2VwdFwiXSB8fCBoZWFkZXJzW1wiQWNjZXB0XCJdIHx8IChoZWFkZXJzW1wiQWNjZXB0XCJdID0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIC8vRG9uJ3Qgb3ZlcnJpZGUgZXhpc3RpbmcgYWNjZXB0IGhlYWRlciBkZWNsYXJlZCBieSB1c2VyXG4gICAgICAgIGlmIChtZXRob2QgIT09IFwiR0VUXCIgJiYgbWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgICAgICAgaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSB8fCBoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdIHx8IChoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIC8vRG9uJ3Qgb3ZlcnJpZGUgZXhpc3RpbmcgYWNjZXB0IGhlYWRlciBkZWNsYXJlZCBieSB1c2VyXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5qc29uKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHJlYWR5c3RhdGVjaGFuZ2VcbiAgICB4aHIub25sb2FkID0gbG9hZEZ1bmNcbiAgICB4aHIub25lcnJvciA9IGVycm9yRnVuY1xuICAgIC8vIElFOSBtdXN0IGhhdmUgb25wcm9ncmVzcyBiZSBzZXQgdG8gYSB1bmlxdWUgZnVuY3Rpb24uXG4gICAgeGhyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIElFIG11c3QgZGllXG4gICAgfVxuICAgIHhoci5vbnRpbWVvdXQgPSBlcnJvckZ1bmNcbiAgICB4aHIub3BlbihtZXRob2QsIHVyaSwgIXN5bmMsIG9wdGlvbnMudXNlcm5hbWUsIG9wdGlvbnMucGFzc3dvcmQpXG4gICAgLy9oYXMgdG8gYmUgYWZ0ZXIgb3BlblxuICAgIGlmKCFzeW5jKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSAhIW9wdGlvbnMud2l0aENyZWRlbnRpYWxzXG4gICAgfVxuICAgIC8vIENhbm5vdCBzZXQgdGltZW91dCB3aXRoIHN5bmMgcmVxdWVzdFxuICAgIC8vIG5vdCBzZXR0aW5nIHRpbWVvdXQgb24gdGhlIHhociBvYmplY3QsIGJlY2F1c2Ugb2Ygb2xkIHdlYmtpdHMgZXRjLiBub3QgaGFuZGxpbmcgdGhhdCBjb3JyZWN0bHlcbiAgICAvLyBib3RoIG5wbSdzIHJlcXVlc3QgYW5kIGpxdWVyeSAxLnggdXNlIHRoaXMga2luZCBvZiB0aW1lb3V0LCBzbyB0aGlzIGlzIGJlaW5nIGNvbnNpc3RlbnRcbiAgICBpZiAoIXN5bmMgJiYgb3B0aW9ucy50aW1lb3V0ID4gMCApIHtcbiAgICAgICAgdGltZW91dFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgYWJvcnRlZD10cnVlLy9JRTkgbWF5IHN0aWxsIGNhbGwgcmVhZHlzdGF0ZWNoYW5nZVxuICAgICAgICAgICAgeGhyLmFib3J0KFwidGltZW91dFwiKVxuICAgICAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoXCJYTUxIdHRwUmVxdWVzdCB0aW1lb3V0XCIpXG4gICAgICAgICAgICBlLmNvZGUgPSBcIkVUSU1FRE9VVFwiXG4gICAgICAgICAgICBlcnJvckZ1bmMoZSlcbiAgICAgICAgfSwgb3B0aW9ucy50aW1lb3V0IClcbiAgICB9XG5cbiAgICBpZiAoeGhyLnNldFJlcXVlc3RIZWFkZXIpIHtcbiAgICAgICAgZm9yKGtleSBpbiBoZWFkZXJzKXtcbiAgICAgICAgICAgIGlmKGhlYWRlcnMuaGFzT3duUHJvcGVydHkoa2V5KSl7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBoZWFkZXJzW2tleV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaGVhZGVycyAmJiAhaXNFbXB0eShvcHRpb25zLmhlYWRlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkhlYWRlcnMgY2Fubm90IGJlIHNldCBvbiBhbiBYRG9tYWluUmVxdWVzdCBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAoXCJyZXNwb25zZVR5cGVcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSBvcHRpb25zLnJlc3BvbnNlVHlwZVxuICAgIH1cblxuICAgIGlmIChcImJlZm9yZVNlbmRcIiBpbiBvcHRpb25zICYmXG4gICAgICAgIHR5cGVvZiBvcHRpb25zLmJlZm9yZVNlbmQgPT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgICBvcHRpb25zLmJlZm9yZVNlbmQoeGhyKVxuICAgIH1cblxuICAgIHhoci5zZW5kKGJvZHkpXG5cbiAgICByZXR1cm4geGhyXG5cblxufVxuXG5mdW5jdGlvbiBub29wKCkge31cbiIsIm1vZHVsZS5leHBvcnRzID0gb25jZVxuXG5vbmNlLnByb3RvID0gb25jZShmdW5jdGlvbiAoKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGdW5jdGlvbi5wcm90b3R5cGUsICdvbmNlJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gb25jZSh0aGlzKVxuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59KVxuXG5mdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm5cbiAgICBjYWxsZWQgPSB0cnVlXG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsInZhciB4aHIgPSByZXF1aXJlKCd4aHInKVxuXG4vL3ZhciBjdXJyZW50SW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Fyb3VzZWwtaW1hZ2UnKVxudmFyIGN1cnJlbnRTdGF0ZSA9IDBcblxudmFyIGxlZnRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVmdC1jb250cm9sJylcbnZhciByaWdodEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyaWdodC1jb250cm9sJylcblxudmFyIGluZGljYXRvcnMgPSBbXVxudmFyIGl0ZW1JbWFnZXMgPSBbXVxuXG5jb25zb2xlLmxvZygnaGVyZSEnKVxueGhyKCcvY2Fyb3VzZWwtcGhvdG9zJywgZnVuY3Rpb24gKGVyciwgcmVzcCwgYm9keSkge1xuXHRpZiAoZXJyKSBjb25zb2xlLmxvZyhlcnIpXG5cdGVsc2V7IFxuXHRcdGNvbnNvbGUubG9nKCdpbiBlbHNlJylcblx0XHR2YXIgaW1hZ2VzID0gSlNPTi5wYXJzZShib2R5KVxuXHRcdGltYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKGltYWdlVXJpLCBpbmRleCkge1xuXHRcdFx0dmFyIG5ld0xpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuXHRcdFx0Ly92YXIgbmV3Q29udGVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdyYXdyJylcblx0XHRcdC8vbmV3TGkuYXBwZW5kQ2hpbGQobmV3Q29udGVudClcblx0XHRcdG5ld0xpLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaW5kaWNhdG9yJylcblx0XHRcdFxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2luZGljYXRvci1vbCcpLmFwcGVuZENoaWxkKG5ld0xpKVxuXHRcdFx0aW5kaWNhdG9ycy5wdXNoKG5ld0xpKVxuXHRcdFx0XG5cdFx0XHR2YXIgbmV3SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRuZXdJdGVtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaXRlbScpXG5cdFx0XHRcblx0XHRcdHZhciBuZXdJbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpXG5cdFx0XHRuZXdJbWFnZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIFwiaW1nL2Nhcm91c2VsLWltYWdlcy9cIisgaW1hZ2VzW2luZGV4XSlcblx0XHRcdGNvbnNvbGUubG9nKCduZXdJdGVtJywgbmV3SXRlbSlcdFxuXHRcdFx0bmV3SXRlbS5hcHBlbmRDaGlsZChuZXdJbWFnZSlcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS13cmFwcGVyJykuYXBwZW5kQ2hpbGQobmV3SXRlbSlcblx0XHRcdFxuXHRcdFx0aXRlbUltYWdlcy5wdXNoKG5ld0l0ZW0pXG5cdFx0fSlcblx0XHRcblx0XHRcdFxuXHRcdC8vY3VycmVudEltYWdlLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcImltZy9jYXJvdXNlbC1pbWFnZXMvXCIrIGltYWdlc1tjdXJyZW50U3RhdGVdKVxuXHRcdGluZGljYXRvcnNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2luZGljYXRvciBhY3RpdmUnKVxuXHRcdGl0ZW1JbWFnZXNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2l0ZW0gYWN0aXZlJylcdFxuXHRcdFxuXHRcdGxlZnRCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGluZGljYXRvcnNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2luZGljYXRvcnMnKVxuXHRcdFx0aXRlbUltYWdlc1tjdXJyZW50U3RhdGVdLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaXRlbScpXG5cdFx0XHRcblx0XHRcdGlmIChjdXJyZW50U3RhdGUgPT09IDApeyBjdXJyZW50U3RhdGUgPSBpbWFnZXMubGVuZ3RoLTEgfSBcblx0XHRcdGVsc2UgeyBjdXJyZW50U3RhdGUtLSB9XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0Ly9jdXJyZW50SW1hZ2Uuc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiaW1nL2Nhcm91c2VsLWltYWdlcy9cIisgaW1hZ2VzW2N1cnJlbnRTdGF0ZV0pXG5cdFx0XHRpbmRpY2F0b3JzW2N1cnJlbnRTdGF0ZV0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdpbmRpY2F0b3IgYWN0aXZlJylcblx0XHRcdGl0ZW1JbWFnZXNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2l0ZW0gYWN0aXZlJylcdFxuXHRcdH1cdFxuXHRcdHJpZ2h0QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpbmRpY2F0b3JzW2N1cnJlbnRTdGF0ZV0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdpbmRpY2F0b3JzJylcblx0XHRcdGl0ZW1JbWFnZXNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2l0ZW0nKVxuXHRcdFx0XG5cdFx0XHRpZiAoY3VycmVudFN0YXRlID09PSBpbWFnZXMubGVuZ3RoLTEpeyBjdXJyZW50U3RhdGUgPSAwIH0gXG5cdFx0XHRlbHNlIHsgY3VycmVudFN0YXRlKysgfVxuXHRcdFx0XG5cdFx0XHQvL2N1cnJlbnRJbWFnZS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCJpbWcvY2Fyb3VzZWwtaW1hZ2VzL1wiKyBpbWFnZXNbY3VycmVudFN0YXRlXSlcblx0XHRcdGluZGljYXRvcnNbY3VycmVudFN0YXRlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2luZGljYXRvciBhY3RpdmUnKVxuXHRcdFx0aXRlbUltYWdlc1tjdXJyZW50U3RhdGVdLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaXRlbSBhY3RpdmUnKVx0XG5cdFx0fVx0XG5cdH1cbn0pXG5cbiIsInZhciBkcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcm9wZG93bkxpJylcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcm9wZG93bi11bCcpLnN0eWxlLmRpc3BsYXk9J25vbmUnXG5cbmRyb3Bkb3duLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBkcm9wZG93blVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Ryb3Bkb3duLXVsJylcblx0aWYgKGRyb3Bkb3duVWwuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG5cdFx0ZHJvcGRvd25VbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jaydcblx0fSBlbHNlIHtcblx0XHRkcm9wZG93blVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblx0fVxufVxuIiwiXHRcdC8qXG5cdFx0dmFyIGFjdGl2ZSA9IDAgdmFyIGxlZnRDb250cm9sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlZnQtY29udHJvbCcpXG5cdFx0dmFyIHJpZ2h0Q29udHJvbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyaWdodC1jb250cm9sJylcblx0XHR2YXIgaW5kaWNhdG9ycyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2luZGljYXRvcicpXG5cdFx0dmFyIG51bUl0ZW1zID0gaW5kaWNhdG9ycy5sZW5ndGhcblx0XHRcblx0XHRjb25zb2xlLmxvZygnaW5kaWNhdG9ycycsIGluZGljYXRvcnMpXG5cdFx0Y29uc29sZS5sb2coJzEgaW5kaWNhdG9yJywgaW5kaWNhdG9yc1thY3RpdmVdKVxuXHRcdGZvciAodmFyIGkgPTAgOyBpIDwgaW5kaWNhdG9ycy5sZW5ndGggOyBpKyspe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdpJywgaSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnKiBpbmRpY2F0b3InLCBpbmRpY2F0b3JzW2ldKVxuXHRcdH1cdFxuXHRcdGxlZnRDb250cm9sLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZihhY3RpdmUgPT09IDApeyBcblx0XHRcdFx0Y29uc29sZS5sb2coJzIgaW5kaWNhdG9ycycsIGluZGljYXRvcnMpXG5cdFx0XHRcdC8vIHJlbW92ZSBhY3RpdmUgY2xhc3MgZnJvbSBvbGQgaW5kaWNhdG9yXG5cdFx0XHRcdGluZGljYXRvcnNbYWN0aXZlXS5yZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJywgJ2FjdGl2ZScpXG5cdFx0XHRcblx0XHRcdFx0Y29uc29sZS5sb2coJzMgaW5kaWNhdG9ycycsIGluZGljYXRvcnMpXG5cdFx0XHRcdC8vIHNldCBuZXcgYWN0aXZlIHZhbHVlXG5cdFx0XHRcdGFjdGl2ZSA9IG51bUl0ZW1zIC0gMSBcblx0XHRcdFx0Y29uc29sZS5sb2coJ251bUl0ZW1zJywgbnVtSXRlbXMpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdhY3RpdmUnLCBhY3RpdmUpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCcyIGluZGljYXRvcnMnLCBpbmRpY2F0b3JzKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnQUknLCBpbmRpY2F0b3JzW2FjdGl2ZV0pXG5cdFx0XHRcdFxuXHRcdFx0XHQvLyByZW1vdmUgYWN0aXZlIGNsYXNzIGZyb20gb2xkIGluZGljYXRvclxuXHRcdFx0XHRpbmRpY2F0b3JzW2FjdGl2ZV0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdhY3RpdmUnKVxuXHRcdFx0fVx0XG5cdFx0XHRlbHNlIHsgXG5cdFx0XHRcdC8vIHJlbW92ZSBhY3RpdmUgY2xhc3MgZnJvbSBvbGQgaW5kaWNhdG9yXG5cdFx0XHRcdGluZGljYXRvcnNbYWN0aXZlXS5yZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJywgJ2FjdGl2ZScpXG5cdFx0XHRcblx0XHRcdFx0Ly8gc2V0IG5ldyBhY3RpdmUgdmFsdWVcblx0XHRcdFx0YWN0aXZlLS0gXG5cdFx0XHRcdFxuXHRcdFx0XHQvLyByZW1vdmUgYWN0aXZlIGNsYXNzIGZyb20gb2xkIGluZGljYXRvclxuXHRcdFx0XHRpbmRpY2F0b3JzW2FjdGl2ZV0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdhY3RpdmUnKVxuXHRcdFx0IH1cblx0XHR9XG5cdFx0cmlnaHRDb250cm9sLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnQWFhYWFoISEhJylcblx0XHRcdGlmKGFjdGl2ZSA9PT0gbnVtSXRlbXMgLSAxKXsgXG5cdFx0XHRcdC8vIHJlbW92ZSBhY3RpdmUgY2xhc3MgZnJvbSBvbGQgaW5kaWNhdG9yXG5cdFx0XHRcdGluZGljYXRvcnNbYWN0aXZlXS5yZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJywgJ2FjdGl2ZScpXG5cdFx0XHRcblx0XHRcdFx0Ly8gc2V0IG5ldyBhY3RpdmUgdmFsdWVcblx0XHRcdFx0YWN0aXZlID0gMCBcblx0XHRcdFx0XG5cdFx0XHRcdC8vIHJlbW92ZSBhY3RpdmUgY2xhc3MgZnJvbSBvbGQgaW5kaWNhdG9yXG5cdFx0XHRcdGluZGljYXRvcnNbYWN0aXZlXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2FjdGl2ZScpXG5cdFx0XHR9XHRcblx0XHRcdGVsc2UgeyBcblx0XHRcdFx0Ly8gcmVtb3ZlIGFjdGl2ZSBjbGFzcyBmcm9tIG9sZCBpbmRpY2F0b3Jcblx0XHRcdFx0aW5kaWNhdG9yc1thY3RpdmVdLnJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnLCAnYWN0aXZlJylcblx0XHRcdFxuXHRcdFx0XHQvLyBzZXQgbmV3IGFjdGl2ZSB2YWx1ZVxuXHRcdFx0XHRhY3RpdmUrK1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gcmVtb3ZlIGFjdGl2ZSBjbGFzcyBmcm9tIG9sZCBpbmRpY2F0b3Jcblx0XHRcdFx0aW5kaWNhdG9yc1thY3RpdmVdLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYWN0aXZlJylcblx0XHRcdCB9XG5cdFx0fVxuXHRcdCovXG4iLCJ2YXIgdmlkZW9zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZGVvLWdyaWQnKS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdncmlkLXZpZCcpXG5kb2N1bWVudC5vbmxvYWQgPSBwbGF5ZXIoMClcblxuZnVuY3Rpb24gcGxheWVyIChpKXtcblx0dmFyIHZpZGVvID0gdmlkZW9zW2ldXG5cdFxuXHR2aWRlby5wbGF5KClcblx0dmlkZW8ub25lbmRlZCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmlkZW8uY3VycmVudFRpbWUgPSAwXG5cdFx0aWYoaSA9PT0gNCkgcGxheWVyKDApXG5cdFx0ZWxzZSBwbGF5ZXIoaSsxKVx0XG5cdH1cbn1cbiJdfQ==
