try {
	self["workbox:window:7.3.0"] && _();
} catch (n$1) {}
function n(n$1, t$1) {
	return new Promise((function(r$1) {
		var e$1 = new MessageChannel();
		e$1.port1.onmessage = function(n$2) {
			r$1(n$2.data);
		}, n$1.postMessage(t$1, [e$1.port2]);
	}));
}
function t(n$1, t$1) {
	(null == t$1 || t$1 > n$1.length) && (t$1 = n$1.length);
	for (var r$1 = 0, e$1 = Array(t$1); r$1 < t$1; r$1++) e$1[r$1] = n$1[r$1];
	return e$1;
}
function r(n$1, t$1) {
	for (var r$1 = 0; r$1 < t$1.length; r$1++) {
		var e$1 = t$1[r$1];
		e$1.enumerable = e$1.enumerable || !1, e$1.configurable = !0, "value" in e$1 && (e$1.writable = !0), Object.defineProperty(n$1, o(e$1.key), e$1);
	}
}
function e(n$1, r$1) {
	var e$1 = "undefined" != typeof Symbol && n$1[Symbol.iterator] || n$1["@@iterator"];
	if (e$1) return (e$1 = e$1.call(n$1)).next.bind(e$1);
	if (Array.isArray(n$1) || (e$1 = function(n$2, r$2) {
		if (n$2) {
			if ("string" == typeof n$2) return t(n$2, r$2);
			var e$2 = {}.toString.call(n$2).slice(8, -1);
			return "Object" === e$2 && n$2.constructor && (e$2 = n$2.constructor.name), "Map" === e$2 || "Set" === e$2 ? Array.from(n$2) : "Arguments" === e$2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e$2) ? t(n$2, r$2) : void 0;
		}
	}(n$1)) || r$1 && n$1 && "number" == typeof n$1.length) {
		e$1 && (n$1 = e$1);
		var i$1 = 0;
		return function() {
			return i$1 >= n$1.length ? { done: !0 } : {
				done: !1,
				value: n$1[i$1++]
			};
		};
	}
	throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function i(n$1, t$1) {
	return i = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(n$2, t$2) {
		return n$2.__proto__ = t$2, n$2;
	}, i(n$1, t$1);
}
function o(n$1) {
	var t$1 = function(n$2, t$2) {
		if ("object" != typeof n$2 || !n$2) return n$2;
		var r$1 = n$2[Symbol.toPrimitive];
		if (void 0 !== r$1) {
			var e$1 = r$1.call(n$2, t$2 || "default");
			if ("object" != typeof e$1) return e$1;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === t$2 ? String : Number)(n$2);
	}(n$1, "string");
	return "symbol" == typeof t$1 ? t$1 : t$1 + "";
}
try {
	self["workbox:core:7.3.0"] && _();
} catch (n$1) {}
var u = function() {
	var n$1 = this;
	this.promise = new Promise((function(t$1, r$1) {
		n$1.resolve = t$1, n$1.reject = r$1;
	}));
};
function a(n$1, t$1) {
	var r$1 = location.href;
	return new URL(n$1, r$1).href === new URL(t$1, r$1).href;
}
var c = function(n$1, t$1) {
	this.type = n$1, Object.assign(this, t$1);
};
function f(n$1, t$1, r$1) {
	return r$1 ? t$1 ? t$1(n$1) : n$1 : (n$1 && n$1.then || (n$1 = Promise.resolve(n$1)), t$1 ? n$1.then(t$1) : n$1);
}
function s() {}
var v = { type: "SKIP_WAITING" };
function h(n$1, t$1) {
	if (!t$1) return n$1 && n$1.then ? n$1.then(s) : Promise.resolve();
}
var l = function(t$1) {
	function e$1(n$1, r$1) {
		var e$2, i$1;
		return void 0 === r$1 && (r$1 = {}), (e$2 = t$1.call(this) || this).nn = {}, e$2.tn = 0, e$2.rn = new u(), e$2.en = new u(), e$2.on = new u(), e$2.un = 0, e$2.an = /* @__PURE__ */ new Set(), e$2.cn = function() {
			var n$2 = e$2.fn, t$2 = n$2.installing;
			e$2.tn > 0 || !a(t$2.scriptURL, e$2.sn.toString()) || performance.now() > e$2.un + 6e4 ? (e$2.vn = t$2, n$2.removeEventListener("updatefound", e$2.cn)) : (e$2.hn = t$2, e$2.an.add(t$2), e$2.rn.resolve(t$2)), ++e$2.tn, t$2.addEventListener("statechange", e$2.ln);
		}, e$2.ln = function(n$2) {
			var t$2 = e$2.fn, r$2 = n$2.target, i$2 = r$2.state, o$2 = r$2 === e$2.vn, u$1 = {
				sw: r$2,
				isExternal: o$2,
				originalEvent: n$2
			};
			!o$2 && e$2.mn && (u$1.isUpdate = !0), e$2.dispatchEvent(new c(i$2, u$1)), "installed" === i$2 ? e$2.wn = self.setTimeout((function() {
				"installed" === i$2 && t$2.waiting === r$2 && e$2.dispatchEvent(new c("waiting", u$1));
			}), 200) : "activating" === i$2 && (clearTimeout(e$2.wn), o$2 || e$2.en.resolve(r$2));
		}, e$2.yn = function(n$2) {
			var t$2 = e$2.hn, r$2 = t$2 !== navigator.serviceWorker.controller;
			e$2.dispatchEvent(new c("controlling", {
				isExternal: r$2,
				originalEvent: n$2,
				sw: t$2,
				isUpdate: e$2.mn
			})), r$2 || e$2.on.resolve(t$2);
		}, e$2.gn = (i$1 = function(n$2) {
			var t$2 = n$2.data, r$2 = n$2.ports, i$2 = n$2.source;
			return f(e$2.getSW(), (function() {
				e$2.an.has(i$2) && e$2.dispatchEvent(new c("message", {
					data: t$2,
					originalEvent: n$2,
					ports: r$2,
					sw: i$2
				}));
			}));
		}, function() {
			for (var n$2 = [], t$2 = 0; t$2 < arguments.length; t$2++) n$2[t$2] = arguments[t$2];
			try {
				return Promise.resolve(i$1.apply(this, n$2));
			} catch (n$3) {
				return Promise.reject(n$3);
			}
		}), e$2.sn = n$1, e$2.nn = r$1, navigator.serviceWorker.addEventListener("message", e$2.gn), e$2;
	}
	var o$1, s$1 = t$1;
	(o$1 = e$1).prototype = Object.create(s$1.prototype), o$1.prototype.constructor = o$1, i(o$1, s$1);
	var l$1 = e$1.prototype;
	return l$1.register = function(n$1) {
		var t$2 = (void 0 === n$1 ? {} : n$1).immediate, r$1 = void 0 !== t$2 && t$2;
		try {
			var e$2 = this;
			return f(function(n$2, t$3) {
				var r$2 = n$2();
				if (r$2 && r$2.then) return r$2.then(t$3);
				return t$3(r$2);
			}((function() {
				if (!r$1 && "complete" !== document.readyState) return h(new Promise((function(n$2) {
					return window.addEventListener("load", n$2);
				})));
			}), (function() {
				return e$2.mn = Boolean(navigator.serviceWorker.controller), e$2.dn = e$2.pn(), f(e$2.bn(), (function(n$2) {
					e$2.fn = n$2, e$2.dn && (e$2.hn = e$2.dn, e$2.en.resolve(e$2.dn), e$2.on.resolve(e$2.dn), e$2.dn.addEventListener("statechange", e$2.ln, { once: !0 }));
					var t$3 = e$2.fn.waiting;
					return t$3 && a(t$3.scriptURL, e$2.sn.toString()) && (e$2.hn = t$3, Promise.resolve().then((function() {
						e$2.dispatchEvent(new c("waiting", {
							sw: t$3,
							wasWaitingBeforeRegister: !0
						}));
					})).then((function() {}))), e$2.hn && (e$2.rn.resolve(e$2.hn), e$2.an.add(e$2.hn)), e$2.fn.addEventListener("updatefound", e$2.cn), navigator.serviceWorker.addEventListener("controllerchange", e$2.yn), e$2.fn;
				}));
			})));
		} catch (n$2) {
			return Promise.reject(n$2);
		}
	}, l$1.update = function() {
		try {
			return this.fn ? f(h(this.fn.update())) : f();
		} catch (n$1) {
			return Promise.reject(n$1);
		}
	}, l$1.getSW = function() {
		return void 0 !== this.hn ? Promise.resolve(this.hn) : this.rn.promise;
	}, l$1.messageSW = function(t$2) {
		try {
			return f(this.getSW(), (function(r$1) {
				return n(r$1, t$2);
			}));
		} catch (n$1) {
			return Promise.reject(n$1);
		}
	}, l$1.messageSkipWaiting = function() {
		this.fn && this.fn.waiting && n(this.fn.waiting, v);
	}, l$1.pn = function() {
		var n$1 = navigator.serviceWorker.controller;
		return n$1 && a(n$1.scriptURL, this.sn.toString()) ? n$1 : void 0;
	}, l$1.bn = function() {
		try {
			var n$1 = this;
			return f(function(n$2, t$2) {
				try {
					var r$1 = n$2();
				} catch (n$3) {
					return t$2(n$3);
				}
				if (r$1 && r$1.then) return r$1.then(void 0, t$2);
				return r$1;
			}((function() {
				return f(navigator.serviceWorker.register(n$1.sn, n$1.nn), (function(t$2) {
					return n$1.un = performance.now(), t$2;
				}));
			}), (function(n$2) {
				throw n$2;
			})));
		} catch (n$2) {
			return Promise.reject(n$2);
		}
	}, function(n$1, t$2, e$2) {
		return t$2 && r(n$1.prototype, t$2), e$2 && r(n$1, e$2), Object.defineProperty(n$1, "prototype", { writable: !1 }), n$1;
	}(e$1, [{
		key: "active",
		get: function() {
			return this.en.promise;
		}
	}, {
		key: "controlling",
		get: function() {
			return this.on.promise;
		}
	}]);
}(function() {
	function n$1() {
		this.Pn = /* @__PURE__ */ new Map();
	}
	var t$1 = n$1.prototype;
	return t$1.addEventListener = function(n$2, t$2) {
		this.jn(n$2).add(t$2);
	}, t$1.removeEventListener = function(n$2, t$2) {
		this.jn(n$2).delete(t$2);
	}, t$1.dispatchEvent = function(n$2) {
		n$2.target = this;
		for (var t$2, r$1 = e(this.jn(n$2.type)); !(t$2 = r$1()).done;) (0, t$2.value)(n$2);
	}, t$1.jn = function(n$2) {
		return this.Pn.has(n$2) || this.Pn.set(n$2, /* @__PURE__ */ new Set()), this.Pn.get(n$2);
	}, n$1;
}());
export { l as Workbox };
