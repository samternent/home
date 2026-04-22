import { Fragment, Transition, cloneVNode, computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, createTextVNode, createVNode, defineComponent, getCurrentInstance, guardReactiveProps, h, inject, isRef, mergeDefaults, mergeModels, mergeProps, nextTick, normalizeClass, normalizeProps, normalizeStyle, onBeforeUnmount, onMounted, onUnmounted, openBlock, popScopeId, provide, pushScopeId, ref, renderList, renderSlot, resolveComponent, resolveDynamicComponent, shallowRef, toDisplayString, toValue, unref, useAttrs, useId, useModel, useSlots, vModelCheckbox, vModelText, watch, withCtx, withDirectives, withModifiers } from "vue";
import { breakpointsTailwind, onClickOutside, useBreakpoints, useDraggable, useElementBounding, useElementSize, useLocalStorage } from "@vueuse/core";
function Rt$2() {
	for (var e = 0, t, r, n$1 = ""; e < arguments.length;) (t = arguments[e++]) && (r = Ye$1(t)) && (n$1 && (n$1 += " "), n$1 += r);
	return n$1;
}
function Ye$1(e) {
	if (typeof e == "string") return e;
	for (var t, r = "", n$1 = 0; n$1 < e.length; n$1++) e[n$1] && (t = Ye$1(e[n$1])) && (r && (r += " "), r += t);
	return r;
}
var ke = "-";
function Lt$2(e) {
	var t = jt$1(e), r = e.conflictingClassGroups, n$1 = e.conflictingClassGroupModifiers, o = n$1 === void 0 ? {} : n$1;
	function a(i) {
		var l$1 = i.split(ke);
		return l$1[0] === "" && l$1.length !== 1 && l$1.shift(), Qe$2(l$1, t) || zt$1(i);
	}
	function s$1(i, l$1) {
		var u = r[i] || [];
		return l$1 && o[i] ? [].concat(u, o[i]) : u;
	}
	return {
		getClassGroupId: a,
		getConflictingClassGroupIds: s$1
	};
}
function Qe$2(e, t) {
	if (e.length === 0) return t.classGroupId;
	var r = e[0], n$1 = t.nextPart.get(r), o = n$1 ? Qe$2(e.slice(1), n$1) : void 0;
	if (o) return o;
	if (t.validators.length !== 0) {
		var a = e.join(ke);
		return t.validators.find(function(s$1) {
			var i = s$1.validator;
			return i(a);
		})?.classGroupId;
	}
}
var Ue = /^\[(.+)\]$/;
function zt$1(e) {
	if (Ue.test(e)) {
		var t = Ue.exec(e)[1], r = t?.substring(0, t.indexOf(":"));
		if (r) return "arbitrary.." + r;
	}
}
function jt$1(e) {
	var t = e.theme, r = e.prefix, n$1 = {
		nextPart: /* @__PURE__ */ new Map(),
		validators: []
	};
	return _t$1(Object.entries(e.classGroups), r).forEach(function(a) {
		var s$1 = a[0], i = a[1];
		Ce$1(i, n$1, s$1, t);
	}), n$1;
}
function Ce$1(e, t, r, n$1) {
	e.forEach(function(o) {
		if (typeof o == "string") {
			var a = o === "" ? t : Be$1(t, o);
			a.classGroupId = r;
			return;
		}
		if (typeof o == "function") {
			if (Ft$2(o)) {
				Ce$1(o(n$1), t, r, n$1);
				return;
			}
			t.validators.push({
				validator: o,
				classGroupId: r
			});
			return;
		}
		Object.entries(o).forEach(function(s$1) {
			var i = s$1[0], l$1 = s$1[1];
			Ce$1(l$1, Be$1(t, i), r, n$1);
		});
	});
}
function Be$1(e, t) {
	var r = e;
	return t.split(ke).forEach(function(n$1) {
		r.nextPart.has(n$1) || r.nextPart.set(n$1, {
			nextPart: /* @__PURE__ */ new Map(),
			validators: []
		}), r = r.nextPart.get(n$1);
	}), r;
}
function Ft$2(e) {
	return e.isThemeGetter;
}
function _t$1(e, t) {
	return t ? e.map(function(r) {
		return [r[0], r[1].map(function(s$1) {
			return typeof s$1 == "string" ? t + s$1 : typeof s$1 == "object" ? Object.fromEntries(Object.entries(s$1).map(function(i) {
				var l$1 = i[0], u = i[1];
				return [t + l$1, u];
			})) : s$1;
		})];
	}) : e;
}
function Gt$1(e) {
	if (e < 1) return {
		get: function() {},
		set: function() {}
	};
	var t = 0, r = /* @__PURE__ */ new Map(), n$1 = /* @__PURE__ */ new Map();
	function o(a, s$1) {
		r.set(a, s$1), t++, t > e && (t = 0, n$1 = r, r = /* @__PURE__ */ new Map());
	}
	return {
		get: function(s$1) {
			var i = r.get(s$1);
			if (i !== void 0) return i;
			if ((i = n$1.get(s$1)) !== void 0) return o(s$1, i), i;
		},
		set: function(s$1, i) {
			r.has(s$1) ? r.set(s$1, i) : o(s$1, i);
		}
	};
}
var et$1 = "!";
function Dt$2(e) {
	var t = e.separator || ":", r = t.length === 1, n$1 = t[0], o = t.length;
	return function(s$1) {
		for (var i = [], l$1 = 0, u = 0, c, d = 0; d < s$1.length; d++) {
			var g = s$1[d];
			if (l$1 === 0) {
				if (g === n$1 && (r || s$1.slice(d, d + o) === t)) {
					i.push(s$1.slice(u, d)), u = d + o;
					continue;
				}
				if (g === "/") {
					c = d;
					continue;
				}
			}
			g === "[" ? l$1++ : g === "]" && l$1--;
		}
		var m = i.length === 0 ? s$1 : s$1.substring(u), y = m.startsWith(et$1);
		return {
			modifiers: i,
			hasImportantModifier: y,
			baseClassName: y ? m.substring(1) : m,
			maybePostfixModifierPosition: c && c > u ? c - u : void 0
		};
	};
}
function Vt$2(e) {
	if (e.length <= 1) return e;
	var t = [], r = [];
	return e.forEach(function(n$1) {
		n$1[0] === "[" ? (t.push.apply(t, r.sort().concat([n$1])), r = []) : r.push(n$1);
	}), t.push.apply(t, r.sort()), t;
}
function $t$1(e) {
	return {
		cache: Gt$1(e.cacheSize),
		splitModifiers: Dt$2(e),
		...Lt$2(e)
	};
}
var Ut = /\s+/;
function Bt$1(e, t) {
	var r = t.splitModifiers, n$1 = t.getClassGroupId, o = t.getConflictingClassGroupIds, a = /* @__PURE__ */ new Set();
	return e.trim().split(Ut).map(function(s$1) {
		var i = r(s$1), l$1 = i.modifiers, u = i.hasImportantModifier, c = i.baseClassName, d = i.maybePostfixModifierPosition, g = n$1(d ? c.substring(0, d) : c), m = !!d;
		if (!g) {
			if (!d) return {
				isTailwindClass: !1,
				originalClassName: s$1
			};
			if (g = n$1(c), !g) return {
				isTailwindClass: !1,
				originalClassName: s$1
			};
			m = !1;
		}
		var y = Vt$2(l$1).join(":");
		return {
			isTailwindClass: !0,
			modifierId: u ? y + et$1 : y,
			classGroupId: g,
			originalClassName: s$1,
			hasPostfixModifier: m
		};
	}).reverse().filter(function(s$1) {
		if (!s$1.isTailwindClass) return !0;
		var i = s$1.modifierId, l$1 = s$1.classGroupId, u = s$1.hasPostfixModifier, c = i + l$1;
		return a.has(c) ? !1 : (a.add(c), o(l$1, u).forEach(function(d) {
			return a.add(i + d);
		}), !0);
	}).reverse().map(function(s$1) {
		return s$1.originalClassName;
	}).join(" ");
}
function Wt$1() {
	for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++) t[r] = arguments[r];
	var n$1, o, a, s$1 = i;
	function i(u) {
		var c = t[0];
		return n$1 = $t$1(t.slice(1).reduce(function(m, y) {
			return y(m);
		}, c())), o = n$1.cache.get, a = n$1.cache.set, s$1 = l$1, l$1(u);
	}
	function l$1(u) {
		var c = o(u);
		if (c) return c;
		var d = Bt$1(u, n$1);
		return a(u, d), d;
	}
	return function() {
		return s$1(Rt$2.apply(null, arguments));
	};
}
function x(e) {
	var t = function(n$1) {
		return n$1[e] || [];
	};
	return t.isThemeGetter = !0, t;
}
var tt$1 = /^\[(?:([a-z-]+):)?(.+)\]$/i, Kt = /^\d+\/\d+$/, qt$1 = /* @__PURE__ */ new Set([
	"px",
	"full",
	"screen"
]), Ht$1 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Xt$2 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Zt$1 = /^-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
function R$2(e) {
	return D(e) || qt$1.has(e) || Kt.test(e) || Ne(e);
}
function Ne(e) {
	return $$1(e, "length", rr$1);
}
function Jt$2(e) {
	return $$1(e, "size", rt$1);
}
function Yt$2(e) {
	return $$1(e, "position", rt$1);
}
function Qt$2(e) {
	return $$1(e, "url", nr$2);
}
function re(e) {
	return $$1(e, "number", D);
}
function D(e) {
	return !Number.isNaN(Number(e));
}
function er$2(e) {
	return e.endsWith("%") && D(e.slice(0, -1));
}
function X$2(e) {
	return We$2(e) || $$1(e, "number", We$2);
}
function v(e) {
	return tt$1.test(e);
}
function Z() {
	return !0;
}
function F$1(e) {
	return Ht$1.test(e);
}
function tr$1(e) {
	return $$1(e, "", or$2);
}
function $$1(e, t, r) {
	var n$1 = tt$1.exec(e);
	return n$1 ? n$1[1] ? n$1[1] === t : r(n$1[2]) : !1;
}
function rr$1(e) {
	return Xt$2.test(e);
}
function rt$1() {
	return !1;
}
function nr$2(e) {
	return e.startsWith("url(");
}
function We$2(e) {
	return Number.isInteger(Number(e));
}
function or$2(e) {
	return Zt$1.test(e);
}
function sr() {
	var e = x("colors"), t = x("spacing"), r = x("blur"), n$1 = x("brightness"), o = x("borderColor"), a = x("borderRadius"), s$1 = x("borderSpacing"), i = x("borderWidth"), l$1 = x("contrast"), u = x("grayscale"), c = x("hueRotate"), d = x("invert"), g = x("gap"), m = x("gradientColorStops"), y = x("gradientColorStopPositions"), E$1 = x("inset"), A$1 = x("margin"), P = x("opacity"), h$1 = x("padding"), j = x("saturate"), T = x("scale"), S$1 = x("sepia"), N = x("skew"), z$1 = x("space"), f = x("translate"), p = function() {
		return [
			"auto",
			"contain",
			"none"
		];
	}, C = function() {
		return [
			"auto",
			"hidden",
			"clip",
			"visible",
			"scroll"
		];
	}, w = function() {
		return [
			"auto",
			v,
			t
		];
	}, b = function() {
		return [v, t];
	}, I = function() {
		return ["", R$2];
	}, Q = function() {
		return [
			"auto",
			D,
			v
		];
	}, _e = function() {
		return [
			"bottom",
			"center",
			"left",
			"left-bottom",
			"left-top",
			"right",
			"right-bottom",
			"right-top",
			"top"
		];
	}, ee = function() {
		return [
			"solid",
			"dashed",
			"dotted",
			"double",
			"none"
		];
	}, Ge$1 = function() {
		return [
			"normal",
			"multiply",
			"screen",
			"overlay",
			"darken",
			"lighten",
			"color-dodge",
			"color-burn",
			"hard-light",
			"soft-light",
			"difference",
			"exclusion",
			"hue",
			"saturation",
			"color",
			"luminosity",
			"plus-lighter"
		];
	}, me$1 = function() {
		return [
			"start",
			"end",
			"center",
			"between",
			"around",
			"evenly",
			"stretch"
		];
	}, q$2 = function() {
		return [
			"",
			"0",
			v
		];
	}, De$1 = function() {
		return [
			"auto",
			"avoid",
			"all",
			"avoid-page",
			"page",
			"left",
			"right",
			"column"
		];
	}, H$2 = function() {
		return [D, re];
	}, te$2 = function() {
		return [D, v];
	};
	return {
		cacheSize: 500,
		theme: {
			colors: [Z],
			spacing: [R$2],
			blur: [
				"none",
				"",
				F$1,
				v
			],
			brightness: H$2(),
			borderColor: [e],
			borderRadius: [
				"none",
				"",
				"full",
				F$1,
				v
			],
			borderSpacing: b(),
			borderWidth: I(),
			contrast: H$2(),
			grayscale: q$2(),
			hueRotate: te$2(),
			invert: q$2(),
			gap: b(),
			gradientColorStops: [e],
			gradientColorStopPositions: [er$2, Ne],
			inset: w(),
			margin: w(),
			opacity: H$2(),
			padding: b(),
			saturate: H$2(),
			scale: H$2(),
			sepia: q$2(),
			skew: te$2(),
			space: b(),
			translate: b()
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				"video",
				v
			] }],
			container: ["container"],
			columns: [{ columns: [F$1] }],
			"break-after": [{ "break-after": De$1() }],
			"break-before": [{ "break-before": De$1() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			float: [{ float: [
				"right",
				"left",
				"none"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: [].concat(_e(), [v]) }],
			overflow: [{ overflow: C() }],
			"overflow-x": [{ "overflow-x": C() }],
			"overflow-y": [{ "overflow-y": C() }],
			overscroll: [{ overscroll: p() }],
			"overscroll-x": [{ "overscroll-x": p() }],
			"overscroll-y": [{ "overscroll-y": p() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: [E$1] }],
			"inset-x": [{ "inset-x": [E$1] }],
			"inset-y": [{ "inset-y": [E$1] }],
			start: [{ start: [E$1] }],
			end: [{ end: [E$1] }],
			top: [{ top: [E$1] }],
			right: [{ right: [E$1] }],
			bottom: [{ bottom: [E$1] }],
			left: [{ left: [E$1] }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: ["auto", X$2] }],
			basis: [{ basis: w() }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"wrap",
				"wrap-reverse",
				"nowrap"
			] }],
			flex: [{ flex: [
				"1",
				"auto",
				"initial",
				"none",
				v
			] }],
			grow: [{ grow: q$2() }],
			shrink: [{ shrink: q$2() }],
			order: [{ order: [
				"first",
				"last",
				"none",
				X$2
			] }],
			"grid-cols": [{ "grid-cols": [Z] }],
			"col-start-end": [{ col: [
				"auto",
				{ span: ["full", X$2] },
				v
			] }],
			"col-start": [{ "col-start": Q() }],
			"col-end": [{ "col-end": Q() }],
			"grid-rows": [{ "grid-rows": [Z] }],
			"row-start-end": [{ row: [
				"auto",
				{ span: [X$2] },
				v
			] }],
			"row-start": [{ "row-start": Q() }],
			"row-end": [{ "row-end": Q() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": [
				"auto",
				"min",
				"max",
				"fr",
				v
			] }],
			"auto-rows": [{ "auto-rows": [
				"auto",
				"min",
				"max",
				"fr",
				v
			] }],
			gap: [{ gap: [g] }],
			"gap-x": [{ "gap-x": [g] }],
			"gap-y": [{ "gap-y": [g] }],
			"justify-content": [{ justify: ["normal"].concat(me$1()) }],
			"justify-items": [{ "justify-items": [
				"start",
				"end",
				"center",
				"stretch"
			] }],
			"justify-self": [{ "justify-self": [
				"auto",
				"start",
				"end",
				"center",
				"stretch"
			] }],
			"align-content": [{ content: ["normal"].concat(me$1(), ["baseline"]) }],
			"align-items": [{ items: [
				"start",
				"end",
				"center",
				"baseline",
				"stretch"
			] }],
			"align-self": [{ self: [
				"auto",
				"start",
				"end",
				"center",
				"stretch",
				"baseline"
			] }],
			"place-content": [{ "place-content": [].concat(me$1(), ["baseline"]) }],
			"place-items": [{ "place-items": [
				"start",
				"end",
				"center",
				"baseline",
				"stretch"
			] }],
			"place-self": [{ "place-self": [
				"auto",
				"start",
				"end",
				"center",
				"stretch"
			] }],
			p: [{ p: [h$1] }],
			px: [{ px: [h$1] }],
			py: [{ py: [h$1] }],
			ps: [{ ps: [h$1] }],
			pe: [{ pe: [h$1] }],
			pt: [{ pt: [h$1] }],
			pr: [{ pr: [h$1] }],
			pb: [{ pb: [h$1] }],
			pl: [{ pl: [h$1] }],
			m: [{ m: [A$1] }],
			mx: [{ mx: [A$1] }],
			my: [{ my: [A$1] }],
			ms: [{ ms: [A$1] }],
			me: [{ me: [A$1] }],
			mt: [{ mt: [A$1] }],
			mr: [{ mr: [A$1] }],
			mb: [{ mb: [A$1] }],
			ml: [{ ml: [A$1] }],
			"space-x": [{ "space-x": [z$1] }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": [z$1] }],
			"space-y-reverse": ["space-y-reverse"],
			w: [{ w: [
				"auto",
				"min",
				"max",
				"fit",
				v,
				t
			] }],
			"min-w": [{ "min-w": [
				"min",
				"max",
				"fit",
				v,
				R$2
			] }],
			"max-w": [{ "max-w": [
				"0",
				"none",
				"full",
				"min",
				"max",
				"fit",
				"prose",
				{ screen: [F$1] },
				F$1,
				v
			] }],
			h: [{ h: [
				v,
				t,
				"auto",
				"min",
				"max",
				"fit"
			] }],
			"min-h": [{ "min-h": [
				"min",
				"max",
				"fit",
				v,
				R$2
			] }],
			"max-h": [{ "max-h": [
				v,
				t,
				"min",
				"max",
				"fit"
			] }],
			"font-size": [{ text: [
				"base",
				F$1,
				Ne
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black",
				re
			] }],
			"font-family": [{ font: [Z] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractons"],
			tracking: [{ tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest",
				v
			] }],
			"line-clamp": [{ "line-clamp": [
				"none",
				D,
				re
			] }],
			leading: [{ leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose",
				v,
				R$2
			] }],
			"list-image": [{ "list-image": ["none", v] }],
			"list-style-type": [{ list: [
				"none",
				"disc",
				"decimal",
				v
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"placeholder-color": [{ placeholder: [e] }],
			"placeholder-opacity": [{ "placeholder-opacity": [P] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"text-color": [{ text: [e] }],
			"text-opacity": [{ "text-opacity": [P] }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [].concat(ee(), ["wavy"]) }],
			"text-decoration-thickness": [{ decoration: [
				"auto",
				"from-font",
				R$2
			] }],
			"underline-offset": [{ "underline-offset": [
				"auto",
				v,
				R$2
			] }],
			"text-decoration-color": [{ decoration: [e] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			indent: [{ indent: b() }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				v
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: ["none", v] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-opacity": [{ "bg-opacity": [P] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: [].concat(_e(), [Yt$2]) }],
			"bg-repeat": [{ bg: ["no-repeat", { repeat: [
				"",
				"x",
				"y",
				"round",
				"space"
			] }] }],
			"bg-size": [{ bg: [
				"auto",
				"cover",
				"contain",
				Jt$2
			] }],
			"bg-image": [{ bg: [
				"none",
				{ "gradient-to": [
					"t",
					"tr",
					"r",
					"br",
					"b",
					"bl",
					"l",
					"tl"
				] },
				Qt$2
			] }],
			"bg-color": [{ bg: [e] }],
			"gradient-from-pos": [{ from: [y] }],
			"gradient-via-pos": [{ via: [y] }],
			"gradient-to-pos": [{ to: [y] }],
			"gradient-from": [{ from: [m] }],
			"gradient-via": [{ via: [m] }],
			"gradient-to": [{ to: [m] }],
			rounded: [{ rounded: [a] }],
			"rounded-s": [{ "rounded-s": [a] }],
			"rounded-e": [{ "rounded-e": [a] }],
			"rounded-t": [{ "rounded-t": [a] }],
			"rounded-r": [{ "rounded-r": [a] }],
			"rounded-b": [{ "rounded-b": [a] }],
			"rounded-l": [{ "rounded-l": [a] }],
			"rounded-ss": [{ "rounded-ss": [a] }],
			"rounded-se": [{ "rounded-se": [a] }],
			"rounded-ee": [{ "rounded-ee": [a] }],
			"rounded-es": [{ "rounded-es": [a] }],
			"rounded-tl": [{ "rounded-tl": [a] }],
			"rounded-tr": [{ "rounded-tr": [a] }],
			"rounded-br": [{ "rounded-br": [a] }],
			"rounded-bl": [{ "rounded-bl": [a] }],
			"border-w": [{ border: [i] }],
			"border-w-x": [{ "border-x": [i] }],
			"border-w-y": [{ "border-y": [i] }],
			"border-w-s": [{ "border-s": [i] }],
			"border-w-e": [{ "border-e": [i] }],
			"border-w-t": [{ "border-t": [i] }],
			"border-w-r": [{ "border-r": [i] }],
			"border-w-b": [{ "border-b": [i] }],
			"border-w-l": [{ "border-l": [i] }],
			"border-opacity": [{ "border-opacity": [P] }],
			"border-style": [{ border: [].concat(ee(), ["hidden"]) }],
			"divide-x": [{ "divide-x": [i] }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": [i] }],
			"divide-y-reverse": ["divide-y-reverse"],
			"divide-opacity": [{ "divide-opacity": [P] }],
			"divide-style": [{ divide: ee() }],
			"border-color": [{ border: [o] }],
			"border-color-x": [{ "border-x": [o] }],
			"border-color-y": [{ "border-y": [o] }],
			"border-color-t": [{ "border-t": [o] }],
			"border-color-r": [{ "border-r": [o] }],
			"border-color-b": [{ "border-b": [o] }],
			"border-color-l": [{ "border-l": [o] }],
			"divide-color": [{ divide: [o] }],
			"outline-style": [{ outline: [""].concat(ee()) }],
			"outline-offset": [{ "outline-offset": [v, R$2] }],
			"outline-w": [{ outline: [R$2] }],
			"outline-color": [{ outline: [e] }],
			"ring-w": [{ ring: I() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: [e] }],
			"ring-opacity": [{ "ring-opacity": [P] }],
			"ring-offset-w": [{ "ring-offset": [R$2] }],
			"ring-offset-color": [{ "ring-offset": [e] }],
			shadow: [{ shadow: [
				"",
				"inner",
				"none",
				F$1,
				tr$1
			] }],
			"shadow-color": [{ shadow: [Z] }],
			opacity: [{ opacity: [P] }],
			"mix-blend": [{ "mix-blend": Ge$1() }],
			"bg-blend": [{ "bg-blend": Ge$1() }],
			filter: [{ filter: ["", "none"] }],
			blur: [{ blur: [r] }],
			brightness: [{ brightness: [n$1] }],
			contrast: [{ contrast: [l$1] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				F$1,
				v
			] }],
			grayscale: [{ grayscale: [u] }],
			"hue-rotate": [{ "hue-rotate": [c] }],
			invert: [{ invert: [d] }],
			saturate: [{ saturate: [j] }],
			sepia: [{ sepia: [S$1] }],
			"backdrop-filter": [{ "backdrop-filter": ["", "none"] }],
			"backdrop-blur": [{ "backdrop-blur": [r] }],
			"backdrop-brightness": [{ "backdrop-brightness": [n$1] }],
			"backdrop-contrast": [{ "backdrop-contrast": [l$1] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [u] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [c] }],
			"backdrop-invert": [{ "backdrop-invert": [d] }],
			"backdrop-opacity": [{ "backdrop-opacity": [P] }],
			"backdrop-saturate": [{ "backdrop-saturate": [j] }],
			"backdrop-sepia": [{ "backdrop-sepia": [S$1] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": [s$1] }],
			"border-spacing-x": [{ "border-spacing-x": [s$1] }],
			"border-spacing-y": [{ "border-spacing-y": [s$1] }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"none",
				"all",
				"",
				"colors",
				"opacity",
				"shadow",
				"transform",
				v
			] }],
			duration: [{ duration: te$2() }],
			ease: [{ ease: [
				"linear",
				"in",
				"out",
				"in-out",
				v
			] }],
			delay: [{ delay: te$2() }],
			animate: [{ animate: [
				"none",
				"spin",
				"ping",
				"pulse",
				"bounce",
				v
			] }],
			transform: [{ transform: [
				"",
				"gpu",
				"none"
			] }],
			scale: [{ scale: [T] }],
			"scale-x": [{ "scale-x": [T] }],
			"scale-y": [{ "scale-y": [T] }],
			rotate: [{ rotate: [X$2, v] }],
			"translate-x": [{ "translate-x": [f] }],
			"translate-y": [{ "translate-y": [f] }],
			"skew-x": [{ "skew-x": [N] }],
			"skew-y": [{ "skew-y": [N] }],
			"transform-origin": [{ origin: [
				"center",
				"top",
				"top-right",
				"right",
				"bottom-right",
				"bottom",
				"bottom-left",
				"left",
				"top-left",
				v
			] }],
			accent: [{ accent: ["auto", e] }],
			appearance: ["appearance-none"],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				v
			] }],
			"caret-color": [{ caret: [e] }],
			"pointer-events": [{ "pointer-events": ["none", "auto"] }],
			resize: [{ resize: [
				"none",
				"y",
				"x",
				""
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scroll-m": [{ "scroll-m": b() }],
			"scroll-mx": [{ "scroll-mx": b() }],
			"scroll-my": [{ "scroll-my": b() }],
			"scroll-ms": [{ "scroll-ms": b() }],
			"scroll-me": [{ "scroll-me": b() }],
			"scroll-mt": [{ "scroll-mt": b() }],
			"scroll-mr": [{ "scroll-mr": b() }],
			"scroll-mb": [{ "scroll-mb": b() }],
			"scroll-ml": [{ "scroll-ml": b() }],
			"scroll-p": [{ "scroll-p": b() }],
			"scroll-px": [{ "scroll-px": b() }],
			"scroll-py": [{ "scroll-py": b() }],
			"scroll-ps": [{ "scroll-ps": b() }],
			"scroll-pe": [{ "scroll-pe": b() }],
			"scroll-pt": [{ "scroll-pt": b() }],
			"scroll-pr": [{ "scroll-pr": b() }],
			"scroll-pb": [{ "scroll-pb": b() }],
			"scroll-pl": [{ "scroll-pl": b() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"pinch-zoom",
				"manipulation",
				{ pan: [
					"x",
					"left",
					"right",
					"y",
					"up",
					"down"
				] }
			] }],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				v
			] }],
			fill: [{ fill: [e, "none"] }],
			"stroke-w": [{ stroke: [R$2, re] }],
			stroke: [{ stroke: [e, "none"] }],
			sr: ["sr-only", "not-sr-only"]
		},
		conflictingClassGroups: {
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": ["right", "left"],
			"inset-y": ["top", "bottom"],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: ["pr", "pl"],
			py: ["pt", "pb"],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: ["mr", "ml"],
			my: ["mt", "mb"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-s",
				"border-w-e",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": ["border-w-r", "border-w-l"],
			"border-w-y": ["border-w-t", "border-w-b"],
			"border-color": [
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": ["border-color-r", "border-color-l"],
			"border-color-y": ["border-color-t", "border-color-b"],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": ["scroll-mr", "scroll-ml"],
			"scroll-my": ["scroll-mt", "scroll-mb"],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": ["scroll-pr", "scroll-pl"],
			"scroll-py": ["scroll-pt", "scroll-pb"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] }
	};
}
var ir$1 = /* @__PURE__ */ Wt$1(sr);
var ce$1 = (e) => {
	const t = Symbol(e);
	return [
		(o) => provide(t, o),
		(o) => inject(t, o),
		t
	];
};
function ar$1(e) {
	return e == null ? [] : Array.isArray(e) ? e : [e];
}
var go = (e) => e[0], mo$1 = (e) => e[e.length - 1], cr = (e, t) => e.indexOf(t) !== -1, ur$1 = (e, ...t) => e.concat(t), lr$1 = (e, ...t) => e.filter((r) => !t.includes(r)), bo$1 = (e) => Array.from(new Set(e)), vo = (e, t) => {
	const r = new Set(t);
	return e.filter((n$1) => !r.has(n$1));
}, yo$1 = (e, t) => cr(e, t) ? lr$1(e, t) : ur$1(e, t);
function nt$1(e, t, r = {}) {
	const { step: n$1 = 1, loop: o = !0 } = r, a = t + n$1, s$1 = e.length, i = s$1 - 1;
	return t === -1 ? n$1 > 0 ? 0 : i : a < 0 ? o ? i : 0 : a >= s$1 ? o ? 0 : t > s$1 ? s$1 : t : a;
}
function ho$1(e, t, r = {}) {
	return e[nt$1(e, t, r)];
}
function dr$1(e, t, r = {}) {
	const { step: n$1 = 1, loop: o = !0 } = r;
	return nt$1(e, t, {
		step: -n$1,
		loop: o
	});
}
function wo$1(e, t, r = {}) {
	return e[dr$1(e, t, r)];
}
function xo$1(e, t) {
	return e.reduce(([r, n$1], o) => (t(o) ? r.push(o) : n$1.push(o), [r, n$1]), [[], []]);
}
var Ke$2 = (e) => e?.constructor.name === "Array", fr$1 = (e, t) => {
	if (e.length !== t.length) return !1;
	for (let r = 0; r < e.length; r++) if (!Te$1(e[r], t[r])) return !1;
	return !0;
}, Te$1 = (e, t) => {
	if (Object.is(e, t)) return !0;
	if (e == null && t != null || e != null && t == null) return !1;
	if (typeof e?.isEqual == "function" && typeof t?.isEqual == "function") return e.isEqual(t);
	if (typeof e == "function" && typeof t == "function") return e.toString() === t.toString();
	if (Ke$2(e) && Ke$2(t)) return fr$1(Array.from(e), Array.from(t));
	if (typeof e != "object" || typeof t != "object") return !1;
	const r = Object.keys(t ?? /* @__PURE__ */ Object.create(null)), n$1 = r.length;
	for (let o = 0; o < n$1; o++) if (!Reflect.has(e, r[o])) return !1;
	for (let o = 0; o < n$1; o++) {
		const a = r[o];
		if (!Te$1(e[a], t[a])) return !1;
	}
	return !0;
}, pr$1 = (e) => Array.isArray(e), ot$1 = (e) => e != null && typeof e == "object", Eo$1 = (e) => ot$1(e) && !pr$1(e), se = (e) => typeof e == "string", J$1 = (e) => typeof e == "function", Ao$2 = (e) => e == null, gr$1 = (e, t) => Object.prototype.hasOwnProperty.call(e, t), mr$1 = (e) => Object.prototype.toString.call(e), st$1 = Function.prototype.toString, br$2 = st$1.call(Object), vr$1 = (e) => {
	if (!ot$1(e) || mr$1(e) != "[object Object]" || wr$1(e)) return !1;
	const t = Object.getPrototypeOf(e);
	if (t === null) return !0;
	const r = gr$1(t, "constructor") && t.constructor;
	return typeof r == "function" && r instanceof r && st$1.call(r) == br$2;
}, yr$1 = (e) => typeof e == "object" && e !== null && "$$typeof" in e && "props" in e, hr$1 = (e) => typeof e == "object" && e !== null && "__v_isVNode" in e, wr$1 = (e) => yr$1(e) || hr$1(e), Co = (e) => e, No$1 = () => {}, xr$1 = (...e) => (...t) => {
	e.forEach(function(r) {
		r?.(...t);
	});
}, So = (e) => typeof e == "number" ? `${e}px` : e;
function it$1(e) {
	if (!vr$1(e) || e === void 0) return e;
	const t = Reflect.ownKeys(e).filter((n$1) => typeof n$1 == "string"), r = {};
	for (const n$1 of t) {
		const o = e[n$1];
		o !== void 0 && (r[n$1] = it$1(o));
	}
	return r;
}
function Po$2(e, t = Object.is) {
	let r = { ...e };
	const n$1 = /* @__PURE__ */ new Set(), o = (c) => (n$1.add(c), () => n$1.delete(c)), a = () => {
		n$1.forEach((c) => c());
	};
	return {
		subscribe: o,
		get: (c) => r[c],
		set: (c, d) => {
			t(r[c], d) || (r[c] = d, a());
		},
		update: (c) => {
			let d = !1;
			for (const g in c) {
				const m = c[g];
				m !== void 0 && !t(r[g], m) && (r[g] = m, d = !0);
			}
			d && a();
		},
		snapshot: () => ({ ...r })
	};
}
function qe$1(...e) {
	const t = e.length === 1 ? e[0] : e[1];
	(e.length !== 2 || e[0]) && process.env.NODE_ENV !== "production" && console.warn(t);
}
function Er$1(e, t) {
	if (e == null) throw new Error(t());
}
var Ar$1 = Object.defineProperty, Cr$2 = (e, t, r) => t in e ? Ar$1(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: r
}) : e[t] = r, be$1 = (e, t, r) => Cr$2(e, typeof t != "symbol" ? t + "" : t, r), Nr$1 = (e, t) => e.map((r, n$1) => e[(Math.max(t, 0) + n$1) % e.length]), ve = (...e) => (t) => e.reduce((r, n$1) => n$1(r), t), W$1 = () => {}, ue$2 = (e) => typeof e == "object" && e !== null, ko$1 = (e) => e ? "" : void 0, To$1 = (e) => e ? "true" : void 0, Sr$1 = 1, Pr$1 = 9, kr$1 = 11, M = (e) => ue$2(e) && e.nodeType === Sr$1 && typeof e.nodeName == "string", Me = (e) => ue$2(e) && e.nodeType === Pr$1, Tr$1 = (e) => ue$2(e) && e === e.window, at$1 = (e) => M(e) ? e.localName || "" : "#document";
function Mr$1(e) {
	return [
		"html",
		"body",
		"#document"
	].includes(at$1(e));
}
var Or = (e) => ue$2(e) && e.nodeType !== void 0, Y = (e) => Or(e) && e.nodeType === kr$1 && "host" in e, Ir$1 = (e) => M(e) && e.localName === "input", Mo$1 = (e) => !!e?.matches("a[href]"), Rr = (e) => M(e) ? e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0 : !1;
function G$1(e) {
	if (!e) return !1;
	return Oe$1(e.getRootNode()) === e;
}
var Lr = /(textarea|select)/;
function zr$1(e) {
	if (e == null || !M(e)) return !1;
	try {
		return Ir$1(e) && e.selectionStart != null || Lr.test(e.localName) || e.isContentEditable || e.getAttribute("contenteditable") === "true" || e.getAttribute("contenteditable") === "";
	} catch {
		return !1;
	}
}
function jr$1(e, t) {
	if (!e || !t || !M(e) || !M(t)) return !1;
	const r = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (r && Y(r)) {
		let n$1 = t;
		for (; n$1;) {
			if (e === n$1) return !0;
			n$1 = n$1.parentNode || n$1.host;
		}
	}
	return !1;
}
function le(e) {
	return Me(e) ? e : Tr$1(e) ? e.document : e?.ownerDocument ?? document;
}
function Fr$1(e) {
	return le(e).documentElement;
}
function O(e) {
	return Y(e) ? O(e.host) : Me(e) ? e.defaultView ?? window : M(e) ? e.ownerDocument?.defaultView ?? window : window;
}
function Oe$1(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot;) {
		const r = t.shadowRoot.activeElement;
		if (!r || r === t) break;
		t = r;
	}
	return t;
}
function _r$1(e) {
	if (at$1(e) === "html") return e;
	const t = e.assignedSlot || e.parentNode || Y(e) && e.host || Fr$1(e);
	return Y(t) ? t.host : t;
}
function Ie$1(e) {
	let t;
	try {
		if (t = e.getRootNode({ composed: !0 }), Me(t) || Y(t)) return t;
	} catch {}
	return e.ownerDocument ?? document;
}
var ye$1 = /* @__PURE__ */ new WeakMap();
function Gr(e) {
	return ye$1.has(e) || ye$1.set(e, O(e).getComputedStyle(e)), ye$1.get(e);
}
var Re = /* @__PURE__ */ new Set([
	"menu",
	"listbox",
	"dialog",
	"grid",
	"tree",
	"region"
]), Dr$1 = (e) => Re.has(e), ct$1 = (e) => e.getAttribute("aria-controls")?.split(" ") || [];
function Oo$1(e, t) {
	const r = /* @__PURE__ */ new Set(), n$1 = Ie$1(e), o = (a) => {
		const s$1 = a.querySelectorAll("[aria-controls]");
		for (const i of s$1) {
			if (i.getAttribute("aria-expanded") !== "true") continue;
			const l$1 = ct$1(i);
			for (const u of l$1) {
				if (!u || r.has(u)) continue;
				r.add(u);
				const c = n$1.getElementById(u);
				if (c) {
					const d = c.getAttribute("role"), g = c.getAttribute("aria-modal") === "true";
					if (d && Dr$1(d) && !g && (c === t || c.contains(t) || o(c))) return !0;
				}
			}
		}
		return !1;
	};
	return o(e);
}
function Vr$1(e, t) {
	const r = Ie$1(e), n$1 = /* @__PURE__ */ new Set(), o = (a) => {
		const s$1 = a.querySelectorAll("[aria-controls]");
		for (const i of s$1) {
			if (i.getAttribute("aria-expanded") !== "true") continue;
			const l$1 = ct$1(i);
			for (const u of l$1) {
				if (!u || n$1.has(u)) continue;
				n$1.add(u);
				const c = r.getElementById(u);
				if (c) {
					const d = c.getAttribute("role"), g = c.getAttribute("aria-modal") === "true";
					d && Re.has(d) && !g && (t(c), o(c));
				}
			}
		}
	};
	o(e);
}
function Io$1(e) {
	const t = /* @__PURE__ */ new Set();
	return Vr$1(e, (r) => {
		e.contains(r) || t.add(r);
	}), Array.from(t);
}
function $r$1(e) {
	const t = e.getAttribute("role");
	return !!(t && Re.has(t));
}
function Ur$1(e) {
	return e.hasAttribute("aria-controls") && e.getAttribute("aria-expanded") === "true";
}
function Ro$1(e) {
	return Ur$1(e) ? !0 : !!e.querySelector?.("[aria-controls][aria-expanded=\"true\"]");
}
function Lo$1(e) {
	if (!e.id) return !1;
	const t = Ie$1(e), r = CSS.escape(e.id), n$1 = `[aria-controls~="${r}"][aria-expanded="true"], [aria-controls="${r}"][aria-expanded="true"]`;
	return !!(t.querySelector(n$1) && $r$1(e));
}
var de$2 = () => typeof document < "u";
function Br$1() {
	return navigator.userAgentData?.platform ?? navigator.platform;
}
function Wr$1() {
	const e = navigator.userAgentData;
	return e && Array.isArray(e.brands) ? e.brands.map(({ brand: t, version: r }) => `${t}/${r}`).join(" ") : navigator.userAgent;
}
var Le = (e) => de$2() && e.test(Br$1()), ut$1 = (e) => de$2() && e.test(Wr$1()), Kr$1 = (e) => de$2() && e.test(navigator.vendor), zo = () => de$2() && !!navigator.maxTouchPoints, qr$1 = () => Le(/^iPhone/i), Hr$1 = () => Le(/^iPad/i) || fe() && navigator.maxTouchPoints > 1, Xr$1 = () => qr$1() || Hr$1(), Zr$1 = () => fe() || Xr$1(), fe = () => Le(/^Mac/i), jo$1 = () => Zr$1() && Kr$1(/apple/i), Jr$1 = () => ut$1(/Firefox/i), Yr$1 = () => ut$1(/Android/i);
function Qr$1(e) {
	return e.composedPath?.() ?? e.nativeEvent?.composedPath?.();
}
function Se(e) {
	return Qr$1(e)?.[0] ?? e.target;
}
function Fo$2(e) {
	const t = e.currentTarget;
	if (!t || !t.matches("a[href], button[type='submit'], input[type='submit']")) return !1;
	const n$1 = e.button === 1, o = en$1(e);
	return n$1 || o;
}
function _o$1(e) {
	const t = e.currentTarget;
	if (!t) return !1;
	const r = t.localName;
	return e.altKey ? r === "a" || r === "button" && t.type === "submit" || r === "input" && t.type === "submit" : !1;
}
function Go$1(e) {
	return nn$1(e).isComposing || e.keyCode === 229;
}
function en$1(e) {
	return fe() ? e.metaKey : e.ctrlKey;
}
function Do$2(e) {
	return e.key.length === 1 && !e.ctrlKey && !e.metaKey;
}
function Vo$1(e) {
	return e.pointerType === "" && e.isTrusted ? !0 : Yr$1() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
var $o = (e) => e.button === 0, Uo$1 = (e) => e.button === 2 || fe() && e.ctrlKey && e.button === 0, Bo = (e) => e.ctrlKey || e.altKey || e.metaKey, tn$1 = (e) => "touches" in e && e.touches.length > 0, rn$1 = {
	Up: "ArrowUp",
	Down: "ArrowDown",
	Esc: "Escape",
	" ": "Space",
	",": "Comma",
	Left: "ArrowLeft",
	Right: "ArrowRight"
}, He$1 = {
	ArrowLeft: "ArrowRight",
	ArrowRight: "ArrowLeft"
};
function Wo$1(e, t = {}) {
	const { dir: r = "ltr", orientation: n$1 = "horizontal" } = t;
	let o = e.key;
	return o = rn$1[o] ?? o, r === "rtl" && n$1 === "horizontal" && o in He$1 && (o = He$1[o]), o;
}
function nn$1(e) {
	return e.nativeEvent ?? e;
}
function on$1(e, t = "client") {
	const r = tn$1(e) ? e.touches[0] || e.changedTouches[0] : e;
	return {
		x: r[`${t}X`],
		y: r[`${t}Y`]
	};
}
var _ = (e, t, r, n$1) => {
	const o = typeof e == "function" ? e() : e;
	return o?.addEventListener(t, r, n$1), () => {
		o?.removeEventListener(t, r, n$1);
	};
};
function lt$1(e, t) {
	const { type: r = "HTMLInputElement", property: n$1 = "value" } = t, o = O(e)[r].prototype;
	return Object.getOwnPropertyDescriptor(o, n$1) ?? {};
}
function sn$1(e) {
	if (e.localName === "input") return "HTMLInputElement";
	if (e.localName === "textarea") return "HTMLTextAreaElement";
	if (e.localName === "select") return "HTMLSelectElement";
}
function Ko$1(e, t, r = "value") {
	if (!e) return;
	const n$1 = sn$1(e);
	n$1 && lt$1(e, {
		type: n$1,
		property: r
	}).set?.call(e, t), e.setAttribute(r, t);
}
function an$1(e, t) {
	if (!e) return;
	lt$1(e, {
		type: "HTMLInputElement",
		property: "checked"
	}).set?.call(e, t), t ? e.setAttribute("checked", "") : e.removeAttribute("checked");
}
function qo$1(e, t) {
	const { checked: r, bubbles: n$1 = !0 } = t;
	if (!e) return;
	const o = O(e);
	e instanceof o.HTMLInputElement && (an$1(e, r), e.dispatchEvent(new o.Event("click", { bubbles: n$1 })));
}
function cn$1(e) {
	return un$1(e) ? e.form : e.closest("form");
}
function un$1(e) {
	return e.matches("textarea, input, select, button");
}
function ln$1(e, t) {
	if (!e) return;
	const r = cn$1(e), n$1 = (o) => {
		o.defaultPrevented || t();
	};
	return r?.addEventListener("reset", n$1, { passive: !0 }), () => r?.removeEventListener("reset", n$1);
}
function dn$1(e, t) {
	const r = e?.closest("fieldset");
	if (!r) return;
	t(r.disabled);
	const o = new (O(r)).MutationObserver(() => t(r.disabled));
	return o.observe(r, {
		attributes: !0,
		attributeFilter: ["disabled"]
	}), () => o.disconnect();
}
function Ho$1(e, t) {
	if (!e) return;
	const { onFieldsetDisabledChange: r, onFormReset: n$1 } = t, o = [ln$1(e, n$1), dn$1(e, r)];
	return () => o.forEach((a) => a?.());
}
var dt = (e) => M(e) && e.tagName === "IFRAME", fn = /^(audio|video|details)$/;
function ft$2(e) {
	const t = e.getAttribute("tabindex");
	return t ? parseInt(t, 10) : NaN;
}
var pn = (e) => !Number.isNaN(ft$2(e)), gn = (e) => ft$2(e) < 0;
function mn(e, t) {
	if (!t) return null;
	if (t === !0) return e.shadowRoot || null;
	const r = t(e);
	return (r === !0 ? e.shadowRoot : r) || null;
}
function pt$2(e, t, r) {
	const n$1 = [...e], o = [...e], a = /* @__PURE__ */ new Set(), s$1 = /* @__PURE__ */ new Map();
	e.forEach((l$1, u) => s$1.set(l$1, u));
	let i = 0;
	for (; i < o.length;) {
		const l$1 = o[i++];
		if (!l$1 || a.has(l$1)) continue;
		a.add(l$1);
		const u = mn(l$1, t);
		if (u) {
			const c = Array.from(u.querySelectorAll(pe$1)).filter(r), d = s$1.get(l$1);
			if (d !== void 0) {
				const g = d + 1;
				n$1.splice(g, 0, ...c), c.forEach((m, y) => {
					s$1.set(m, g + y);
				});
				for (let m = g + c.length; m < n$1.length; m++) s$1.set(n$1[m], m);
			} else {
				const g = n$1.length;
				n$1.push(...c), c.forEach((m, y) => {
					s$1.set(m, g + y);
				});
			}
			o.push(...c);
		}
	}
	return n$1;
}
var pe$1 = "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], button:not([disabled]), [tabindex], iframe, object, embed, area[href], audio[controls], video[controls], [contenteditable]:not([contenteditable='false']), details > summary:first-of-type", bn = (e, t = {}) => {
	if (!e) return [];
	const { includeContainer: r = !1, getShadowRoot: n$1 } = t, o = Array.from(e.querySelectorAll(pe$1));
	(r == !0 || r == "if-empty" && o.length === 0) && M(e) && ie(e) && o.unshift(e);
	const s$1 = [];
	for (const i of o) if (ie(i)) {
		if (dt(i) && i.contentDocument) {
			const l$1 = i.contentDocument.body;
			s$1.push(...bn(l$1, { getShadowRoot: n$1 }));
			continue;
		}
		s$1.push(i);
	}
	return n$1 ? pt$2(s$1, n$1, ie) : s$1;
};
function ie(e) {
	return !M(e) || e.closest("[inert]") ? !1 : e.matches(pe$1) && Rr(e);
}
function ge(e, t = {}) {
	if (!e) return [];
	const { includeContainer: r, getShadowRoot: n$1 } = t, o = Array.from(e.querySelectorAll(pe$1));
	r && he(e) && o.unshift(e);
	const a = [];
	for (const s$1 of o) if (he(s$1)) {
		if (dt(s$1) && s$1.contentDocument) {
			const i = s$1.contentDocument.body;
			a.push(...ge(i, { getShadowRoot: n$1 }));
			continue;
		}
		a.push(s$1);
	}
	if (n$1) {
		const s$1 = pt$2(a, n$1, he);
		return !s$1.length && r ? o : s$1;
	}
	return !a.length && r ? o : a;
}
function he(e) {
	return M(e) && e.tabIndex > 0 ? !0 : ie(e) && !gn(e);
}
function gt$2(e, t = {}) {
	const r = ge(e, t);
	return [r[0] || null, r[r.length - 1] || null];
}
function vn(e, t = {}) {
	const { current: r, getShadowRoot: n$1 } = t, o = ge(e, { getShadowRoot: n$1 }), a = e?.ownerDocument || document, s$1 = r ?? Oe$1(a);
	if (!s$1) return null;
	return o[o.indexOf(s$1) + 1] || null;
}
function Xo$1(e) {
	return e.tabIndex < 0 && (fn.test(e.localName) || zr$1(e)) && !pn(e) ? 0 : e.tabIndex;
}
function Zo$2(e) {
	const { root: t, getInitialEl: r, filter: n$1, enabled: o = !0 } = e;
	if (!o) return;
	let a = null;
	if (a || (a = typeof r == "function" ? r() : r), a || (a = t?.querySelector("[data-autofocus],[autofocus]")), !a) {
		const s$1 = ge(t);
		a = n$1 ? s$1.filter(n$1)[0] : s$1[0];
	}
	return a || t || void 0;
}
function Jo$2(e) {
	const t = e.currentTarget;
	if (!t) return !1;
	const [r, n$1] = gt$2(t);
	return !(G$1(r) && e.shiftKey || G$1(n$1) && !e.shiftKey || !r && !n$1);
}
var yn = class mt$1 {
	constructor() {
		be$1(this, "id", null), be$1(this, "fn_cleanup"), be$1(this, "cleanup", () => {
			this.cancel();
		});
	}
	static create() {
		return new mt$1();
	}
	request(t) {
		this.cancel(), this.id = globalThis.requestAnimationFrame(() => {
			this.id = null, this.fn_cleanup = t?.();
		});
	}
	cancel() {
		this.id !== null && (globalThis.cancelAnimationFrame(this.id), this.id = null), this.fn_cleanup?.(), this.fn_cleanup = void 0;
	}
	isActive() {
		return this.id !== null;
	}
};
function K(e) {
	const t = yn.create();
	return t.request(e), t.cleanup;
}
function hn(e) {
	const t = /* @__PURE__ */ new Set();
	function r(n$1) {
		const o = globalThis.requestAnimationFrame(n$1);
		t.add(() => globalThis.cancelAnimationFrame(o));
	}
	return r(() => r(e)), function() {
		t.forEach((o) => o());
	};
}
function wn$1(e, t, r) {
	const n$1 = K(() => {
		e.removeEventListener(t, o, !0), r();
	}), o = () => {
		n$1(), r();
	};
	return e.addEventListener(t, o, {
		once: !0,
		capture: !0
	}), n$1;
}
function xn$1(e, t) {
	if (!e) return;
	const { attributes: r, callback: n$1 } = t, a = new (e.ownerDocument.defaultView || window).MutationObserver((s$1) => {
		for (const i of s$1) i.type === "attributes" && i.attributeName && r.includes(i.attributeName) && n$1(i);
	});
	return a.observe(e, {
		attributes: !0,
		attributeFilter: r
	}), () => a.disconnect();
}
function Yo$2(e, t) {
	const r = K, n$1 = [];
	return n$1.push(r(() => {
		const o = typeof e == "function" ? e() : e;
		n$1.push(xn$1(o, t));
	})), () => {
		n$1.forEach((o) => o?.());
	};
}
function En$1(e, t) {
	const { callback: r } = t;
	if (!e) return;
	const o = new (e.ownerDocument.defaultView || window).MutationObserver(r);
	return o.observe(e, {
		childList: !0,
		subtree: !0
	}), () => o.disconnect();
}
function Qo$1(e, t) {
	const { defer: r } = t, n$1 = r ? K : (a) => a(), o = [];
	return o.push(n$1(() => {
		const a = typeof e == "function" ? e() : e;
		o.push(En$1(a, t));
	})), () => {
		o.forEach((a) => a?.());
	};
}
function es$2(e) {
	const t = () => {
		const r = O(e);
		e.dispatchEvent(new r.MouseEvent("click"));
	};
	Jr$1() ? wn$1(e, "keyup", t) : queueMicrotask(t);
}
function bt$1(e) {
	const t = _r$1(e);
	return Mr$1(t) ? le(t).body : M(t) && ze(t) ? t : bt$1(t);
}
function An$1(e, t = []) {
	const r = bt$1(e), n$1 = r === e.ownerDocument.body, o = O(r);
	return n$1 ? t.concat(o, o.visualViewport || [], ze(r) ? r : []) : t.concat(r, An$1(r, []));
}
var Cn$1 = /auto|scroll|overlay|hidden|clip/, Nn$1 = /* @__PURE__ */ new Set(["inline", "contents"]);
function ze(e) {
	const { overflow: r, overflowX: n$1, overflowY: o, display: a } = O(e).getComputedStyle(e);
	return Cn$1.test(r + o + n$1) && !Nn$1.has(a);
}
function Sn$1(e) {
	return e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
}
function ts$2(e, t) {
	const { rootEl: r, ...n$1 } = t || {};
	!e || !r || !ze(r) || !Sn$1(r) || e.scrollIntoView(n$1);
}
function rs$2(e) {
	const { pointerNode: t, keyboardNode: r = t, onPress: n$1, onPressStart: o, onPressEnd: a, isValidKey: s$1 = (h$1) => h$1.key === "Enter" } = e;
	if (!t) return W$1;
	const i = O(t);
	let l$1 = W$1, u = W$1, c = W$1;
	const d = (h$1) => ({
		point: on$1(h$1),
		event: h$1
	});
	function g(h$1) {
		o?.(d(h$1));
	}
	function m(h$1) {
		a?.(d(h$1));
	}
	l$1 = ve(_(t, "pointerdown", (h$1) => {
		u();
		u = ve(_(i, "pointerup", (N) => {
			jr$1(t, Se(N)) ? n$1?.(d(N)) : a?.(d(N));
		}, {
			passive: !n$1,
			once: !0
		}), _(i, "pointercancel", m, {
			passive: !a,
			once: !0
		})), G$1(r) && h$1.pointerType === "mouse" && h$1.preventDefault(), g(h$1);
	}, { passive: !o }), _(r, "focus", P));
	function P() {
		const h$1 = (N) => {
			if (!s$1(N)) return;
			const z$1 = (p) => {
				if (!s$1(p)) return;
				const w = d(new i.PointerEvent("pointerup"));
				n$1?.(w), a?.(w);
			};
			u(), u = _(r, "keyup", z$1);
			g(new i.PointerEvent("pointerdown"));
		}, j = () => {
			m(new i.PointerEvent("pointercancel"));
		};
		c = ve(_(r, "keydown", h$1), _(r, "blur", j));
	}
	return () => {
		l$1(), u(), c();
	};
}
function Pn$1(e, t = {}) {
	const { triggerElement: r, onFocus: n$1, onFocusEnter: o, getShadowRoot: a } = t, s$1 = e?.ownerDocument || document, i = s$1.body;
	function l$1(u) {
		if (u.key !== "Tab") return;
		let c = null;
		const [d, g] = gt$2(e, {
			includeContainer: !0,
			getShadowRoot: a
		}), m = vn(i, {
			current: r,
			getShadowRoot: a
		}), y = !d && !g;
		u.shiftKey && G$1(m) ? (o?.(), c = g) : u.shiftKey && (G$1(d) || y) ? c = r : !u.shiftKey && G$1(r) ? (o?.(), c = d) : !u.shiftKey && (G$1(g) || y) && (c = m), c && (u.preventDefault(), typeof n$1 == "function" ? n$1(c) : c.focus());
	}
	return _(s$1, "keydown", l$1, !0);
}
function ns$2(e, t) {
	const { defer: r, triggerElement: n$1, ...o } = t, a = r ? K : (i) => i(), s$1 = [];
	return s$1.push(a(() => {
		const i = typeof e == "function" ? e() : e, l$1 = typeof n$1 == "function" ? n$1() : n$1;
		s$1.push(Pn$1(i, {
			triggerElement: l$1,
			...o
		}));
	})), () => {
		s$1.forEach((i) => i?.());
	};
}
function os$1(e, t) {
	return Array.from(e?.querySelectorAll(t) ?? []);
}
var je = (e) => e.id;
function kn$1(e, t, r = je) {
	return e.find((n$1) => r(n$1) === t);
}
function Fe$1(e, t, r = je) {
	const n$1 = kn$1(e, t, r);
	return n$1 ? e.indexOf(n$1) : -1;
}
function ss$2(e, t, r = !0) {
	let n$1 = Fe$1(e, t);
	return n$1 = r ? (n$1 + 1) % e.length : Math.min(n$1 + 1, e.length - 1), e[n$1];
}
function is$2(e, t, r = !0) {
	let n$1 = Fe$1(e, t);
	return n$1 === -1 ? r ? e[e.length - 1] : null : (n$1 = r ? (n$1 - 1 + e.length) % e.length : Math.max(0, n$1 - 1), e[n$1]);
}
function Tn$1(e) {
	const t = /* @__PURE__ */ new WeakMap();
	let r;
	const n$1 = /* @__PURE__ */ new WeakMap(), o = (i) => r || (r = new i.ResizeObserver((l$1) => {
		for (const u of l$1) {
			n$1.set(u.target, u);
			const c = t.get(u.target);
			if (c) for (const d of c) d(u);
		}
	}), r);
	return {
		observe: (i, l$1) => {
			let u = t.get(i) || /* @__PURE__ */ new Set();
			u.add(l$1), t.set(i, u);
			const c = O(i);
			return o(c).observe(i, e), () => {
				const d = t.get(i);
				d && (d.delete(l$1), d.size === 0 && (t.delete(i), o(c).unobserve(i)));
			};
		},
		unobserve: (i) => {
			t.delete(i), r?.unobserve(i);
		}
	};
}
var as$1 = /* @__PURE__ */ Tn$1({ box: "border-box" }), Mn$1 = (e) => e.split("").map((t) => {
	const r = t.charCodeAt(0);
	return r > 0 && r < 128 ? t : r >= 128 && r <= 255 ? `/x${r.toString(16)}`.replace("/", "\\") : "";
}).join("").trim(), On$1 = (e) => Mn$1(e.dataset?.valuetext ?? e.textContent ?? ""), In$1 = (e, t) => e.trim().toLowerCase().startsWith(t.toLowerCase());
function Rn$1(e, t, r, n$1 = je) {
	const o = r ? Fe$1(e, r, n$1) : -1;
	let a = r ? Nr$1(e, o) : e;
	return t.length === 1 && (a = a.filter((i) => n$1(i) !== r)), a.find((i) => In$1(On$1(i), t));
}
function cs$1(e, t, r) {
	const n$1 = e.getAttribute(t), o = n$1 != null;
	return e.setAttribute(t, r), () => {
		o ? e.setAttribute(t, n$1) : e.removeAttribute(t);
	};
}
function Ln(e, t) {
	if (!e) return W$1;
	const r = Object.keys(t).reduce((n$1, o) => (n$1[o] = e.style.getPropertyValue(o), n$1), {});
	return Object.assign(e.style, t), () => {
		Object.assign(e.style, r), e.style.length === 0 && e.removeAttribute("style");
	};
}
function us$1(e, t, r) {
	if (!e) return W$1;
	const n$1 = e.style.getPropertyValue(t);
	return e.style.setProperty(t, r), () => {
		e.style.setProperty(t, n$1), e.style.length === 0 && e.removeAttribute("style");
	};
}
function zn(e, t) {
	const { state: r, activeId: n$1, key: o, timeout: a = 350, itemToId: s$1 } = t, i = r.keysSoFar + o, u = i.length > 1 && Array.from(i).every((y) => y === i[0]) ? i[0] : i;
	const d = Rn$1(e.slice(), u, n$1, s$1);
	function g() {
		clearTimeout(r.timer), r.timer = -1;
	}
	function m(y) {
		r.keysSoFar = y, g(), y !== "" && (r.timer = +setTimeout(() => {
			m(""), g();
		}, a));
	}
	return m(i), d;
}
var ls$1 = /* @__PURE__ */ Object.assign(zn, {
	defaultOptions: {
		keysSoFar: "",
		timer: -1
	},
	isValidEvent: jn
});
function jn(e) {
	return e.key.length === 1 && !e.ctrlKey && !e.metaKey;
}
var ds$1 = {
	border: "0",
	clip: "rect(0 0 0 0)",
	height: "1px",
	margin: "-1px",
	overflow: "hidden",
	padding: "0",
	position: "absolute",
	width: "1px",
	whiteSpace: "nowrap",
	wordWrap: "normal"
};
function Fn$1(e, t, r) {
	const { signal: n$1 } = t;
	return [new Promise((s$1, i) => {
		const l$1 = setTimeout(() => {
			i(/* @__PURE__ */ new Error(`Timeout of ${r}ms exceeded`));
		}, r);
		n$1.addEventListener("abort", () => {
			clearTimeout(l$1), i(/* @__PURE__ */ new Error("Promise aborted"));
		}), e.then((u) => {
			n$1.aborted || (clearTimeout(l$1), s$1(u));
		}).catch((u) => {
			n$1.aborted || (clearTimeout(l$1), i(u));
		});
	}), () => t.abort()];
}
function fs$1(e, t) {
	const { timeout: r, rootNode: n$1 } = t, o = O(n$1), a = le(n$1), s$1 = new o.AbortController();
	return Fn$1(new Promise((i) => {
		const l$1 = e();
		if (l$1) {
			i(l$1);
			return;
		}
		const u = new o.MutationObserver(() => {
			const c = e();
			c && c.isConnected && (u.disconnect(), i(c));
		});
		u.observe(a.body, {
			childList: !0,
			subtree: !0
		});
	}), s$1, r);
}
var _n$1 = (...e) => e.map((t) => t?.trim?.()).filter(Boolean).join(" "), Gn$1 = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g, Xe$1 = (e) => {
	const t = {};
	let r;
	for (; r = Gn$1.exec(e);) t[r[1]] = r[2];
	return t;
}, Dn$1 = (e, t) => {
	if (se(e)) {
		if (se(t)) return `${e};${t}`;
		e = Xe$1(e);
	} else se(t) && (t = Xe$1(t));
	return Object.assign({}, e ?? {}, t ?? {});
};
function Vn(...e) {
	let t = {};
	for (let r of e) {
		if (!r) continue;
		for (let o in t) {
			if (o.startsWith("on") && typeof t[o] == "function" && typeof r[o] == "function") {
				t[o] = xr$1(r[o], t[o]);
				continue;
			}
			if (o === "className" || o === "class") {
				t[o] = _n$1(t[o], r[o]);
				continue;
			}
			if (o === "style") {
				t[o] = Dn$1(t[o], r[o]);
				continue;
			}
			t[o] = r[o] !== void 0 ? r[o] : t[o];
		}
		for (let o in r) t[o] === void 0 && (t[o] = r[o]);
		const n$1 = Object.getOwnPropertySymbols(r);
		for (let o of n$1) t[o] = r[o];
	}
	return t;
}
function $n() {
	return {
		and: (...e) => function(r) {
			return e.every((n$1) => r.guard(n$1));
		},
		or: (...e) => function(r) {
			return e.some((n$1) => r.guard(n$1));
		},
		not: (e) => function(r) {
			return !r.guard(e);
		}
	};
}
function ps$1(e) {
	return e;
}
function gs$2() {
	return {
		guards: $n(),
		createMachine: (e) => e,
		choose: (e) => function({ choose: r }) {
			return r(e)?.actions;
		}
	};
}
var B = /* @__PURE__ */ ((e) => (e.NotStarted = "Not Started", e.Started = "Started", e.Stopped = "Stopped", e))(B || {}), we$1 = "__init__";
function Un(e) {
	const t = () => e.getRootNode?.() ?? document, r = () => le(t());
	return {
		...e,
		getRootNode: t,
		getDoc: r,
		getWin: () => r().defaultView ?? window,
		getActiveElement: () => Oe$1(t()),
		isActiveElement: G$1,
		getById: (s$1) => t().getElementById(s$1)
	};
}
function Bn$1(e) {
	return new Proxy({}, { get(t, r) {
		return r === "style" ? (n$1) => e({ style: n$1 }).style : e;
	} });
}
var Wn = () => (e) => Array.from(new Set(e));
function Kn$1(e) {
	return e.charAt(0).toUpperCase() + e.substr(1).toLowerCase();
}
var Ze$2 = {
	htmlFor: "for",
	className: "class",
	onDoubleClick: "onDblclick",
	onChange: "onInput",
	onFocus: "onFocusin",
	onBlur: "onFocusout",
	defaultValue: "value",
	defaultChecked: "checked"
}, qn = "viewBox,className,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(",");
function Hn(e) {
	return e in Ze$2 ? Ze$2[e] : e.startsWith("on") ? `on${Kn$1(e.substr(2))}` : qn.includes(e) ? e : e.toLowerCase();
}
var ms$1 = Bn$1((e) => {
	const t = {};
	for (const r in e) {
		const n$1 = e[r];
		r === "children" ? typeof n$1 == "string" ? t.innerHTML = n$1 : process.env.NODE_ENV !== "production" && n$1 != null && console.warn("[Vue Normalize Prop] : avoid passing non-primitive value as `children`") : t[Hn(r)] = e[r];
	}
	return t;
});
function ae(e) {
	const t = e().defaultValue ?? e().value, r = e().isEqual ?? Object.is, n$1 = shallowRef(t), o = computed(() => e().value !== void 0);
	return {
		initial: t,
		ref: shallowRef(o.value ? e().value : n$1.value),
		get() {
			return o.value ? e().value : n$1.value;
		},
		set(s$1) {
			const i = o.value ? e().value : n$1.value, l$1 = J$1(s$1) ? s$1(i) : s$1;
			e().debug && console.log(`[bindable > ${e().debug}] setValue`, {
				next: l$1,
				prev: i
			}), o.value || (n$1.value = l$1), r(l$1, i) || e().onChange?.(l$1, i);
		},
		invoke(s$1, i) {
			e().onChange?.(s$1, i);
		},
		hash(s$1) {
			return e().hash?.(s$1) ?? String(s$1);
		}
	};
}
ae.cleanup = (e) => {
	onUnmounted(() => e());
};
ae.ref = (e) => {
	let t = e;
	return {
		get: () => t,
		set: (r) => {
			t = r;
		}
	};
};
function Xn(e) {
	const t = { current: e };
	return {
		get(r) {
			return t.current[r];
		},
		set(r, n$1) {
			t.current[r] = n$1;
		}
	};
}
var Zn = (e, t) => {
	watch(() => [...e.map((r) => r())], (r, n$1) => {
		let o = !1;
		for (let a = 0; a < r.length; a++) if (!Te$1(n$1[a], toValue(r[a]))) {
			o = !0;
			break;
		}
		o && t();
	});
};
function Jn(e, t = {}) {
	const r = computed(() => {
		const { id: f, ids: p, getRootNode: C } = toValue(t);
		return Un({
			id: f,
			ids: p,
			getRootNode: C
		});
	}), n$1 = (...f) => {
		e.debug && console.log(...f);
	}, a = Yn(computed(() => e.props?.({
		props: it$1(toValue(t)),
		get scope() {
			return r.value;
		}
	}) ?? toValue(t))), s$1 = e.context?.({
		prop: a,
		bindable: ae,
		get scope() {
			return r.value;
		},
		flush: Je$2,
		getContext() {
			return i;
		},
		getComputed() {
			return T;
		},
		getRefs() {
			return y;
		},
		getEvent() {
			return g();
		}
	}), i = {
		get(f) {
			return s$1[f]?.get();
		},
		set(f, p) {
			s$1[f]?.set(p);
		},
		initial(f) {
			return s$1[f]?.initial;
		},
		hash(f) {
			const p = s$1[f]?.get();
			return s$1[f]?.hash(p);
		}
	};
	let l$1 = /* @__PURE__ */ new Map(), u = null, c = { current: null }, d = { current: { type: "" } };
	const g = () => ({
		...d.current,
		current() {
			return d.current;
		},
		previous() {
			return c.current;
		}
	}), m = () => ({
		...S$1,
		matches(...f) {
			const p = S$1.get();
			return f.includes(p);
		},
		hasTag(f) {
			const p = S$1.get();
			return !!e.states[p]?.tags?.includes(f);
		}
	}), y = Xn(e.refs?.({
		prop: a,
		context: i
	}) ?? {}), E$1 = () => ({
		state: m(),
		context: i,
		event: g(),
		prop: a,
		send: z$1,
		action: A$1,
		guard: P,
		track: Zn,
		refs: y,
		computed: T,
		flush: Je$2,
		get scope() {
			return r.value;
		},
		choose: j
	}), A$1 = (f) => {
		const p = J$1(f) ? f(E$1()) : f;
		if (!p) return;
		const C = p.map((w) => {
			const b = e.implementations?.actions?.[w];
			return b || qe$1(`[zag-js] No implementation found for action "${JSON.stringify(w)}"`), b;
		});
		for (const w of C) w?.(E$1());
	}, P = (f) => J$1(f) ? f(E$1()) : e.implementations?.guards?.[f](E$1()), h$1 = (f) => {
		const p = J$1(f) ? f(E$1()) : f;
		if (!p) return;
		const C = p.map((b) => {
			const I = e.implementations?.effects?.[b];
			return I || qe$1(`[zag-js] No implementation found for effect "${JSON.stringify(b)}"`), I;
		}), w = [];
		for (const b of C) {
			const I = b?.(E$1());
			I && w.push(I);
		}
		return () => w.forEach((b) => b?.());
	}, j = (f) => ar$1(f).find((p) => {
		let C = !p.guard;
		return se(p.guard) ? C = !!P(p.guard) : J$1(p.guard) && (C = p.guard(E$1())), C;
	}), T = (f) => {
		Er$1(e.computed, () => "[zag-js] No computed object found on machine");
		const p = e.computed[f];
		return p({
			context: i,
			event: g(),
			prop: a,
			refs: y,
			get scope() {
				return r.value;
			},
			computed: T
		});
	}, S$1 = ae(() => ({
		defaultValue: e.initialState({ prop: a }),
		onChange(f, p) {
			p && (l$1.get(p)?.(), l$1.delete(p)), p && A$1(e.states[p]?.exit), A$1(u?.actions);
			const C = h$1(e.states[f]?.effects);
			if (C && l$1.set(f, C), p === we$1) {
				A$1(e.entry);
				const w = h$1(e.effects);
				w && l$1.set(we$1, w);
			}
			A$1(e.states[f]?.entry);
		}
	}));
	let N = B.NotStarted;
	onMounted(() => {
		const f = N === B.Started;
		N = B.Started, n$1(f ? "rehydrating..." : "initializing..."), S$1.invoke(S$1.initial, we$1);
	}), onBeforeUnmount(() => {
		N = B.Stopped, n$1("unmounting...");
		const f = l$1.values();
		for (const p of f) p?.();
		l$1 = /* @__PURE__ */ new Map(), A$1(e.exit);
	});
	const z$1 = (f) => {
		if (N !== B.Started) return;
		c.current = d.current, d.current = f;
		let p = S$1.get();
		const w = j(e.states[p].on?.[f.type] ?? e.on?.[f.type]);
		if (!w) return;
		u = w;
		const b = w.target ?? p;
		n$1("transition", f.type, w.target || p, `(${w.actions})`);
		const I = b !== p;
		I ? S$1.set(b) : w.reenter && !I ? S$1.invoke(p, p) : A$1(w.actions);
	};
	return e.watch?.(E$1()), {
		state: m(),
		send: z$1,
		context: i,
		prop: a,
		get scope() {
			return r.value;
		},
		refs: y,
		computed: T,
		event: g(),
		getStatus: () => N
	};
}
function Yn(e) {
	return function(r) {
		return e.value[r];
	};
}
var Je$2 = (e) => {
	nextTick().then(() => {
		e();
	});
};
var Qn = defineComponent({
	name: "Dynamic",
	inheritAttrs: !1,
	setup(e, { attrs: t, slots: r }) {
		return () => {
			if (!r.default) return null;
			const n$1 = vt(r.default()), [o, ...a] = n$1;
			if (Object.keys(t).length > 0) {
				delete o.props?.ref;
				const s$1 = Vn(t, o.props ?? {}), i = cloneVNode(o, s$1);
				for (const l$1 in s$1) l$1.startsWith("on") && (i.props ||= {}, i.props[l$1] = s$1[l$1]);
				return n$1.length === 1 ? i : [i, ...a];
			}
			return n$1;
		};
	}
});
function vt(e) {
	return e ? e.flatMap((t) => t.type === Fragment ? vt(t.children) : [t]) : [];
}
var eo$1 = "br, hr, img, input, area, textarea".split(", "), to$1 = (e) => typeof e == "string" && eo$1.includes(e), xe = (e) => defineComponent({
	name: "Polymorphic",
	inheritAttrs: !1,
	props: { asChild: {
		type: Boolean,
		default: !1
	} },
	setup(t, { attrs: r, slots: n$1 }) {
		return t.asChild ? () => h(Qn, r, n$1) : () => h(e, r, to$1(e) ? void 0 : n$1.default?.());
	}
});
function ro$1() {
	const e = /* @__PURE__ */ new Map();
	return new Proxy(xe, {
		apply(r, n$1, o) {
			return xe(o[0]);
		},
		get(r, n$1) {
			return e.has(n$1) || e.set(n$1, xe(n$1)), e.get(n$1);
		}
	});
}
var bs$1 = ro$1();
function no$1(e) {
	const t = toValue(e);
	return t?.$el ?? t;
}
var oo$1 = (e) => Object.prototype.hasOwnProperty.call(e, "nodeName") && typeof e.nodeName == "string";
function vs$1() {
	const e = getCurrentInstance(), t = ref(), r = computed(() => ["#text", "#comment"].includes(t.value?.$el.nodeName) ? t.value?.$el.nextElementSibling : no$1(t)), n$1 = Object.assign({}, e.exposed), o = {};
	for (const s$1 in e.props) Object.defineProperty(o, s$1, {
		enumerable: !0,
		configurable: !0,
		get: () => e.props[s$1]
	});
	if (Object.keys(n$1).length > 0) for (const s$1 in n$1) Object.defineProperty(o, s$1, {
		enumerable: !0,
		configurable: !0,
		get: () => n$1[s$1]
	});
	Object.defineProperty(o, "$el", {
		enumerable: !0,
		configurable: !0,
		get: () => e.vnode.el
	}), e.exposed = o;
	function a(s$1) {
		t.value = s$1, !(oo$1(s$1) || !s$1) && (Object.defineProperty(o, "$el", {
			enumerable: !0,
			configurable: !0,
			get: () => s$1.$el
		}), e.exposed = o);
	}
	return {
		forwardRef: a,
		currentRef: t,
		currentElement: r
	};
}
var ne = (e, t = []) => ({
	parts: (...r) => {
		if (so$1(t)) return ne(e, r);
		throw new Error("createAnatomy().parts(...) should only be called once. Did you mean to use .extendWith(...) ?");
	},
	extendWith: (...r) => ne(e, [...t, ...r]),
	omit: (...r) => ne(e, t.filter((n$1) => !r.includes(n$1))),
	rename: (r) => ne(r, t),
	keys: () => t,
	build: () => [...new Set(t)].reduce((r, n$1) => Object.assign(r, { [n$1]: {
		selector: [`&[data-scope="${U$1(e)}"][data-part="${U$1(n$1)}"]`, `& [data-scope="${U$1(e)}"][data-part="${U$1(n$1)}"]`].join(", "),
		attrs: {
			"data-scope": U$1(e),
			"data-part": U$1(n$1)
		}
	} }), {})
}), U$1 = (e) => e.replace(/([A-Z])([A-Z])/g, "$1-$2").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase(), so$1 = (e) => e.length === 0, [ys$1, hs$1] = ce$1("EnvironmentContext"), ws = computed(() => ({
	getRootNode: () => document,
	getDocument: () => document,
	getWindow: () => window
})), xs$1 = computed(() => ({
	dir: "ltr",
	locale: "en-US"
})), [Es$1, As] = ce$1("LocaleContext"), Cs = (e) => {
	const t = {};
	for (const [r, n$1] of Object.entries(e)) n$1 !== void 0 && (t[r] = n$1);
	return t;
}, [Ns, Ss] = ce$1("RenderStrategyProps"), Ps = (e, t) => {
	const r = e.__vccOpts || e;
	for (const [n$1, o] of t) r[n$1] = o;
	return r;
};
String, String, String;
function lo$1(e, t) {
	const { state: r, send: n$1, context: o } = e, a = r.matches("mounted", "unmountSuspended");
	return {
		skip: !o.get("initial"),
		present: a,
		setNode(s$1) {
			s$1 && n$1({
				type: "NODE.SET",
				node: s$1
			});
		},
		unmount() {
			n$1({ type: "UNMOUNT" });
		}
	};
}
var fo$1 = {
	props({ props: e }) {
		return {
			...e,
			present: !!e.present
		};
	},
	initialState({ prop: e }) {
		return e("present") ? "mounted" : "unmounted";
	},
	refs() {
		return {
			node: null,
			styles: null
		};
	},
	context({ bindable: e }) {
		return {
			unmountAnimationName: e(() => ({ defaultValue: null })),
			prevAnimationName: e(() => ({ defaultValue: null })),
			present: e(() => ({ defaultValue: !1 })),
			initial: e(() => ({
				sync: !0,
				defaultValue: !1
			}))
		};
	},
	exit: ["cleanupNode"],
	watch({ track: e, prop: t, send: r }) {
		e([() => t("present")], () => {
			r({ type: "PRESENCE.CHANGED" });
		});
	},
	on: {
		"NODE.SET": { actions: ["setupNode"] },
		"PRESENCE.CHANGED": { actions: ["setInitial", "syncPresence"] }
	},
	states: {
		mounted: { on: {
			UNMOUNT: {
				target: "unmounted",
				actions: ["clearPrevAnimationName", "invokeOnExitComplete"]
			},
			"UNMOUNT.SUSPEND": { target: "unmountSuspended" }
		} },
		unmountSuspended: {
			effects: ["trackAnimationEvents"],
			on: {
				MOUNT: {
					target: "mounted",
					actions: ["setPrevAnimationName"]
				},
				UNMOUNT: {
					target: "unmounted",
					actions: ["clearPrevAnimationName", "invokeOnExitComplete"]
				}
			}
		},
		unmounted: { on: { MOUNT: {
			target: "mounted",
			actions: ["setPrevAnimationName"]
		} } }
	},
	implementations: {
		actions: {
			setInitial: ({ context: e }) => {
				e.get("initial") || queueMicrotask(() => {
					e.set("initial", !0);
				});
			},
			invokeOnExitComplete: ({ prop: e, refs: t }) => {
				e("onExitComplete")?.();
				const r = t.get("node");
				if (!r) return;
				const o = new (O(r)).CustomEvent("exitcomplete", { bubbles: !1 });
				r.dispatchEvent(o);
			},
			setupNode: ({ refs: e, event: t }) => {
				e.get("node") !== t.node && (e.set("node", t.node), e.set("styles", Gr(t.node)));
			},
			cleanupNode: ({ refs: e }) => {
				e.set("node", null), e.set("styles", null);
			},
			syncPresence: ({ context: e, refs: t, send: r, prop: n$1 }) => {
				const o = n$1("present");
				if (o) return r({
					type: "MOUNT",
					src: "presence.changed"
				});
				const a = t.get("node");
				if (!o && a?.ownerDocument.visibilityState === "hidden") return r({
					type: "UNMOUNT",
					src: "visibilitychange"
				});
				K(() => {
					const s$1 = oe(t.get("styles"));
					e.set("unmountAnimationName", s$1), s$1 === "none" || s$1 === e.get("prevAnimationName") || t.get("styles")?.display === "none" || t.get("styles")?.animationDuration === "0s" ? r({
						type: "UNMOUNT",
						src: "presence.changed"
					}) : r({ type: "UNMOUNT.SUSPEND" });
				});
			},
			setPrevAnimationName: ({ context: e, refs: t }) => {
				K(() => {
					e.set("prevAnimationName", oe(t.get("styles")));
				});
			},
			clearPrevAnimationName: ({ context: e }) => {
				e.set("prevAnimationName", null);
			}
		},
		effects: { trackAnimationEvents: ({ context: e, refs: t, send: r, prop: n$1 }) => {
			const o = t.get("node");
			if (!o) return;
			const a = (u) => {
				(u.composedPath?.()?.[0] ?? u.target) === o && e.set("prevAnimationName", oe(t.get("styles")));
			}, s$1 = (u) => {
				const c = oe(t.get("styles"));
				Se(u) === o && c === e.get("unmountAnimationName") && !n$1("present") && r({
					type: "UNMOUNT",
					src: "animationend"
				});
			}, i = (u) => {
				Se(u) === o && !n$1("present") && r({
					type: "UNMOUNT",
					src: "animationcancel"
				});
			};
			o.addEventListener("animationstart", a), o.addEventListener("animationcancel", i), o.addEventListener("animationend", s$1);
			const l$1 = Ln(o, { animationFillMode: "forwards" });
			return () => {
				o.removeEventListener("animationstart", a), o.removeEventListener("animationcancel", i), o.removeEventListener("animationend", s$1), hn(() => l$1());
			};
		} }
	}
};
function oe(e) {
	return e?.animationName || "none";
}
Wn()([
	"onExitComplete",
	"present",
	"immediate"
]);
var Ts = (e, t) => {
	const r = ref(!1), n$1 = ref(null), a = Jn(fo$1, computed(() => ({
		present: toValue(e).present,
		onExitComplete: () => t?.("exitComplete")
	}))), s$1 = computed(() => lo$1(a));
	return watch(() => s$1.value.present, () => {
		s$1.value.present && (r.value = !0);
	}), watch(n$1, () => {
		if (n$1.value) {
			const i = n$1.value.$el ? n$1.value.$el : n$1.value;
			i && s$1.value.setNode(i);
		}
	}), computed(() => {
		const i = toValue(e);
		return {
			present: s$1.value.present,
			unmounted: !s$1.value.present && !r.value && i.lazyMount || i?.unmountOnExit && !s$1.value?.present && r.value,
			presenceProps: {
				ref: n$1,
				hidden: !s$1.value.present,
				"data-state": s$1.value.skip && i.skipAnimationOnMount ? void 0 : i?.present ? "open" : "closed"
			}
		};
	});
}, [Ms, Os] = ce$1("PresenceContext");
var [bn$1, ht$1] = ce$1("CollapsibleContext"), Vo$2 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-content",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ht$1();
		return vs$1(), (n$1, o) => unref(t).unmounted ? createCommentVNode("", !0) : (openBlock(), createBlock(unref(bs$1).div, mergeProps({ key: 0 }, unref(t).getContentProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Po$1 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-context",
	setup(e) {
		const t = ht$1();
		return (n$1, o) => renderSlot(n$1.$slots, "default", normalizeProps(guardReactiveProps(unref(t))));
	}
}), To$2 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-root-provider",
	props: {
		value: {},
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e, n$1 = computed(() => t.value);
		return bn$1(n$1), vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(n$1.value.getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
});
var Me$1 = ne("collapsible").parts("root", "trigger", "content", "indicator").build(), Oo$2 = (e) => e.ids?.root ?? `collapsible:${e.id}`, Vt$1 = (e) => e.ids?.content ?? `collapsible:${e.id}:content`, Io$2 = (e) => e.ids?.trigger ?? `collapsible:${e.id}:trigger`, Te$2 = (e) => e.getById(Vt$1(e));
function ko$2(e, t) {
	const { state: n$1, send: o, context: s$1, scope: a, prop: r } = e, i = n$1.matches("open") || n$1.matches("closing"), l$1 = n$1.matches("open"), u = n$1.matches("closed"), { width: g, height: C } = s$1.get("size"), b = !!r("disabled"), h$1 = r("collapsedHeight"), m = r("collapsedWidth"), f = h$1 != null, d = m != null, c = f || d, v$1 = !s$1.get("initial") && l$1;
	return {
		disabled: b,
		visible: i,
		open: l$1,
		measureSize() {
			o({ type: "size.measure" });
		},
		setOpen(y) {
			n$1.matches("open") !== y && o({ type: y ? "open" : "close" });
		},
		getRootProps() {
			return t.element({
				...Me$1.root.attrs,
				"data-state": l$1 ? "open" : "closed",
				dir: r("dir"),
				id: Oo$2(a)
			});
		},
		getContentProps() {
			return t.element({
				...Me$1.content.attrs,
				id: Vt$1(a),
				"data-collapsible": "",
				"data-state": v$1 ? void 0 : l$1 ? "open" : "closed",
				"data-disabled": ko$1(b),
				"data-has-collapsed-size": ko$1(c),
				hidden: !i && !c,
				dir: r("dir"),
				style: {
					"--height": So(C),
					"--width": So(g),
					"--collapsed-height": So(h$1),
					"--collapsed-width": So(m),
					...u && f && {
						overflow: "hidden",
						minHeight: So(h$1),
						maxHeight: So(h$1)
					},
					...u && d && {
						overflow: "hidden",
						minWidth: So(m),
						maxWidth: So(m)
					}
				}
			});
		},
		getTriggerProps() {
			return t.element({
				...Me$1.trigger.attrs,
				id: Io$2(a),
				dir: r("dir"),
				type: "button",
				"data-state": l$1 ? "open" : "closed",
				"data-disabled": ko$1(b),
				"aria-controls": Vt$1(a),
				"aria-expanded": i || !1,
				onClick(y) {
					y.defaultPrevented || b || o({ type: l$1 ? "close" : "open" });
				}
			});
		},
		getIndicatorProps() {
			return t.element({
				...Me$1.indicator.attrs,
				dir: r("dir"),
				"data-state": l$1 ? "open" : "closed",
				"data-disabled": ko$1(b)
			});
		}
	};
}
var So$1 = ps$1({
	initialState({ prop: e }) {
		return e("open") || e("defaultOpen") ? "open" : "closed";
	},
	context({ bindable: e }) {
		return {
			size: e(() => ({
				defaultValue: {
					height: 0,
					width: 0
				},
				sync: !0
			})),
			initial: e(() => ({ defaultValue: !1 }))
		};
	},
	refs() {
		return {
			cleanup: void 0,
			stylesRef: void 0
		};
	},
	watch({ track: e, prop: t, action: n$1 }) {
		e([() => t("open")], () => {
			n$1([
				"setInitial",
				"computeSize",
				"toggleVisibility"
			]);
		});
	},
	exit: ["cleanupNode"],
	states: {
		closed: {
			effects: ["trackTabbableElements"],
			on: {
				"controlled.open": { target: "open" },
				open: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: [
						"setInitial",
						"computeSize",
						"invokeOnOpen"
					]
				}]
			}
		},
		closing: {
			effects: ["trackExitAnimation"],
			on: {
				"controlled.close": { target: "closed" },
				"controlled.open": { target: "open" },
				open: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["setInitial", "invokeOnOpen"]
				}],
				close: [{
					guard: "isOpenControlled",
					actions: ["invokeOnExitComplete"]
				}, {
					target: "closed",
					actions: [
						"setInitial",
						"computeSize",
						"invokeOnExitComplete"
					]
				}],
				"animation.end": {
					target: "closed",
					actions: ["invokeOnExitComplete", "clearInitial"]
				}
			}
		},
		open: {
			effects: ["trackEnterAnimation"],
			on: {
				"controlled.close": { target: "closing" },
				close: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closing",
					actions: [
						"setInitial",
						"computeSize",
						"invokeOnClose"
					]
				}],
				"size.measure": { actions: ["measureSize"] },
				"animation.end": { actions: ["clearInitial"] }
			}
		}
	},
	implementations: {
		guards: { isOpenControlled: ({ prop: e }) => e("open") != null },
		effects: {
			trackEnterAnimation: ({ send: e, scope: t }) => {
				let n$1;
				const o = K(() => {
					const s$1 = Te$2(t);
					if (!s$1) return;
					const a = Gr(s$1).animationName;
					if (!a || a === "none") {
						e({ type: "animation.end" });
						return;
					}
					const i = (l$1) => {
						Se(l$1) === s$1 && e({ type: "animation.end" });
					};
					s$1.addEventListener("animationend", i), n$1 = () => {
						s$1.removeEventListener("animationend", i);
					};
				});
				return () => {
					o(), n$1?.();
				};
			},
			trackExitAnimation: ({ send: e, scope: t }) => {
				let n$1;
				const o = K(() => {
					const s$1 = Te$2(t);
					if (!s$1) return;
					const a = Gr(s$1).animationName;
					if (!a || a === "none") {
						e({ type: "animation.end" });
						return;
					}
					const i = (u) => {
						Se(u) === s$1 && e({ type: "animation.end" });
					};
					s$1.addEventListener("animationend", i);
					const l$1 = Ln(s$1, { animationFillMode: "forwards" });
					n$1 = () => {
						s$1.removeEventListener("animationend", i), hn(() => l$1());
					};
				});
				return () => {
					o(), n$1?.();
				};
			},
			trackTabbableElements: ({ scope: e, prop: t }) => {
				if (!t("collapsedHeight") && !t("collapsedWidth")) return;
				const n$1 = Te$2(e);
				if (!n$1) return;
				const o = () => {
					const i = ge(n$1).map((l$1) => cs$1(l$1, "inert", ""));
					return () => {
						i.forEach((l$1) => l$1());
					};
				};
				let s$1 = o();
				const a = Qo$1(n$1, { callback() {
					s$1(), s$1 = o();
				} });
				return () => {
					s$1(), a();
				};
			}
		},
		actions: {
			setInitial: ({ context: e, flush: t }) => {
				t(() => {
					e.set("initial", !0);
				});
			},
			clearInitial: ({ context: e }) => {
				e.set("initial", !1);
			},
			cleanupNode: ({ refs: e }) => {
				e.set("stylesRef", null);
			},
			measureSize: ({ context: e, scope: t }) => {
				const n$1 = Te$2(t);
				if (!n$1) return;
				const { height: o, width: s$1 } = n$1.getBoundingClientRect();
				e.set("size", {
					height: o,
					width: s$1
				});
			},
			computeSize: ({ refs: e, scope: t, context: n$1 }) => {
				e.get("cleanup")?.();
				const o = K(() => {
					const s$1 = Te$2(t);
					if (!s$1) return;
					const a = s$1.hidden;
					s$1.style.animationName = "none", s$1.style.animationDuration = "0s", s$1.hidden = !1;
					const r = s$1.getBoundingClientRect();
					n$1.set("size", {
						height: r.height,
						width: r.width
					}), n$1.get("initial") && (s$1.style.animationName = "", s$1.style.animationDuration = ""), s$1.hidden = a;
				});
				e.set("cleanup", o);
			},
			invokeOnOpen: ({ prop: e }) => {
				e("onOpenChange")?.({ open: !0 });
			},
			invokeOnClose: ({ prop: e }) => {
				e("onOpenChange")?.({ open: !1 });
			},
			invokeOnExitComplete: ({ prop: e }) => {
				e("onExitComplete")?.();
			},
			toggleVisibility: ({ prop: e, send: t }) => {
				t({ type: e("open") ? "controlled.open" : "controlled.close" });
			}
		}
	}
});
Wn()([
	"dir",
	"disabled",
	"getRootNode",
	"id",
	"ids",
	"collapsedHeight",
	"collapsedWidth",
	"onExitComplete",
	"onOpenChange",
	"defaultOpen",
	"open"
]);
var Bo$1 = (e = {}, t) => {
	const n$1 = useId(), o = hs$1(ws), s$1 = As(xs$1), r = Jn(So$1, computed(() => {
		const u = toValue(e);
		return {
			id: n$1,
			dir: s$1.value.dir,
			getRootNode: o?.value.getRootNode,
			...Cs(u),
			onExitComplete: () => {
				t?.("exitComplete"), u.onExitComplete?.();
			},
			onOpenChange: (g) => {
				t?.("openChange", g), t?.("update:open", g.open), u.onOpenChange?.(g);
			}
		};
	})), i = computed(() => ko$2(r, ms$1)), l$1 = ref(!1);
	return watch(() => i.value.visible, () => {
		i.value.visible && (l$1.value = !0);
	}), computed(() => {
		const u = toValue(e);
		return {
			...i.value,
			unmounted: !i.value.visible && !l$1.value && u.lazyMount || u.unmountOnExit && !i.value.visible && l$1.value
		};
	});
}, Ro$2 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-root",
	props: /* @__PURE__ */ mergeDefaults({
		collapsedHeight: {},
		collapsedWidth: {},
		defaultOpen: { type: Boolean },
		disabled: { type: Boolean },
		id: {},
		ids: {},
		lazyMount: { type: Boolean },
		open: { type: Boolean },
		unmountOnExit: { type: Boolean },
		asChild: { type: Boolean }
	}, {
		defaultOpen: void 0,
		disabled: void 0,
		lazyMount: void 0,
		open: void 0,
		unmountOnExit: void 0
	}),
	emits: [
		"exitComplete",
		"openChange",
		"update:open"
	],
	setup(e, { emit: t }) {
		const s$1 = Bo$1(e, t);
		return bn$1(s$1), vs$1(), (a, r) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(s$1).getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(a.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Do$1 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-trigger",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ht$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).button, mergeProps(unref(t).getTriggerProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Lo$2 = /* @__PURE__ */ defineComponent({
	__name: "collapsible-indicator",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ht$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(t).getIndicatorProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Cn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
	__proto__: null,
	Content: Vo$2,
	Context: Po$1,
	Indicator: Lo$2,
	Root: Ro$2,
	RootProvider: To$2,
	Trigger: Do$1
}, Symbol.toStringTag, { value: "Module" }));
function Fo$1(e) {
	const t = {
		each(n$1) {
			for (let o = 0; o < e.frames?.length; o += 1) {
				const s$1 = e.frames[o];
				s$1 && n$1(s$1);
			}
		},
		addEventListener(n$1, o, s$1) {
			return t.each((a) => {
				try {
					a.document.addEventListener(n$1, o, s$1);
				} catch {}
			}), () => {
				try {
					t.removeEventListener(n$1, o, s$1);
				} catch {}
			};
		},
		removeEventListener(n$1, o, s$1) {
			t.each((a) => {
				try {
					a.document.removeEventListener(n$1, o, s$1);
				} catch {}
			});
		}
	};
	return t;
}
function Ao$1(e) {
	const t = e.frameElement != null ? e.parent : null;
	return {
		addEventListener: (n$1, o, s$1) => {
			try {
				t?.addEventListener(n$1, o, s$1);
			} catch {}
			return () => {
				try {
					t?.removeEventListener(n$1, o, s$1);
				} catch {}
			};
		},
		removeEventListener: (n$1, o, s$1) => {
			try {
				t?.removeEventListener(n$1, o, s$1);
			} catch {}
		}
	};
}
var Xt$1 = "pointerdown.outside", Yt$1 = "focus.outside";
function $o$1(e) {
	for (const t of e) if (M(t) && ie(t)) return !0;
	return !1;
}
var En = (e) => "clientY" in e;
function Mo$2(e, t) {
	if (!En(t) || !e) return !1;
	const n$1 = e.getBoundingClientRect();
	return n$1.width === 0 || n$1.height === 0 ? !1 : n$1.top <= t.clientY && t.clientY <= n$1.top + n$1.height && n$1.left <= t.clientX && t.clientX <= n$1.left + n$1.width;
}
function Ko$2(e, t) {
	return e.y <= t.y && t.y <= e.y + e.height && e.x <= t.x && t.x <= e.x + e.width;
}
function Jt$1(e, t) {
	if (!t || !En(e)) return !1;
	const n$1 = t.scrollHeight > t.clientHeight, o = n$1 && e.clientX > t.offsetLeft + t.clientWidth, s$1 = t.scrollWidth > t.clientWidth, a = s$1 && e.clientY > t.offsetTop + t.clientHeight;
	return Ko$2({
		x: t.offsetLeft,
		y: t.offsetTop,
		width: t.clientWidth + (n$1 ? 16 : 0),
		height: t.clientHeight + (s$1 ? 16 : 0)
	}, {
		x: e.clientX,
		y: e.clientY
	}) ? o || a : !1;
}
function Go$2(e, t) {
	const { exclude: n$1, onFocusOutside: o, onPointerDownOutside: s$1, onInteractOutside: a, defer: r, followControlledElements: i = !0 } = t;
	if (!e) return;
	const l$1 = le(e), u = O(e), g = Fo$1(u), C = Ao$1(u);
	function b(y, k) {
		if (!M(k) || !k.isConnected || jr$1(e, k) || Mo$2(e, y) || i && Oo$1(e, k)) return !1;
		const D$1 = l$1.querySelector(`[aria-controls="${e.id}"]`);
		if (D$1) {
			if (Jt$1(y, bt$1(D$1))) return !1;
		}
		return Jt$1(y, bt$1(e)) ? !1 : !n$1?.(k);
	}
	const h$1 = /* @__PURE__ */ new Set(), m = Y(e?.getRootNode());
	function f(y) {
		function k(D$1) {
			const M$1 = r && !zo() ? K : (J$2) => J$2(), K$1 = D$1 ?? y, w = K$1?.composedPath?.() ?? [K$1?.target];
			M$1(() => {
				const J$2 = m ? w[0] : Se(y);
				if (!(!e || !b(y, J$2))) {
					if (s$1 || a) {
						const _e = xr$1(s$1, a);
						e.addEventListener(Xt$1, _e, { once: !0 });
					}
					Zt(e, Xt$1, {
						bubbles: !1,
						cancelable: !0,
						detail: {
							originalEvent: K$1,
							contextmenu: Uo$1(K$1),
							focusable: $o$1(w),
							target: J$2
						}
					});
				}
			});
		}
		y.pointerType === "touch" ? (h$1.forEach((D$1) => D$1()), h$1.add(_(l$1, "click", k, { once: !0 })), h$1.add(C.addEventListener("click", k, { once: !0 })), h$1.add(g.addEventListener("click", k, { once: !0 }))) : k();
	}
	const d = /* @__PURE__ */ new Set(), c = setTimeout(() => {
		d.add(_(l$1, "pointerdown", f, !0)), d.add(C.addEventListener("pointerdown", f, !0)), d.add(g.addEventListener("pointerdown", f, !0));
	}, 0);
	function v$1(y) {
		(r ? K : (D$1) => D$1())(() => {
			const D$1 = y?.composedPath?.() ?? [y?.target], M$1 = m ? D$1[0] : Se(y);
			if (!(!e || !b(y, M$1))) {
				if (o || a) {
					const K$1 = xr$1(o, a);
					e.addEventListener(Yt$1, K$1, { once: !0 });
				}
				Zt(e, Yt$1, {
					bubbles: !1,
					cancelable: !0,
					detail: {
						originalEvent: y,
						contextmenu: !1,
						focusable: ie(M$1),
						target: M$1
					}
				});
			}
		});
	}
	return zo() || (d.add(_(l$1, "focusin", v$1, !0)), d.add(C.addEventListener("focusin", v$1, !0)), d.add(g.addEventListener("focusin", v$1, !0))), () => {
		clearTimeout(c), h$1.forEach((y) => y()), d.forEach((y) => y());
	};
}
function Ho$2(e, t) {
	const { defer: n$1 } = t, o = n$1 ? K : (a) => a(), s$1 = [];
	return s$1.push(o(() => {
		const a = typeof e == "function" ? e() : e;
		s$1.push(Go$2(a, t));
	})), () => {
		s$1.forEach((a) => a?.());
	};
}
function Zt(e, t, n$1) {
	const s$1 = new (e.ownerDocument.defaultView || window).CustomEvent(t, n$1);
	return e.dispatchEvent(s$1);
}
function Wo$2(e, t) {
	const n$1 = (o) => {
		o.key === "Escape" && (o.isComposing || t?.(o));
	};
	return _(le(e), "keydown", n$1, { capture: !0 });
}
var Qt$1 = "layer:request-dismiss", q$1 = {
	layers: [],
	branches: [],
	count() {
		return this.layers.length;
	},
	pointerBlockingLayers() {
		return this.layers.filter((e) => e.pointerBlocking);
	},
	topMostPointerBlockingLayer() {
		return [...this.pointerBlockingLayers()].slice(-1)[0];
	},
	hasPointerBlockingLayer() {
		return this.pointerBlockingLayers().length > 0;
	},
	isBelowPointerBlockingLayer(e) {
		return this.indexOf(e) < (this.topMostPointerBlockingLayer() ? this.indexOf(this.topMostPointerBlockingLayer()?.node) : -1);
	},
	isTopMost(e) {
		return this.layers[this.count() - 1]?.node === e;
	},
	getNestedLayers(e) {
		return Array.from(this.layers).slice(this.indexOf(e) + 1);
	},
	getLayersByType(e) {
		return this.layers.filter((t) => t.type === e);
	},
	getNestedLayersByType(e, t) {
		const n$1 = this.indexOf(e);
		return n$1 === -1 ? [] : this.layers.slice(n$1 + 1).filter((o) => o.type === t);
	},
	getParentLayerOfType(e, t) {
		const n$1 = this.indexOf(e);
		if (!(n$1 <= 0)) return this.layers.slice(0, n$1).reverse().find((o) => o.type === t);
	},
	countNestedLayersOfType(e, t) {
		return this.getNestedLayersByType(e, t).length;
	},
	isInNestedLayer(e, t) {
		return this.getNestedLayers(e).some((n$1) => jr$1(n$1.node, t));
	},
	isInBranch(e) {
		return Array.from(this.branches).some((t) => jr$1(t, e));
	},
	add(e) {
		this.layers.push(e), this.syncLayers();
	},
	addBranch(e) {
		this.branches.push(e);
	},
	remove(e) {
		const t = this.indexOf(e);
		t < 0 || (t < this.count() - 1 && this.getNestedLayers(e).forEach((o) => q$1.dismiss(o.node, e)), this.layers.splice(t, 1), this.syncLayers());
	},
	removeBranch(e) {
		const t = this.branches.indexOf(e);
		t >= 0 && this.branches.splice(t, 1);
	},
	syncLayers() {
		this.layers.forEach((e, t) => {
			e.node.style.setProperty("--layer-index", `${t}`), e.node.removeAttribute("data-nested"), e.node.removeAttribute("data-has-nested"), this.getParentLayerOfType(e.node, e.type) && e.node.setAttribute("data-nested", e.type);
			const o = this.countNestedLayersOfType(e.node, e.type);
			o > 0 && e.node.setAttribute("data-has-nested", e.type), e.node.style.setProperty("--nested-layer-count", `${o}`);
		});
	},
	indexOf(e) {
		return this.layers.findIndex((t) => t.node === e);
	},
	dismiss(e, t) {
		const n$1 = this.indexOf(e);
		if (n$1 === -1) return;
		const o = this.layers[n$1];
		qo$2(e, Qt$1, (s$1) => {
			o.requestDismiss?.(s$1), s$1.defaultPrevented || o?.dismiss();
		}), jo$2(e, Qt$1, {
			originalLayer: e,
			targetLayer: t,
			originalIndex: n$1,
			targetIndex: t ? this.indexOf(t) : -1
		}), this.syncLayers();
	},
	clear() {
		this.remove(this.layers[0].node);
	}
};
function jo$2(e, t, n$1) {
	const s$1 = new (e.ownerDocument.defaultView || window).CustomEvent(t, {
		cancelable: !0,
		bubbles: !0,
		detail: n$1
	});
	return e.dispatchEvent(s$1);
}
function qo$2(e, t, n$1) {
	e.addEventListener(t, n$1, { once: !0 });
}
var en;
function tn() {
	q$1.layers.forEach(({ node: e }) => {
		e.style.pointerEvents = q$1.isBelowPointerBlockingLayer(e) ? "none" : "auto";
	});
}
function Uo$2(e) {
	e.style.pointerEvents = "";
}
function zo$1(e, t) {
	const n$1 = le(e), o = [];
	return q$1.hasPointerBlockingLayer() && !n$1.body.hasAttribute("data-inert") && (en = document.body.style.pointerEvents, queueMicrotask(() => {
		n$1.body.style.pointerEvents = "none", n$1.body.setAttribute("data-inert", "");
	})), t?.forEach((s$1) => {
		const [a, r] = fs$1(() => {
			const i = s$1();
			return M(i) ? i : null;
		}, { timeout: 1e3 });
		a.then((i) => o.push(Ln(i, { pointerEvents: "auto" }))), o.push(r);
	}), () => {
		q$1.hasPointerBlockingLayer() || (queueMicrotask(() => {
			n$1.body.style.pointerEvents = en, n$1.body.removeAttribute("data-inert"), n$1.body.style.length === 0 && n$1.body.removeAttribute("style");
		}), o.forEach((s$1) => s$1()));
	};
}
function Xo$2(e, t) {
	const { warnOnMissingNode: n$1 = !0 } = t;
	if (n$1 && !e) {
		qe$1("[@zag-js/dismissable] node is `null` or `undefined`");
		return;
	}
	if (!e) return;
	const { onDismiss: o, onRequestDismiss: s$1, pointerBlocking: a, exclude: r, debug: i, type: l$1 = "dialog" } = t, u = {
		dismiss: o,
		node: e,
		type: l$1,
		pointerBlocking: a,
		requestDismiss: s$1
	};
	q$1.add(u), tn();
	function g(f) {
		const d = Se(f.detail.originalEvent);
		q$1.isBelowPointerBlockingLayer(e) || q$1.isInBranch(d) || (t.onPointerDownOutside?.(f), t.onInteractOutside?.(f), !f.defaultPrevented && (i && console.log("onPointerDownOutside:", f.detail.originalEvent), o?.()));
	}
	function C(f) {
		const d = Se(f.detail.originalEvent);
		q$1.isInBranch(d) || (t.onFocusOutside?.(f), t.onInteractOutside?.(f), !f.defaultPrevented && (i && console.log("onFocusOutside:", f.detail.originalEvent), o?.()));
	}
	function b(f) {
		q$1.isTopMost(e) && (t.onEscapeKeyDown?.(f), !f.defaultPrevented && o && (f.preventDefault(), o()));
	}
	function h$1(f) {
		if (!e) return !1;
		const d = typeof r == "function" ? r() : r, c = Array.isArray(d) ? d : [d], v$1 = t.persistentElements?.map((y) => y()).filter(M);
		return v$1 && c.push(...v$1), c.some((y) => jr$1(y, f)) || q$1.isInNestedLayer(e, f);
	}
	const m = [
		a ? zo$1(e, t.persistentElements) : void 0,
		Wo$2(e, b),
		Ho$2(e, {
			exclude: h$1,
			onFocusOutside: C,
			onPointerDownOutside: g,
			defer: t.defer
		})
	];
	return () => {
		q$1.remove(e), tn(), Uo$2(e), m.forEach((f) => f?.());
	};
}
function Yo$1(e, t) {
	const { defer: n$1 } = t, o = n$1 ? K : (a) => a(), s$1 = [];
	return s$1.push(o(() => {
		const a = J$1(e) ? e() : e;
		s$1.push(Xo$2(a, t));
	})), () => {
		s$1.forEach((a) => a?.());
	};
}
var Jo$1 = () => (e, t) => t.reduce((n$1, o) => {
	const [s$1, a] = n$1, r = o;
	return a[r] !== void 0 && (s$1[r] = a[r]), delete a[r], [s$1, a];
}, [{}, { ...e }]);
function Zo$1(e) {
	return !(e.metaKey || !fe() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
var Qo$2 = /* @__PURE__ */ new Set([
	"checkbox",
	"radio",
	"range",
	"color",
	"file",
	"image",
	"button",
	"submit",
	"reset"
]);
function es$1(e, t, n$1) {
	const o = n$1 ? Se(n$1) : null, s$1 = O(o);
	return e = e || o instanceof s$1.HTMLInputElement && !Qo$2.has(o?.type) || o instanceof s$1.HTMLTextAreaElement || o instanceof s$1.HTMLElement && o.isContentEditable, !(e && t === "keyboard" && n$1 instanceof s$1.KeyboardEvent && !Reflect.has(ts$1, n$1.key));
}
var he$1 = null, Pt$1 = /* @__PURE__ */ new Set(), Je$1 = /* @__PURE__ */ new Map(), ue$1 = !1, Tt$1 = !1, ts$1 = {
	Tab: !0,
	Escape: !0
};
function pt$1(e, t) {
	for (let n$1 of Pt$1) n$1(e, t);
}
function Ze$1(e) {
	ue$1 = !0, Zo$1(e) && (he$1 = "keyboard", pt$1("keyboard", e));
}
function U(e) {
	he$1 = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (ue$1 = !0, pt$1("pointer", e));
}
function Nn(e) {
	Vo$1(e) && (ue$1 = !0, he$1 = "virtual");
}
function xn(e) {
	const t = Se(e);
	t === O(t) || t === le(t) || (!ue$1 && !Tt$1 && (he$1 = "virtual", pt$1("virtual", e)), ue$1 = !1, Tt$1 = !1);
}
function _n() {
	ue$1 = !1, Tt$1 = !0;
}
function ns$1(e) {
	if (typeof window > "u" || Je$1.get(O(e))) return;
	const t = O(e), n$1 = le(e);
	let o = t.HTMLElement.prototype.focus;
	function s$1() {
		he$1 = "virtual", pt$1("virtual", null), ue$1 = !0, o.apply(this, arguments);
	}
	try {
		Object.defineProperty(t.HTMLElement.prototype, "focus", {
			configurable: !0,
			value: s$1
		});
	} catch {}
	n$1.addEventListener("keydown", Ze$1, !0), n$1.addEventListener("keyup", Ze$1, !0), n$1.addEventListener("click", Nn, !0), t.addEventListener("focus", xn, !0), t.addEventListener("blur", _n, !1), typeof t.PointerEvent < "u" ? (n$1.addEventListener("pointerdown", U, !0), n$1.addEventListener("pointermove", U, !0), n$1.addEventListener("pointerup", U, !0)) : (n$1.addEventListener("mousedown", U, !0), n$1.addEventListener("mousemove", U, !0), n$1.addEventListener("mouseup", U, !0)), t.addEventListener("beforeunload", () => {
		os$2(e);
	}, { once: !0 }), Je$1.set(t, { focus: o });
}
var os$2 = (e, t) => {
	const n$1 = O(e), o = le(e), s$1 = Je$1.get(n$1);
	if (s$1) {
		try {
			Object.defineProperty(n$1.HTMLElement.prototype, "focus", {
				configurable: !0,
				value: s$1.focus
			});
		} catch {}
		o.removeEventListener("keydown", Ze$1, !0), o.removeEventListener("keyup", Ze$1, !0), o.removeEventListener("click", Nn, !0), n$1.removeEventListener("focus", xn, !0), n$1.removeEventListener("blur", _n, !1), typeof n$1.PointerEvent < "u" ? (o.removeEventListener("pointerdown", U, !0), o.removeEventListener("pointermove", U, !0), o.removeEventListener("pointerup", U, !0)) : (o.removeEventListener("mousedown", U, !0), o.removeEventListener("mousemove", U, !0), o.removeEventListener("mouseup", U, !0)), Je$1.delete(n$1);
	}
};
function wt$1() {
	return he$1 === "keyboard";
}
function ss$1(e = {}) {
	const { isTextInput: t, autoFocus: n$1, onChange: o, root: s$1 } = e;
	ns$1(s$1), o?.({
		isFocusVisible: n$1 || wt$1(),
		modality: he$1
	});
	const a = (r, i) => {
		es$1(!!t, r, i) && o?.({
			isFocusVisible: wt$1(),
			modality: r
		});
	};
	return Pt$1.add(a), () => {
		Pt$1.delete(a);
	};
}
var as$2 = (e) => typeof e == "boolean" ? e : e === "true", [yr, rs$1] = ce$1("FieldsetContext"), [Vn$1, ie$1] = ce$1("DialogContext"), is$1 = /* @__PURE__ */ defineComponent({
	__name: "dialog-backdrop",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1(), n$1 = Ss(), o = Ts(computed(() => ({
			...n$1.value,
			present: t.value.open
		}))), s$1 = computed(() => Vn(t.value.getBackdropProps(), o.value.presenceProps));
		return vs$1(), (a, r) => unref(o).unmounted ? createCommentVNode("", !0) : (openBlock(), createBlock(unref(bs$1).div, mergeProps({ key: 0 }, s$1.value, { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(a.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ls$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-close-trigger",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).button, mergeProps(unref(t).getCloseTriggerProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ds$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-content",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1(), n$1 = Os(), o = computed(() => Vn(t.value.getContentProps(), n$1.value.presenceProps));
		return vs$1(), (s$1, a) => unref(n$1).unmounted ? createCommentVNode("", !0) : (openBlock(), createBlock(unref(bs$1).div, mergeProps({ key: 0 }, o.value, { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(s$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), cs$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-context",
	setup(e) {
		const t = ie$1();
		return (n$1, o) => renderSlot(n$1.$slots, "default", normalizeProps(guardReactiveProps(unref(t))));
	}
}), us$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-description",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(t).getDescriptionProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), hs$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-positioner",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1(), n$1 = Ss(), o = Ts(computed(() => ({
			...n$1.value,
			present: t.value.open
		})));
		return Ms(o), vs$1(), (s$1, a) => unref(o).unmounted ? createCommentVNode("", !0) : (openBlock(), createBlock(unref(bs$1).div, mergeProps({ key: 0 }, unref(t).getPositionerProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(s$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ps$2 = /* @__PURE__ */ defineComponent({
	__name: "dialog-root-provider",
	props: {
		value: {},
		lazyMount: { type: Boolean },
		unmountOnExit: { type: Boolean }
	},
	setup(e) {
		const t = e;
		return Vn$1(computed(() => t.value)), Ns(computed(() => ({
			lazyMount: t.lazyMount,
			unmountOnExit: t.unmountOnExit
		}))), vs$1(), (o, s$1) => renderSlot(o.$slots, "default");
	}
});
var me = /* @__PURE__ */ new WeakMap(), Ke$1 = /* @__PURE__ */ new WeakMap(), Ge = {}, Ct$1 = 0, Pn = (e) => e && (e.host || Pn(e.parentNode)), fs$2 = (e, t) => t.map((n$1) => {
	if (e.contains(n$1)) return n$1;
	const o = Pn(n$1);
	return o && e.contains(o) ? o : (console.error("[zag-js > ariaHidden] target", n$1, "in not contained inside", e, ". Doing nothing"), null);
}).filter((n$1) => !!n$1), gs$1 = /* @__PURE__ */ new Set([
	"script",
	"output",
	"status",
	"next-route-announcer"
]), vs$2 = (e) => gs$1.has(e.localName) || e.role === "status" || e.hasAttribute("aria-live") ? !0 : e.matches("[data-live-announcer]"), ms$2 = (e, t) => {
	const { parentNode: n$1, markerName: o, controlAttribute: s$1, followControlledElements: a = !0 } = t, r = fs$2(n$1, Array.isArray(e) ? e : [e]);
	Ge[o] || (Ge[o] = /* @__PURE__ */ new WeakMap());
	const i = Ge[o], l$1 = [], u = /* @__PURE__ */ new Set(), g = new Set(r), C = (h$1) => {
		!h$1 || u.has(h$1) || (u.add(h$1), C(h$1.parentNode));
	};
	r.forEach((h$1) => {
		C(h$1), a && M(h$1) && Vr$1(h$1, (m) => {
			C(m);
		});
	});
	const b = (h$1) => {
		!h$1 || g.has(h$1) || Array.prototype.forEach.call(h$1.children, (m) => {
			if (u.has(m)) b(m);
			else try {
				if (vs$2(m)) return;
				const d = m.getAttribute(s$1) === "true", c = (me.get(m) || 0) + 1, v$1 = (i.get(m) || 0) + 1;
				me.set(m, c), i.set(m, v$1), l$1.push(m), c === 1 && d && Ke$1.set(m, !0), v$1 === 1 && m.setAttribute(o, ""), d || m.setAttribute(s$1, "true");
			} catch (f) {
				console.error("[zag-js > ariaHidden] cannot operate on ", m, f);
			}
		});
	};
	return b(n$1), u.clear(), Ct$1++, () => {
		l$1.forEach((h$1) => {
			const m = me.get(h$1) - 1, f = i.get(h$1) - 1;
			me.set(h$1, m), i.set(h$1, f), m || (Ke$1.has(h$1) || h$1.removeAttribute(s$1), Ke$1.delete(h$1)), f || h$1.removeAttribute(o);
		}), Ct$1--, Ct$1 || (me = /* @__PURE__ */ new WeakMap(), me = /* @__PURE__ */ new WeakMap(), Ke$1 = /* @__PURE__ */ new WeakMap(), Ge = {});
	};
}, ys = (e) => (Array.isArray(e) ? e[0] : e).ownerDocument.body, bs$2 = (e, t = ys(e), n$1 = "data-aria-hidden", o = !0) => {
	if (t) return ms$2(e, {
		parentNode: t,
		markerName: n$1,
		controlAttribute: "aria-hidden",
		followControlledElements: o
	});
}, Cs$1 = (e) => {
	const t = requestAnimationFrame(() => e());
	return () => cancelAnimationFrame(t);
};
function Es(e, t = {}) {
	const { defer: n$1 = !0 } = t, o = n$1 ? Cs$1 : (a) => a(), s$1 = [];
	return s$1.push(o(() => {
		const r = (typeof e == "function" ? e() : e).filter(Boolean);
		r.length !== 0 && s$1.push(bs$2(r));
	})), () => {
		s$1.forEach((a) => a?.());
	};
}
var Ns$1 = Object.defineProperty, xs$2 = (e, t, n$1) => t in e ? Ns$1(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n$1
}) : e[t] = n$1, R$1 = (e, t, n$1) => xs$2(e, typeof t != "symbol" ? t + "" : t, n$1), nn = {
	activateTrap(e, t) {
		if (e.length > 0) {
			const o = e[e.length - 1];
			o !== t && o.pause();
		}
		const n$1 = e.indexOf(t);
		n$1 === -1 || e.splice(n$1, 1), e.push(t);
	},
	deactivateTrap(e, t) {
		const n$1 = e.indexOf(t);
		n$1 !== -1 && e.splice(n$1, 1), e.length > 0 && e[e.length - 1].unpause();
	}
}, _s = [], Vs = class {
	constructor(e, t) {
		R$1(this, "trapStack"), R$1(this, "config"), R$1(this, "doc"), R$1(this, "state", {
			containers: [],
			containerGroups: [],
			tabbableGroups: [],
			nodeFocusedBeforeActivation: null,
			mostRecentlyFocusedNode: null,
			active: !1,
			paused: !1,
			delayInitialFocusTimer: void 0,
			recentNavEvent: void 0
		}), R$1(this, "portalContainers", /* @__PURE__ */ new Set()), R$1(this, "listenerCleanups", []), R$1(this, "handleFocus", (o) => {
			const s$1 = Se(o), a = this.findContainerIndex(s$1, o) >= 0;
			if (a || Me(s$1)) a && (this.state.mostRecentlyFocusedNode = s$1);
			else {
				o.stopImmediatePropagation();
				let r, i = !0;
				if (this.state.mostRecentlyFocusedNode) if (Xo$1(this.state.mostRecentlyFocusedNode) > 0) {
					const l$1 = this.findContainerIndex(this.state.mostRecentlyFocusedNode), { tabbableNodes: u } = this.state.containerGroups[l$1];
					if (u.length > 0) {
						const g = u.findIndex((C) => C === this.state.mostRecentlyFocusedNode);
						g >= 0 && (this.config.isKeyForward(this.state.recentNavEvent) ? g + 1 < u.length && (r = u[g + 1], i = !1) : g - 1 >= 0 && (r = u[g - 1], i = !1));
					}
				} else this.state.containerGroups.some((l$1) => l$1.tabbableNodes.some((u) => Xo$1(u) > 0)) || (i = !1);
				else i = !1;
				i && (r = this.findNextNavNode({
					target: this.state.mostRecentlyFocusedNode,
					isBackward: this.config.isKeyBackward(this.state.recentNavEvent)
				})), r ? this.tryFocus(r) : this.tryFocus(this.state.mostRecentlyFocusedNode || this.getInitialFocusNode());
			}
			this.state.recentNavEvent = void 0;
		}), R$1(this, "handlePointerDown", (o) => {
			const s$1 = Se(o);
			if (!(this.findContainerIndex(s$1, o) >= 0)) {
				if (Oe$2(this.config.clickOutsideDeactivates, o)) {
					this.deactivate({ returnFocus: this.config.returnFocusOnDeactivate });
					return;
				}
				Oe$2(this.config.allowOutsideClick, o) || o.preventDefault();
			}
		}), R$1(this, "handleClick", (o) => {
			const s$1 = Se(o);
			this.findContainerIndex(s$1, o) >= 0 || Oe$2(this.config.clickOutsideDeactivates, o) || Oe$2(this.config.allowOutsideClick, o) || (o.preventDefault(), o.stopImmediatePropagation());
		}), R$1(this, "handleTabKey", (o) => {
			if (this.config.isKeyForward(o) || this.config.isKeyBackward(o)) {
				this.state.recentNavEvent = o;
				const s$1 = this.config.isKeyBackward(o), a = this.findNextNavNode({
					event: o,
					isBackward: s$1
				});
				if (!a) return;
				we(o) && o.preventDefault(), this.tryFocus(a);
			}
		}), R$1(this, "handleEscapeKey", (o) => {
			Ps$1(o) && Oe$2(this.config.escapeDeactivates, o) !== !1 && (o.preventDefault(), this.deactivate());
		}), R$1(this, "_mutationObserver"), R$1(this, "setupMutationObserver", () => {
			this._mutationObserver = new (this.doc.defaultView || window).MutationObserver((s$1) => {
				s$1.some((i) => Array.from(i.removedNodes).some((u) => u === this.state.mostRecentlyFocusedNode)) && this.tryFocus(this.getInitialFocusNode()), s$1.some((i) => i.type === "attributes" && (i.attributeName === "aria-controls" || i.attributeName === "aria-expanded") ? !0 : i.type === "childList" && i.addedNodes.length > 0 ? Array.from(i.addedNodes).some((l$1) => {
					if (l$1.nodeType !== Node.ELEMENT_NODE) return !1;
					const u = l$1;
					return Ro$1(u) ? !0 : u.id && !this.state.containers.some((g) => g.contains(u)) ? Lo$1(u) : !1;
				}) : !1) && this.state.active && !this.state.paused && (this.updateTabbableNodes(), this.updatePortalContainers());
			});
		}), R$1(this, "updateObservedNodes", () => {
			this._mutationObserver?.disconnect(), this.state.active && !this.state.paused && (this.state.containers.map((o) => {
				this._mutationObserver?.observe(o, {
					subtree: !0,
					childList: !0,
					attributes: !0,
					attributeFilter: ["aria-controls", "aria-expanded"]
				});
			}), this.portalContainers.forEach((o) => {
				this.observePortalContainer(o);
			}));
		}), R$1(this, "getInitialFocusNode", () => {
			let o = this.getNodeForOption("initialFocus", { hasFallback: !0 });
			if (o === !1) return !1;
			if (o === void 0 || o && !ie(o)) {
				const s$1 = Oe$1(this.doc);
				if (s$1 && this.findContainerIndex(s$1) >= 0) o = s$1;
				else {
					const a = this.state.tabbableGroups[0];
					o = a && a.firstTabbableNode || this.getNodeForOption("fallbackFocus");
				}
			} else o === null && (o = this.getNodeForOption("fallbackFocus"));
			if (!o) throw new Error("Your focus-trap needs to have at least one focusable element");
			return o.isConnected || (o = this.getNodeForOption("fallbackFocus")), o;
		}), R$1(this, "tryFocus", (o) => {
			if (o !== !1 && o !== Oe$1(this.doc)) {
				if (!o || !o.focus) {
					this.tryFocus(this.getInitialFocusNode());
					return;
				}
				o.focus({ preventScroll: !!this.config.preventScroll }), this.state.mostRecentlyFocusedNode = o, Ts$1(o) && o.select();
			}
		}), R$1(this, "deactivate", (o) => {
			if (!this.state.active) return this;
			const s$1 = {
				onDeactivate: this.config.onDeactivate,
				onPostDeactivate: this.config.onPostDeactivate,
				checkCanReturnFocus: this.config.checkCanReturnFocus,
				...o
			};
			clearTimeout(this.state.delayInitialFocusTimer), this.state.delayInitialFocusTimer = void 0, this.removeListeners(), this.state.active = !1, this.state.paused = !1, this.updateObservedNodes(), nn.deactivateTrap(this.trapStack, this), this.portalContainers.clear();
			const a = this.getOption(s$1, "onDeactivate"), r = this.getOption(s$1, "onPostDeactivate"), i = this.getOption(s$1, "checkCanReturnFocus"), l$1 = this.getOption(s$1, "returnFocus", "returnFocusOnDeactivate");
			a?.();
			const u = () => {
				on(() => {
					if (l$1) {
						const g = this.getReturnFocusNode(this.state.nodeFocusedBeforeActivation);
						this.tryFocus(g);
					}
					r?.();
				});
			};
			if (l$1 && i) return i(this.getReturnFocusNode(this.state.nodeFocusedBeforeActivation)).then(u, u), this;
			return u(), this;
		}), R$1(this, "pause", (o) => {
			if (this.state.paused || !this.state.active) return this;
			const s$1 = this.getOption(o, "onPause"), a = this.getOption(o, "onPostPause");
			return this.state.paused = !0, s$1?.(), this.removeListeners(), this.updateObservedNodes(), a?.(), this;
		}), R$1(this, "unpause", (o) => {
			if (!this.state.paused || !this.state.active) return this;
			const s$1 = this.getOption(o, "onUnpause"), a = this.getOption(o, "onPostUnpause");
			return this.state.paused = !1, s$1?.(), this.updateTabbableNodes(), this.addListeners(), this.updateObservedNodes(), a?.(), this;
		}), R$1(this, "updateContainerElements", (o) => (this.state.containers = Array.isArray(o) ? o.filter(Boolean) : [o].filter(Boolean), this.state.active && this.updateTabbableNodes(), this.updateObservedNodes(), this)), R$1(this, "getReturnFocusNode", (o) => {
			const s$1 = this.getNodeForOption("setReturnFocus", { params: [o] });
			return s$1 || (s$1 === !1 ? !1 : o);
		}), R$1(this, "getOption", (o, s$1, a) => o && o[s$1] !== void 0 ? o[s$1] : this.config[a || s$1]), R$1(this, "getNodeForOption", (o, { hasFallback: s$1 = !1, params: a = [] } = {}) => {
			let r = this.config[o];
			if (typeof r == "function" && (r = r(...a)), r === !0 && (r = void 0), !r) {
				if (r === void 0 || r === !1) return r;
				throw new Error(`\`${o}\` was specified but was not a node, or did not return a node`);
			}
			let i = r;
			if (typeof r == "string") {
				try {
					i = this.doc.querySelector(r);
				} catch (l$1) {
					throw new Error(`\`${o}\` appears to be an invalid selector; error="${l$1.message}"`);
				}
				if (!i && !s$1) throw new Error(`\`${o}\` as selector refers to no known node`);
			}
			return i;
		}), R$1(this, "findNextNavNode", (o) => {
			const { event: s$1, isBackward: a = !1 } = o, r = o.target || Se(s$1);
			this.updateTabbableNodes();
			let i = null;
			if (this.state.tabbableGroups.length > 0) {
				const l$1 = this.findContainerIndex(r, s$1), u = l$1 >= 0 ? this.state.containerGroups[l$1] : void 0;
				if (l$1 < 0) a ? i = this.state.tabbableGroups[this.state.tabbableGroups.length - 1].lastTabbableNode : i = this.state.tabbableGroups[0].firstTabbableNode;
				else if (a) {
					let g = this.state.tabbableGroups.findIndex(({ firstTabbableNode: C }) => r === C);
					if (g < 0 && (u?.container === r || ie(r) && !he(r) && !u?.nextTabbableNode(r, !1)) && (g = l$1), g >= 0) {
						const C = g === 0 ? this.state.tabbableGroups.length - 1 : g - 1, b = this.state.tabbableGroups[C];
						i = Xo$1(r) >= 0 ? b.lastTabbableNode : b.lastDomTabbableNode;
					} else we(s$1) || (i = u?.nextTabbableNode(r, !1));
				} else {
					let g = this.state.tabbableGroups.findIndex(({ lastTabbableNode: C }) => r === C);
					if (g < 0 && (u?.container === r || ie(r) && !he(r) && !u?.nextTabbableNode(r)) && (g = l$1), g >= 0) {
						const C = g === this.state.tabbableGroups.length - 1 ? 0 : g + 1, b = this.state.tabbableGroups[C];
						i = Xo$1(r) >= 0 ? b.firstTabbableNode : b.firstDomTabbableNode;
					} else we(s$1) || (i = u?.nextTabbableNode(r));
				}
			} else i = this.getNodeForOption("fallbackFocus");
			return i;
		}), this.trapStack = t.trapStack || _s;
		const n$1 = {
			returnFocusOnDeactivate: !0,
			escapeDeactivates: !0,
			delayInitialFocus: !0,
			followControlledElements: !0,
			isKeyForward(o) {
				return we(o) && !o.shiftKey;
			},
			isKeyBackward(o) {
				return we(o) && o.shiftKey;
			},
			...t
		};
		this.doc = n$1.document || le(Array.isArray(e) ? e[0] : e), this.config = n$1, this.updateContainerElements(e), this.setupMutationObserver();
	}
	addPortalContainer(e) {
		const t = e.parentElement;
		t && !this.portalContainers.has(t) && (this.portalContainers.add(t), this.state.active && !this.state.paused && this.observePortalContainer(t));
	}
	observePortalContainer(e) {
		this._mutationObserver?.observe(e, {
			subtree: !0,
			childList: !0,
			attributes: !0,
			attributeFilter: ["aria-controls", "aria-expanded"]
		});
	}
	updatePortalContainers() {
		this.config.followControlledElements && this.state.containers.forEach((e) => {
			Io$1(e).forEach((n$1) => {
				this.addPortalContainer(n$1);
			});
		});
	}
	get active() {
		return this.state.active;
	}
	get paused() {
		return this.state.paused;
	}
	findContainerIndex(e, t) {
		const n$1 = typeof t?.composedPath == "function" ? t.composedPath() : void 0;
		return this.state.containerGroups.findIndex(({ container: o, tabbableNodes: s$1 }) => o.contains(e) || n$1?.includes(o) || s$1.find((a) => a === e) || this.isControlledElement(o, e));
	}
	isControlledElement(e, t) {
		return this.config.followControlledElements ? Oo$1(e, t) : !1;
	}
	updateTabbableNodes() {
		if (this.state.containerGroups = this.state.containers.map((e) => {
			const t = ge(e, { getShadowRoot: this.config.getShadowRoot }), n$1 = bn(e, { getShadowRoot: this.config.getShadowRoot }), o = t[0], s$1 = t[t.length - 1], a = o, r = s$1;
			let i = !1;
			for (let u = 0; u < t.length; u++) if (Xo$1(t[u]) > 0) {
				i = !0;
				break;
			}
			function l$1(u, g = !0) {
				const C = t.indexOf(u);
				if (C >= 0) return t[C + (g ? 1 : -1)];
				const b = n$1.indexOf(u);
				if (!(b < 0)) {
					if (g) {
						for (let h$1 = b + 1; h$1 < n$1.length; h$1++) if (he(n$1[h$1])) return n$1[h$1];
					} else for (let h$1 = b - 1; h$1 >= 0; h$1--) if (he(n$1[h$1])) return n$1[h$1];
				}
			}
			return {
				container: e,
				tabbableNodes: t,
				focusableNodes: n$1,
				posTabIndexesFound: i,
				firstTabbableNode: o,
				lastTabbableNode: s$1,
				firstDomTabbableNode: a,
				lastDomTabbableNode: r,
				nextTabbableNode: l$1
			};
		}), this.state.tabbableGroups = this.state.containerGroups.filter((e) => e.tabbableNodes.length > 0), this.state.tabbableGroups.length <= 0 && !this.getNodeForOption("fallbackFocus")) throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times");
		if (this.state.containerGroups.find((e) => e.posTabIndexesFound) && this.state.containerGroups.length > 1) throw new Error("At least one node with a positive tabindex was found in one of your focus-trap's multiple containers. Positive tabindexes are only supported in single-container focus-traps.");
	}
	addListeners() {
		if (this.state.active) return nn.activateTrap(this.trapStack, this), this.state.delayInitialFocusTimer = this.config.delayInitialFocus ? on(() => {
			this.tryFocus(this.getInitialFocusNode());
		}) : this.tryFocus(this.getInitialFocusNode()), this.listenerCleanups.push(_(this.doc, "focusin", this.handleFocus, !0), _(this.doc, "mousedown", this.handlePointerDown, {
			capture: !0,
			passive: !1
		}), _(this.doc, "touchstart", this.handlePointerDown, {
			capture: !0,
			passive: !1
		}), _(this.doc, "click", this.handleClick, {
			capture: !0,
			passive: !1
		}), _(this.doc, "keydown", this.handleTabKey, {
			capture: !0,
			passive: !1
		}), _(this.doc, "keydown", this.handleEscapeKey)), this;
	}
	removeListeners() {
		if (this.state.active) return this.listenerCleanups.forEach((e) => e()), this.listenerCleanups = [], this;
	}
	activate(e) {
		if (this.state.active) return this;
		const t = this.getOption(e, "onActivate"), n$1 = this.getOption(e, "onPostActivate"), o = this.getOption(e, "checkCanFocusTrap");
		o || this.updateTabbableNodes(), this.state.active = !0, this.state.paused = !1, this.state.nodeFocusedBeforeActivation = Oe$1(this.doc), t?.();
		const s$1 = () => {
			o && this.updateTabbableNodes(), this.addListeners(), this.updateObservedNodes(), n$1?.();
		};
		return o ? (o(this.state.containers.concat()).then(s$1, s$1), this) : (s$1(), this);
	}
}, we = (e) => e.key === "Tab", Oe$2 = (e, ...t) => typeof e == "function" ? e(...t) : e, Ps$1 = (e) => !e.isComposing && e.key === "Escape", on = (e) => setTimeout(e, 0), Ts$1 = (e) => e.localName === "input" && "select" in e && typeof e.select == "function";
function ws$1(e, t = {}) {
	let n$1;
	const o = K(() => {
		const s$1 = typeof e == "function" ? e() : e;
		if (s$1) {
			n$1 = new Vs(s$1, {
				escapeDeactivates: !1,
				allowOutsideClick: !0,
				preventScroll: !0,
				returnFocusOnDeactivate: !0,
				delayInitialFocus: !1,
				fallbackFocus: s$1,
				...t,
				document: le(s$1)
			});
			try {
				n$1.activate();
			} catch {}
		}
	});
	return function() {
		n$1?.deactivate(), o();
	};
}
var Et$1 = "data-scroll-lock";
function Os$1(e) {
	const t = e.getBoundingClientRect().left;
	return Math.round(t) + e.scrollLeft ? "paddingLeft" : "paddingRight";
}
function sn(e) {
	const n$1 = Gr(e)?.scrollbarGutter;
	return n$1 === "stable" || n$1?.startsWith("stable ") === !0;
}
function Is(e) {
	const t = e ?? document, n$1 = t.defaultView ?? window, { documentElement: o, body: s$1 } = t;
	if (s$1.hasAttribute(Et$1)) return;
	const r = sn(o) || sn(s$1), i = n$1.innerWidth - o.clientWidth;
	s$1.setAttribute(Et$1, "");
	const l$1 = () => us$1(o, "--scrollbar-width", `${i}px`), u = Os$1(o), g = () => {
		const h$1 = { overflow: "hidden" };
		return !r && i > 0 && (h$1[u] = `${i}px`), Ln(s$1, h$1);
	}, C = () => {
		const { scrollX: h$1, scrollY: m, visualViewport: f } = n$1, d = f?.offsetLeft ?? 0, c = f?.offsetTop ?? 0, v$1 = {
			position: "fixed",
			overflow: "hidden",
			top: `${-(m - Math.floor(c))}px`,
			left: `${-(h$1 - Math.floor(d))}px`,
			right: "0"
		};
		!r && i > 0 && (v$1[u] = `${i}px`);
		const y = Ln(s$1, v$1);
		return () => {
			y?.(), n$1.scrollTo({
				left: h$1,
				top: m,
				behavior: "instant"
			});
		};
	}, b = [l$1(), Xr$1() ? C() : g()];
	return () => {
		b.forEach((h$1) => h$1?.()), s$1.removeAttribute(Et$1);
	};
}
var le$1 = ne("dialog").parts("trigger", "backdrop", "positioner", "content", "title", "description", "closeTrigger").build(), Tn = (e) => e.ids?.positioner ?? `dialog:${e.id}:positioner`, wn = (e) => e.ids?.backdrop ?? `dialog:${e.id}:backdrop`, Ot = (e) => e.ids?.content ?? `dialog:${e.id}:content`, On = (e) => e.ids?.trigger ?? `dialog:${e.id}:trigger`, It$1 = (e) => e.ids?.title ?? `dialog:${e.id}:title`, kt$1 = (e) => e.ids?.description ?? `dialog:${e.id}:description`, In = (e) => e.ids?.closeTrigger ?? `dialog:${e.id}:close`, He = (e) => e.getById(Ot(e)), Ss$1 = (e) => e.getById(Tn(e)), Bs = (e) => e.getById(wn(e)), Rs = (e) => e.getById(On(e)), Ds = (e) => e.getById(It$1(e)), Ls = (e) => e.getById(kt$1(e)), Fs = (e) => e.getById(In(e));
function As$1(e, t) {
	const { state: n$1, send: o, context: s$1, prop: a, scope: r } = e, i = a("aria-label"), l$1 = n$1.matches("open");
	return {
		open: l$1,
		setOpen(u) {
			n$1.matches("open") !== u && o({ type: u ? "OPEN" : "CLOSE" });
		},
		getTriggerProps() {
			return t.button({
				...le$1.trigger.attrs,
				dir: a("dir"),
				id: On(r),
				"aria-haspopup": "dialog",
				type: "button",
				"aria-expanded": l$1,
				"data-state": l$1 ? "open" : "closed",
				"aria-controls": Ot(r),
				onClick(u) {
					u.defaultPrevented || o({ type: "TOGGLE" });
				}
			});
		},
		getBackdropProps() {
			return t.element({
				...le$1.backdrop.attrs,
				dir: a("dir"),
				hidden: !l$1,
				id: wn(r),
				"data-state": l$1 ? "open" : "closed"
			});
		},
		getPositionerProps() {
			return t.element({
				...le$1.positioner.attrs,
				dir: a("dir"),
				id: Tn(r),
				style: { pointerEvents: l$1 ? void 0 : "none" }
			});
		},
		getContentProps() {
			const u = s$1.get("rendered");
			return t.element({
				...le$1.content.attrs,
				dir: a("dir"),
				role: a("role"),
				hidden: !l$1,
				id: Ot(r),
				tabIndex: -1,
				"data-state": l$1 ? "open" : "closed",
				"aria-modal": !0,
				"aria-label": i || void 0,
				"aria-labelledby": i || !u.title ? void 0 : It$1(r),
				"aria-describedby": u.description ? kt$1(r) : void 0
			});
		},
		getTitleProps() {
			return t.element({
				...le$1.title.attrs,
				dir: a("dir"),
				id: It$1(r)
			});
		},
		getDescriptionProps() {
			return t.element({
				...le$1.description.attrs,
				dir: a("dir"),
				id: kt$1(r)
			});
		},
		getCloseTriggerProps() {
			return t.button({
				...le$1.closeTrigger.attrs,
				dir: a("dir"),
				id: In(r),
				type: "button",
				onClick(u) {
					u.defaultPrevented || (u.stopPropagation(), o({ type: "CLOSE" }));
				}
			});
		}
	};
}
var $s = ps$1({
	props({ props: e, scope: t }) {
		const n$1 = e.role === "alertdialog", o = n$1 ? () => Fs(t) : void 0, s$1 = typeof e.modal == "boolean" ? e.modal : !0;
		return {
			role: "dialog",
			modal: s$1,
			trapFocus: s$1,
			preventScroll: s$1,
			closeOnInteractOutside: !n$1,
			closeOnEscape: !0,
			restoreFocus: !0,
			initialFocusEl: o,
			...e
		};
	},
	initialState({ prop: e }) {
		return e("open") || e("defaultOpen") ? "open" : "closed";
	},
	context({ bindable: e }) {
		return { rendered: e(() => ({ defaultValue: {
			title: !0,
			description: !0
		} })) };
	},
	watch({ track: e, action: t, prop: n$1 }) {
		e([() => n$1("open")], () => {
			t(["toggleVisibility"]);
		});
	},
	states: {
		open: {
			entry: ["checkRenderedElements", "syncZIndex"],
			effects: [
				"trackDismissableElement",
				"trapFocus",
				"preventScroll",
				"hideContentBelow"
			],
			on: {
				"CONTROLLED.CLOSE": { target: "closed" },
				CLOSE: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				TOGGLE: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}]
			}
		},
		closed: { on: {
			"CONTROLLED.OPEN": { target: "open" },
			OPEN: [{
				guard: "isOpenControlled",
				actions: ["invokeOnOpen"]
			}, {
				target: "open",
				actions: ["invokeOnOpen"]
			}],
			TOGGLE: [{
				guard: "isOpenControlled",
				actions: ["invokeOnOpen"]
			}, {
				target: "open",
				actions: ["invokeOnOpen"]
			}]
		} }
	},
	implementations: {
		guards: { isOpenControlled: ({ prop: e }) => e("open") != null },
		effects: {
			trackDismissableElement({ scope: e, send: t, prop: n$1 }) {
				return Yo$1(() => He(e), {
					type: "dialog",
					defer: !0,
					pointerBlocking: n$1("modal"),
					exclude: [Rs(e)],
					onInteractOutside(s$1) {
						n$1("onInteractOutside")?.(s$1), n$1("closeOnInteractOutside") || s$1.preventDefault();
					},
					persistentElements: n$1("persistentElements"),
					onFocusOutside: n$1("onFocusOutside"),
					onPointerDownOutside: n$1("onPointerDownOutside"),
					onRequestDismiss: n$1("onRequestDismiss"),
					onEscapeKeyDown(s$1) {
						n$1("onEscapeKeyDown")?.(s$1), n$1("closeOnEscape") || s$1.preventDefault();
					},
					onDismiss() {
						t({
							type: "CLOSE",
							src: "interact-outside"
						});
					}
				});
			},
			preventScroll({ scope: e, prop: t }) {
				if (t("preventScroll")) return Is(e.getDoc());
			},
			trapFocus({ scope: e, prop: t }) {
				return t("trapFocus") ? ws$1(() => He(e), {
					preventScroll: !0,
					returnFocusOnDeactivate: !!t("restoreFocus"),
					initialFocus: t("initialFocusEl"),
					setReturnFocus: (o) => t("finalFocusEl")?.() ?? o,
					getShadowRoot: !0
				}) : void 0;
			},
			hideContentBelow({ scope: e, prop: t }) {
				return t("modal") ? Es(() => [He(e)], { defer: !0 }) : void 0;
			}
		},
		actions: {
			checkRenderedElements({ context: e, scope: t }) {
				K(() => {
					e.set("rendered", {
						title: !!Ds(t),
						description: !!Ls(t)
					});
				});
			},
			syncZIndex({ scope: e }) {
				K(() => {
					const t = He(e);
					if (!t) return;
					const n$1 = Gr(t);
					[Ss$1(e), Bs(e)].forEach((s$1) => {
						s$1?.style.setProperty("--z-index", n$1.zIndex), s$1?.style.setProperty("--layer-index", n$1.getPropertyValue("--layer-index"));
					});
				});
			},
			invokeOnClose({ prop: e }) {
				e("onOpenChange")?.({ open: !1 });
			},
			invokeOnOpen({ prop: e }) {
				e("onOpenChange")?.({ open: !0 });
			},
			toggleVisibility({ prop: e, send: t, event: n$1 }) {
				t({
					type: e("open") ? "CONTROLLED.OPEN" : "CONTROLLED.CLOSE",
					previousEvent: n$1
				});
			}
		}
	}
});
Wn()([
	"aria-label",
	"closeOnEscape",
	"closeOnInteractOutside",
	"dir",
	"finalFocusEl",
	"getRootNode",
	"getRootNode",
	"id",
	"id",
	"ids",
	"initialFocusEl",
	"modal",
	"onEscapeKeyDown",
	"onFocusOutside",
	"onInteractOutside",
	"onOpenChange",
	"onPointerDownOutside",
	"onRequestDismiss",
	"defaultOpen",
	"open",
	"persistentElements",
	"preventScroll",
	"restoreFocus",
	"role",
	"trapFocus"
]);
var Ms$1 = (e = {}, t) => {
	const n$1 = useId(), o = hs$1(ws), s$1 = As(xs$1), r = Jn($s, computed(() => {
		const i = toValue(e);
		return {
			id: n$1,
			dir: s$1.value.dir,
			getRootNode: o?.value.getRootNode,
			...Cs(e),
			onOpenChange: (l$1) => {
				t?.("openChange", l$1), t?.("update:open", l$1.open), i.onOpenChange?.(l$1);
			},
			onEscapeKeyDown: (l$1) => {
				t?.("escapeKeyDown", l$1), i.onEscapeKeyDown?.(l$1);
			},
			onFocusOutside: (l$1) => {
				t?.("focusOutside", l$1), i.onFocusOutside?.(l$1);
			},
			onInteractOutside: (l$1) => {
				t?.("interactOutside", l$1), i.onInteractOutside?.(l$1);
			},
			onPointerDownOutside: (l$1) => {
				t?.("pointerDownOutside", l$1), i.onPointerDownOutside?.(l$1);
			},
			onRequestDismiss: (l$1) => {
				t?.("requestDismiss", l$1), i.onRequestDismiss?.(l$1);
			}
		};
	}));
	return computed(() => As$1(r, ms$1));
}, Ks = /* @__PURE__ */ defineComponent({
	__name: "dialog-root",
	props: /* @__PURE__ */ mergeDefaults({
		"aria-label": {},
		closeOnEscape: { type: Boolean },
		closeOnInteractOutside: { type: Boolean },
		defaultOpen: { type: Boolean },
		finalFocusEl: { type: Function },
		id: {},
		ids: {},
		initialFocusEl: { type: Function },
		modal: { type: Boolean },
		open: { type: Boolean },
		persistentElements: {},
		preventScroll: { type: Boolean },
		restoreFocus: { type: Boolean },
		role: {},
		trapFocus: { type: Boolean },
		lazyMount: { type: Boolean },
		unmountOnExit: { type: Boolean }
	}, {
		closeOnEscape: void 0,
		closeOnInteractOutside: void 0,
		defaultOpen: void 0,
		modal: void 0,
		open: void 0,
		preventScroll: void 0,
		restoreFocus: void 0,
		trapFocus: void 0
	}),
	emits: [
		"escapeKeyDown",
		"focusOutside",
		"interactOutside",
		"openChange",
		"pointerDownOutside",
		"requestDismiss",
		"update:open"
	],
	setup(e, { emit: t }) {
		const n$1 = e;
		return Vn$1(Ms$1(n$1, t)), Ns(computed(() => ({
			lazyMount: n$1.lazyMount,
			unmountOnExit: n$1.unmountOnExit
		}))), vs$1(), (a, r) => renderSlot(a.$slots, "default");
	}
}), Gs = /* @__PURE__ */ defineComponent({
	__name: "dialog-title",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).h2, mergeProps(unref(t).getTitleProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Hs = /* @__PURE__ */ defineComponent({
	__name: "dialog-trigger",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = ie$1();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).button, mergeProps(unref(t).getTriggerProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), br = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
	__proto__: null,
	Backdrop: is$1,
	CloseTrigger: ls$2,
	Content: ds$2,
	Context: cs$2,
	Description: us$2,
	Positioner: hs$2,
	Root: Ks,
	RootProvider: ps$2,
	Title: Gs,
	Trigger: Hs
}, Symbol.toStringTag, { value: "Module" })), [kn, pe] = ce$1("RadioGroupContext"), Ws = /* @__PURE__ */ defineComponent({
	__name: "radio-group-context",
	setup(e) {
		const t = pe();
		return (n$1, o) => renderSlot(n$1.$slots, "default", normalizeProps(guardReactiveProps(unref(t))));
	}
}), js = /* @__PURE__ */ defineComponent({
	__name: "radio-group-indicator",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = pe();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(t).getIndicatorProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), [qs, Us] = ce$1("RadioGroupItemContext"), zs = /* @__PURE__ */ defineComponent({
	__name: "radio-group-item-context",
	setup(e) {
		const t = Us();
		return (n$1, o) => renderSlot(n$1.$slots, "default", normalizeProps(guardReactiveProps(unref(t))));
	}
}), [Xs, Rt$1] = ce$1("RadioGroupItemPropsContext"), Ys = /* @__PURE__ */ defineComponent({
	__name: "radio-group-item-control",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = pe(), n$1 = Rt$1();
		return vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(t).getItemControlProps(unref(n$1)), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Js = /* @__PURE__ */ defineComponent({
	__name: "radio-group-item-hidden-input",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = pe(), n$1 = Rt$1();
		return vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).input, mergeProps(unref(t).getItemHiddenInputProps(unref(n$1)), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Zs = /* @__PURE__ */ defineComponent({
	__name: "radio-group-item-text",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = pe(), n$1 = Rt$1();
		return vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).span, mergeProps(unref(t).getItemTextProps(unref(n$1)), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Qs = /* @__PURE__ */ defineComponent({
	__name: "radio-group-item",
	props: {
		value: {},
		disabled: { type: Boolean },
		invalid: { type: Boolean },
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e, n$1 = pe();
		return Xs(t), qs(computed(() => n$1.value.getItemState(t))), vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).label, mergeProps(unref(n$1).getItemProps(t), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ea$1 = /* @__PURE__ */ defineComponent({
	__name: "radio-group-label",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = pe();
		return vs$1(), (n$1, o) => (openBlock(), createBlock(unref(bs$1).label, mergeProps(unref(t).getLabelProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n$1.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ta$1 = /* @__PURE__ */ defineComponent({
	__name: "radio-group-root-provider",
	props: {
		value: {},
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e, n$1 = computed(() => t.value);
		return kn(n$1), vs$1(), (o, s$1) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(n$1.value.getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
});
var ye = ne("radio-group").parts("root", "label", "item", "itemText", "itemControl", "indicator").build(), Qe$1 = (e) => e.ids?.root ?? `radio-group:${e.id}`, an = (e) => e.ids?.label ?? `radio-group:${e.id}:label`, Sn = (e, t) => e.ids?.item?.(t) ?? `radio-group:${e.id}:radio:${t}`, St$1 = (e, t) => e.ids?.itemHiddenInput?.(t) ?? `radio-group:${e.id}:radio:input:${t}`, oa$1 = (e, t) => e.ids?.itemControl?.(t) ?? `radio-group:${e.id}:radio:control:${t}`, sa$1 = (e, t) => e.ids?.itemLabel?.(t) ?? `radio-group:${e.id}:radio:label:${t}`, Bn = (e) => e.ids?.indicator ?? `radio-group:${e.id}:indicator`, ft$1 = (e) => e.getById(Qe$1(e)), aa$1 = (e, t) => e.getById(St$1(e, t)), ra$1 = (e) => e.getById(Bn(e)), ia$1 = (e) => ft$1(e)?.querySelector("input:not(:disabled)"), la$1 = (e) => ft$1(e)?.querySelector("input:not(:disabled):checked"), rn = (e) => {
	const n$1 = `input[type=radio][data-ownedby='${CSS.escape(Qe$1(e))}']:not([disabled])`;
	return os$1(ft$1(e), n$1);
}, da$1 = (e, t) => {
	if (t) return e.getById(Sn(e, t));
}, ca$1 = (e) => ({
	x: e?.offsetLeft ?? 0,
	y: e?.offsetTop ?? 0,
	width: e?.offsetWidth ?? 0,
	height: e?.offsetHeight ?? 0
});
function ua$1(e, t) {
	const { context: n$1, send: o, computed: s$1, prop: a, scope: r } = e, i = s$1("isDisabled"), l$1 = a("invalid"), u = a("readOnly");
	function g(h$1) {
		return {
			value: h$1.value,
			invalid: !!h$1.invalid || !!l$1,
			disabled: !!h$1.disabled || i,
			checked: n$1.get("value") === h$1.value,
			focused: n$1.get("focusedValue") === h$1.value,
			focusVisible: n$1.get("focusVisibleValue") === h$1.value,
			hovered: n$1.get("hoveredValue") === h$1.value,
			active: n$1.get("activeValue") === h$1.value
		};
	}
	function C(h$1) {
		const m = g(h$1);
		return {
			"data-focus": ko$1(m.focused),
			"data-focus-visible": ko$1(m.focusVisible),
			"data-disabled": ko$1(m.disabled),
			"data-readonly": ko$1(u),
			"data-state": m.checked ? "checked" : "unchecked",
			"data-hover": ko$1(m.hovered),
			"data-invalid": ko$1(m.invalid),
			"data-orientation": a("orientation"),
			"data-ssr": ko$1(n$1.get("ssr"))
		};
	}
	const b = () => {
		(la$1(r) ?? ia$1(r))?.focus();
	};
	return {
		focus: b,
		value: n$1.get("value"),
		setValue(h$1) {
			o({
				type: "SET_VALUE",
				value: h$1,
				isTrusted: !1
			});
		},
		clearValue() {
			o({
				type: "SET_VALUE",
				value: null,
				isTrusted: !1
			});
		},
		getRootProps() {
			return t.element({
				...ye.root.attrs,
				role: "radiogroup",
				id: Qe$1(r),
				"aria-labelledby": an(r),
				"aria-required": a("required") || void 0,
				"aria-disabled": i || void 0,
				"aria-readonly": u || void 0,
				"data-orientation": a("orientation"),
				"data-disabled": ko$1(i),
				"data-invalid": ko$1(l$1),
				"data-required": ko$1(a("required")),
				"aria-orientation": a("orientation"),
				dir: a("dir"),
				style: { position: "relative" }
			});
		},
		getLabelProps() {
			return t.element({
				...ye.label.attrs,
				dir: a("dir"),
				"data-orientation": a("orientation"),
				"data-disabled": ko$1(i),
				"data-invalid": ko$1(l$1),
				"data-required": ko$1(a("required")),
				id: an(r),
				onClick: b
			});
		},
		getItemState: g,
		getItemProps(h$1) {
			const m = g(h$1);
			return t.label({
				...ye.item.attrs,
				dir: a("dir"),
				id: Sn(r, h$1.value),
				htmlFor: St$1(r, h$1.value),
				...C(h$1),
				onPointerMove() {
					m.disabled || m.hovered || o({
						type: "SET_HOVERED",
						value: h$1.value,
						hovered: !0
					});
				},
				onPointerLeave() {
					m.disabled || o({
						type: "SET_HOVERED",
						value: null
					});
				},
				onPointerDown(f) {
					m.disabled || $o(f) && (m.focused && f.pointerType === "mouse" && f.preventDefault(), o({
						type: "SET_ACTIVE",
						value: h$1.value,
						active: !0
					}));
				},
				onPointerUp() {
					m.disabled || o({
						type: "SET_ACTIVE",
						value: null
					});
				},
				onClick() {
					!m.disabled && jo$1() && aa$1(r, h$1.value)?.focus();
				}
			});
		},
		getItemTextProps(h$1) {
			return t.element({
				...ye.itemText.attrs,
				dir: a("dir"),
				id: sa$1(r, h$1.value),
				...C(h$1)
			});
		},
		getItemControlProps(h$1) {
			const m = g(h$1);
			return t.element({
				...ye.itemControl.attrs,
				dir: a("dir"),
				id: oa$1(r, h$1.value),
				"data-active": ko$1(m.active),
				"aria-hidden": !0,
				...C(h$1)
			});
		},
		getItemHiddenInputProps(h$1) {
			const m = g(h$1);
			return t.input({
				"data-ownedby": Qe$1(r),
				id: St$1(r, h$1.value),
				type: "radio",
				name: a("name") || a("id"),
				form: a("form"),
				value: h$1.value,
				required: a("required"),
				"aria-invalid": m.invalid || void 0,
				onClick(f) {
					if (u) {
						f.preventDefault();
						return;
					}
					f.currentTarget.checked && o({
						type: "SET_VALUE",
						value: h$1.value,
						isTrusted: !0
					});
				},
				onBlur() {
					o({
						type: "SET_FOCUSED",
						value: null,
						focused: !1,
						focusVisible: !1
					});
				},
				onFocus() {
					const f = wt$1();
					o({
						type: "SET_FOCUSED",
						value: h$1.value,
						focused: !0,
						focusVisible: f
					});
				},
				onKeyDown(f) {
					f.defaultPrevented || f.key === " " && o({
						type: "SET_ACTIVE",
						value: h$1.value,
						active: !0
					});
				},
				onKeyUp(f) {
					f.defaultPrevented || f.key === " " && o({
						type: "SET_ACTIVE",
						value: null
					});
				},
				disabled: m.disabled || u,
				defaultChecked: m.checked,
				style: ds$1
			});
		},
		getIndicatorProps() {
			const h$1 = n$1.get("indicatorRect"), m = h$1 == null || h$1.width === 0 && h$1.height === 0 && h$1.x === 0 && h$1.y === 0;
			return t.element({
				id: Bn(r),
				...ye.indicator.attrs,
				dir: a("dir"),
				hidden: n$1.get("value") == null || m,
				"data-disabled": ko$1(i),
				"data-orientation": a("orientation"),
				style: {
					"--transition-property": "left, top, width, height",
					"--left": So(h$1?.x),
					"--top": So(h$1?.y),
					"--width": So(h$1?.width),
					"--height": So(h$1?.height),
					position: "absolute",
					willChange: "var(--transition-property)",
					transitionProperty: "var(--transition-property)",
					transitionDuration: "var(--transition-duration, 150ms)",
					transitionTimingFunction: "var(--transition-timing-function)",
					[a("orientation") === "horizontal" ? "left" : "top"]: a("orientation") === "horizontal" ? "var(--left)" : "var(--top)"
				}
			});
		}
	};
}
var { not: ha$1 } = $n(), pa$1 = ps$1({
	props({ props: e }) {
		return {
			orientation: "vertical",
			...e
		};
	},
	initialState() {
		return "idle";
	},
	context({ prop: e, bindable: t }) {
		return {
			value: t(() => ({
				defaultValue: e("defaultValue"),
				value: e("value"),
				onChange(n$1) {
					e("onValueChange")?.({ value: n$1 });
				}
			})),
			activeValue: t(() => ({ defaultValue: null })),
			focusedValue: t(() => ({ defaultValue: null })),
			focusVisibleValue: t(() => ({ defaultValue: null })),
			hoveredValue: t(() => ({ defaultValue: null })),
			indicatorRect: t(() => ({ defaultValue: null })),
			fieldsetDisabled: t(() => ({ defaultValue: !1 })),
			ssr: t(() => ({ defaultValue: !0 }))
		};
	},
	refs() {
		return {
			indicatorCleanup: null,
			focusVisibleValue: null
		};
	},
	computed: { isDisabled: ({ prop: e, context: t }) => !!e("disabled") || t.get("fieldsetDisabled") },
	entry: ["syncIndicatorRect", "syncSsr"],
	exit: ["cleanupObserver"],
	effects: ["trackFormControlState", "trackFocusVisible"],
	watch({ track: e, action: t, context: n$1 }) {
		e([() => n$1.get("value")], () => {
			t(["syncIndicatorRect", "syncInputElements"]);
		});
	},
	on: {
		SET_VALUE: [{
			guard: ha$1("isTrusted"),
			actions: ["setValue", "dispatchChangeEvent"]
		}, { actions: ["setValue"] }],
		SET_HOVERED: { actions: ["setHovered"] },
		SET_ACTIVE: { actions: ["setActive"] },
		SET_FOCUSED: { actions: ["setFocused"] }
	},
	states: { idle: {} },
	implementations: {
		guards: { isTrusted: ({ event: e }) => !!e.isTrusted },
		effects: {
			trackFormControlState({ context: e, scope: t }) {
				return Ho$1(ft$1(t), {
					onFieldsetDisabledChange(n$1) {
						e.set("fieldsetDisabled", n$1);
					},
					onFormReset() {
						e.set("value", e.initial("value"));
					}
				});
			},
			trackFocusVisible({ scope: e }) {
				return ss$1({ root: e.getRootNode?.() });
			}
		},
		actions: {
			setValue({ context: e, event: t }) {
				e.set("value", t.value);
			},
			setHovered({ context: e, event: t }) {
				e.set("hoveredValue", t.value);
			},
			setActive({ context: e, event: t }) {
				e.set("activeValue", t.value);
			},
			setFocused({ context: e, event: t }) {
				e.set("focusedValue", t.value);
				const n$1 = t.value != null && t.focusVisible ? t.value : null;
				e.set("focusVisibleValue", n$1);
			},
			syncInputElements({ context: e, scope: t }) {
				rn(t).forEach((o) => {
					o.checked = o.value === e.get("value");
				});
			},
			cleanupObserver({ refs: e }) {
				e.get("indicatorCleanup")?.();
			},
			syncSsr({ context: e }) {
				e.set("ssr", !1);
			},
			syncIndicatorRect({ context: e, scope: t, refs: n$1 }) {
				if (n$1.get("indicatorCleanup")?.(), !ra$1(t)) return;
				const o = e.get("value"), s$1 = da$1(t, o);
				if (o == null || !s$1) {
					e.set("indicatorRect", null);
					return;
				}
				const a = () => {
					e.set("indicatorRect", ca$1(s$1));
				};
				a();
				const r = as$1.observe(s$1, a);
				n$1.set("indicatorCleanup", r);
			},
			dispatchChangeEvent({ context: e, scope: t }) {
				rn(t).forEach((o) => {
					const s$1 = o.value === e.get("value");
					s$1 !== o.checked && qo$1(o, { checked: s$1 });
				});
			}
		}
	}
});
Wn()([
	"dir",
	"disabled",
	"form",
	"getRootNode",
	"id",
	"ids",
	"invalid",
	"name",
	"onValueChange",
	"orientation",
	"readOnly",
	"required",
	"value",
	"defaultValue"
]);
Wn()([
	"value",
	"disabled",
	"invalid"
]);
var fa$1 = (e = {}, t) => {
	const n$1 = useId(), o = hs$1(ws), s$1 = As(xs$1), a = rs$1(), i = Jn(pa$1, computed(() => {
		const l$1 = toValue(e), u = a?.value;
		return {
			id: n$1,
			ids: { label: u?.ids?.legend },
			disabled: as$2(u?.disabled),
			invalid: u?.invalid,
			dir: s$1.value.dir,
			value: l$1.modelValue,
			getRootNode: o?.value.getRootNode,
			...Cs(l$1),
			onValueChange: (g) => {
				t?.("valueChange", g), t?.("update:modelValue", g.value), l$1.onValueChange?.(g);
			}
		};
	}));
	return computed(() => ua$1(i, ms$1));
}, ga$1 = /* @__PURE__ */ defineComponent({
	__name: "radio-group-root",
	props: /* @__PURE__ */ mergeDefaults({
		defaultValue: {},
		disabled: { type: Boolean },
		form: {},
		id: {},
		ids: {},
		invalid: { type: Boolean },
		modelValue: {},
		name: {},
		orientation: {},
		readOnly: { type: Boolean },
		required: { type: Boolean },
		asChild: { type: Boolean }
	}, {
		disabled: void 0,
		invalid: void 0,
		readOnly: void 0,
		required: void 0
	}),
	emits: ["valueChange", "update:modelValue"],
	setup(e, { emit: t }) {
		const s$1 = fa$1(e, t);
		return kn(s$1), vs$1(), (a, r) => (openBlock(), createBlock(unref(bs$1).div, mergeProps(unref(s$1).getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(a.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Cr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
	__proto__: null,
	Context: Ws,
	Indicator: js,
	Item: Qs,
	ItemContext: zs,
	ItemControl: Ys,
	ItemHiddenInput: Js,
	ItemText: Zs,
	Label: ea$1,
	Root: ga$1,
	RootProvider: ta$1
}, Symbol.toStringTag, { value: "Module" }));
var va$1 = Object.defineProperty, ma = (e, t, n$1) => t in e ? va$1(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n$1
}) : e[t] = n$1, E = (e, t, n$1) => ma(e, typeof t != "symbol" ? t + "" : t, n$1);
function Rn(e, t, n$1) {
	for (let o = 0; o < t.length; o++) e = n$1.getChildren(e, t.slice(o + 1))[t[o]];
	return e;
}
function ya(e) {
	const t = ba$1(e), n$1 = [], o = /* @__PURE__ */ new Set();
	for (const s$1 of t) {
		const a = s$1.join();
		o.has(a) || (o.add(a), n$1.push(s$1));
	}
	return n$1;
}
function Dn(e, t) {
	for (let n$1 = 0; n$1 < Math.min(e.length, t.length); n$1++) {
		if (e[n$1] < t[n$1]) return -1;
		if (e[n$1] > t[n$1]) return 1;
	}
	return e.length - t.length;
}
function ba$1(e) {
	return e.sort(Dn);
}
function Ca$1(e, t) {
	let n$1;
	return H$1(e, {
		...t,
		onEnter: (o, s$1) => {
			if (t.predicate(o, s$1)) return n$1 = o, "stop";
		}
	}), n$1;
}
function Ea$1(e, t) {
	const n$1 = [];
	return H$1(e, {
		onEnter: (o, s$1) => {
			t.predicate(o, s$1) && n$1.push(o);
		},
		getChildren: t.getChildren
	}), n$1;
}
function ln(e, t) {
	let n$1;
	return H$1(e, {
		onEnter: (o, s$1) => {
			if (t.predicate(o, s$1)) return n$1 = [...s$1], "stop";
		},
		getChildren: t.getChildren
	}), n$1;
}
function Na$1(e, t) {
	let n$1 = t.initialResult;
	return H$1(e, {
		...t,
		onEnter: (o, s$1) => {
			n$1 = t.nextResult(n$1, o, s$1);
		}
	}), n$1;
}
function xa$1(e, t) {
	return Na$1(e, {
		...t,
		initialResult: [],
		nextResult: (n$1, o, s$1) => (n$1.push(...t.transform(o, s$1)), n$1)
	});
}
function _a$1(e, t) {
	const { predicate: n$1, create: o, getChildren: s$1 } = t, a = (r, i) => {
		const l$1 = s$1(r, i), u = [];
		l$1.forEach((h$1, m) => {
			const d = a(h$1, [...i, m]);
			d && u.push(d);
		});
		const g = i.length === 0, C = n$1(r, i), b = u.length > 0;
		return g || C || b ? o(r, u, i) : null;
	};
	return a(e, []) || o(e, [], []);
}
function Va$1(e, t) {
	const n$1 = [];
	let o = 0;
	const s$1 = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	return H$1(e, {
		getChildren: t.getChildren,
		onEnter: (r, i) => {
			s$1.has(r) || s$1.set(r, o++);
			const l$1 = t.getChildren(r, i);
			l$1.forEach((h$1) => {
				a.has(h$1) || a.set(h$1, r), s$1.has(h$1) || s$1.set(h$1, o++);
			});
			const u = l$1.length > 0 ? l$1.map((h$1) => s$1.get(h$1)) : void 0, g = a.get(r), C = g ? s$1.get(g) : void 0, b = s$1.get(r);
			n$1.push({
				...r,
				_children: u,
				_parent: C,
				_index: b
			});
		}
	}), n$1;
}
function Pa(e, t) {
	return {
		type: "insert",
		index: e,
		nodes: t
	};
}
function Ta(e) {
	return {
		type: "remove",
		indexes: e
	};
}
function Dt$1() {
	return { type: "replace" };
}
function Ln$1(e) {
	return [e.slice(0, -1), e[e.length - 1]];
}
function Fn(e, t, n$1 = /* @__PURE__ */ new Map()) {
	const [o, s$1] = Ln$1(e);
	for (let r = o.length - 1; r >= 0; r--) {
		const i = o.slice(0, r).join();
		n$1.get(i)?.type !== "remove" && n$1.set(i, Dt$1());
	}
	const a = n$1.get(o.join());
	return a?.type === "remove" ? n$1.set(o.join(), {
		type: "removeThenInsert",
		removeIndexes: a.indexes,
		insertIndex: s$1,
		insertNodes: t
	}) : n$1.set(o.join(), Pa(s$1, t)), n$1;
}
function An(e) {
	const t = /* @__PURE__ */ new Map(), n$1 = /* @__PURE__ */ new Map();
	for (const o of e) {
		const s$1 = o.slice(0, -1).join(), a = n$1.get(s$1) ?? [];
		a.push(o[o.length - 1]), n$1.set(s$1, a.sort((r, i) => r - i));
	}
	for (const o of e) for (let s$1 = o.length - 2; s$1 >= 0; s$1--) {
		const a = o.slice(0, s$1).join();
		t.has(a) || t.set(a, Dt$1());
	}
	for (const [o, s$1] of n$1) t.set(o, Ta(s$1));
	return t;
}
function wa$1(e, t) {
	const n$1 = /* @__PURE__ */ new Map(), [o, s$1] = Ln$1(e);
	for (let a = o.length - 1; a >= 0; a--) {
		const r = o.slice(0, a).join();
		n$1.set(r, Dt$1());
	}
	return n$1.set(o.join(), {
		type: "removeThenInsert",
		removeIndexes: [s$1],
		insertIndex: s$1,
		insertNodes: [t]
	}), n$1;
}
function gt$1(e, t, n$1) {
	return Oa(e, {
		...n$1,
		getChildren: (o, s$1) => {
			const a = s$1.join();
			switch (t.get(a)?.type) {
				case "replace":
				case "remove":
				case "removeThenInsert":
				case "insert": return n$1.getChildren(o, s$1);
				default: return [];
			}
		},
		transform: (o, s$1, a) => {
			const r = a.join(), i = t.get(r);
			switch (i?.type) {
				case "remove": return n$1.create(o, s$1.filter((g, C) => !i.indexes.includes(C)), a);
				case "removeThenInsert":
					const l$1 = s$1.filter((g, C) => !i.removeIndexes.includes(C)), u = i.removeIndexes.reduce((g, C) => C < g ? g - 1 : g, i.insertIndex);
					return n$1.create(o, dn(l$1, u, 0, ...i.insertNodes), a);
				case "insert": return n$1.create(o, dn(s$1, i.index, 0, ...i.nodes), a);
				case "replace": return n$1.create(o, s$1, a);
				default: return o;
			}
		}
	});
}
function dn(e, t, n$1, ...o) {
	return [
		...e.slice(0, t),
		...o,
		...e.slice(t + n$1)
	];
}
function Oa(e, t) {
	const n$1 = {};
	return H$1(e, {
		...t,
		onLeave: (o, s$1) => {
			const a = [0, ...s$1], r = a.join(), i = t.transform(o, n$1[r] ?? [], s$1), l$1 = a.slice(0, -1).join(), u = n$1[l$1] ?? [];
			u.push(i), n$1[l$1] = u;
		}
	}), n$1[""][0];
}
function Ia(e, t) {
	const { nodes: n$1, at: o } = t;
	if (o.length === 0) throw new Error("Can't insert nodes at the root");
	return gt$1(e, Fn(o, n$1), t);
}
function ka$1(e, t) {
	if (t.at.length === 0) return t.node;
	return gt$1(e, wa$1(t.at, t.node), t);
}
function Sa$1(e, t) {
	if (t.indexPaths.length === 0) return e;
	for (const o of t.indexPaths) if (o.length === 0) throw new Error("Can't remove the root node");
	return gt$1(e, An(t.indexPaths), t);
}
function Ba$1(e, t) {
	if (t.indexPaths.length === 0) return e;
	for (const a of t.indexPaths) if (a.length === 0) throw new Error("Can't move the root node");
	if (t.to.length === 0) throw new Error("Can't move nodes to the root");
	const n$1 = ya(t.indexPaths), o = n$1.map((a) => Rn(e, a, t));
	return gt$1(e, Fn(t.to, o, An(n$1)), t);
}
function H$1(e, t) {
	const { onEnter: n$1, onLeave: o, getChildren: s$1 } = t;
	let a = [], r = [{ node: e }];
	const i = t.reuseIndexPath ? () => a : () => a.slice();
	for (; r.length > 0;) {
		let l$1 = r[r.length - 1];
		if (l$1.state === void 0) {
			const g = n$1?.(l$1.node, i());
			if (g === "stop") return;
			l$1.state = g === "skip" ? -1 : 0;
		}
		const u = l$1.children || s$1(l$1.node, i());
		if (l$1.children || (l$1.children = u), l$1.state !== -1) {
			if (l$1.state < u.length) {
				let C = l$1.state;
				a.push(C), r.push({ node: u[C] }), l$1.state = C + 1;
				continue;
			}
			if (o?.(l$1.node, i()) === "stop") return;
		}
		a.pop(), r.pop();
	}
}
var Lt$1 = class $n$1 {
	constructor(t) {
		this.options = t, E(this, "rootNode"), E(this, "isEqual", (n$1) => Te$1(this.rootNode, n$1.rootNode)), E(this, "getNodeChildren", (n$1) => this.options.nodeToChildren?.(n$1) ?? be.nodeToChildren(n$1) ?? []), E(this, "resolveIndexPath", (n$1) => typeof n$1 == "string" ? this.getIndexPath(n$1) : n$1), E(this, "resolveNode", (n$1) => {
			const o = this.resolveIndexPath(n$1);
			return o ? this.at(o) : void 0;
		}), E(this, "getNodeChildrenCount", (n$1) => this.options.nodeToChildrenCount?.(n$1) ?? be.nodeToChildrenCount(n$1)), E(this, "getNodeValue", (n$1) => this.options.nodeToValue?.(n$1) ?? be.nodeToValue(n$1)), E(this, "getNodeDisabled", (n$1) => this.options.isNodeDisabled?.(n$1) ?? be.isNodeDisabled(n$1)), E(this, "stringify", (n$1) => {
			const o = this.findNode(n$1);
			return o ? this.stringifyNode(o) : null;
		}), E(this, "stringifyNode", (n$1) => this.options.nodeToString?.(n$1) ?? be.nodeToString(n$1)), E(this, "getFirstNode", (n$1 = this.rootNode) => {
			let o;
			return H$1(n$1, {
				getChildren: this.getNodeChildren,
				onEnter: (s$1, a) => {
					if (!o && a.length > 0 && !this.getNodeDisabled(s$1)) return o = s$1, "stop";
				}
			}), o;
		}), E(this, "getLastNode", (n$1 = this.rootNode, o = {}) => {
			let s$1;
			return H$1(n$1, {
				getChildren: this.getNodeChildren,
				onEnter: (a, r) => {
					if (!this.isSameNode(a, n$1)) {
						if (o.skip?.({
							value: this.getNodeValue(a),
							node: a,
							indexPath: r
						})) return "skip";
						r.length > 0 && !this.getNodeDisabled(a) && (s$1 = a);
					}
				}
			}), s$1;
		}), E(this, "at", (n$1) => Rn(this.rootNode, n$1, { getChildren: this.getNodeChildren })), E(this, "findNode", (n$1, o = this.rootNode) => Ca$1(o, {
			getChildren: this.getNodeChildren,
			predicate: (s$1) => this.getNodeValue(s$1) === n$1
		})), E(this, "findNodes", (n$1, o = this.rootNode) => {
			const s$1 = new Set(n$1.filter((a) => a != null));
			return Ea$1(o, {
				getChildren: this.getNodeChildren,
				predicate: (a) => s$1.has(this.getNodeValue(a))
			});
		}), E(this, "sort", (n$1) => n$1.reduce((o, s$1) => {
			const a = this.getIndexPath(s$1);
			return a && o.push({
				value: s$1,
				indexPath: a
			}), o;
		}, []).sort((o, s$1) => Dn(o.indexPath, s$1.indexPath)).map(({ value: o }) => o)), E(this, "getIndexPath", (n$1) => ln(this.rootNode, {
			getChildren: this.getNodeChildren,
			predicate: (o) => this.getNodeValue(o) === n$1
		})), E(this, "getValue", (n$1) => {
			const o = this.at(n$1);
			return o ? this.getNodeValue(o) : void 0;
		}), E(this, "getValuePath", (n$1) => {
			if (!n$1) return [];
			const o = [];
			let s$1 = [...n$1];
			for (; s$1.length > 0;) {
				const a = this.at(s$1);
				a && o.unshift(this.getNodeValue(a)), s$1.pop();
			}
			return o;
		}), E(this, "getDepth", (n$1) => ln(this.rootNode, {
			getChildren: this.getNodeChildren,
			predicate: (s$1) => this.getNodeValue(s$1) === n$1
		})?.length ?? 0), E(this, "isSameNode", (n$1, o) => this.getNodeValue(n$1) === this.getNodeValue(o)), E(this, "isRootNode", (n$1) => this.isSameNode(n$1, this.rootNode)), E(this, "contains", (n$1, o) => !n$1 || !o ? !1 : o.slice(0, n$1.length).every((s$1, a) => n$1[a] === o[a])), E(this, "getNextNode", (n$1, o = {}) => {
			let s$1 = !1, a;
			return H$1(this.rootNode, {
				getChildren: this.getNodeChildren,
				onEnter: (r, i) => {
					if (this.isRootNode(r)) return;
					const l$1 = this.getNodeValue(r);
					if (o.skip?.({
						value: l$1,
						node: r,
						indexPath: i
					})) return l$1 === n$1 && (s$1 = !0), "skip";
					if (s$1 && !this.getNodeDisabled(r)) return a = r, "stop";
					l$1 === n$1 && (s$1 = !0);
				}
			}), a;
		}), E(this, "getPreviousNode", (n$1, o = {}) => {
			let s$1, a = !1;
			return H$1(this.rootNode, {
				getChildren: this.getNodeChildren,
				onEnter: (r, i) => {
					if (this.isRootNode(r)) return;
					const l$1 = this.getNodeValue(r);
					if (o.skip?.({
						value: l$1,
						node: r,
						indexPath: i
					})) return "skip";
					if (l$1 === n$1) return a = !0, "stop";
					this.getNodeDisabled(r) || (s$1 = r);
				}
			}), a ? s$1 : void 0;
		}), E(this, "getParentNodes", (n$1) => {
			const o = this.resolveIndexPath(n$1)?.slice();
			if (!o) return [];
			const s$1 = [];
			for (; o.length > 0;) {
				o.pop();
				const a = this.at(o);
				a && !this.isRootNode(a) && s$1.unshift(a);
			}
			return s$1;
		}), E(this, "getDescendantNodes", (n$1, o) => {
			const s$1 = this.resolveNode(n$1);
			if (!s$1) return [];
			const a = [];
			return H$1(s$1, {
				getChildren: this.getNodeChildren,
				onEnter: (r, i) => {
					i.length !== 0 && (!o?.withBranch && this.isBranchNode(r) || a.push(r));
				}
			}), a;
		}), E(this, "getDescendantValues", (n$1, o) => this.getDescendantNodes(n$1, o).map((a) => this.getNodeValue(a))), E(this, "getParentIndexPath", (n$1) => n$1.slice(0, -1)), E(this, "getParentNode", (n$1) => {
			const o = this.resolveIndexPath(n$1);
			return o ? this.at(this.getParentIndexPath(o)) : void 0;
		}), E(this, "visit", (n$1) => {
			const { skip: o, ...s$1 } = n$1;
			H$1(this.rootNode, {
				...s$1,
				getChildren: this.getNodeChildren,
				onEnter: (a, r) => {
					if (!this.isRootNode(a)) return o?.({
						value: this.getNodeValue(a),
						node: a,
						indexPath: r
					}) ? "skip" : s$1.onEnter?.(a, r);
				}
			});
		}), E(this, "getPreviousSibling", (n$1) => {
			const o = this.getParentNode(n$1);
			if (!o) return;
			const s$1 = this.getNodeChildren(o);
			let a = n$1[n$1.length - 1];
			for (; --a >= 0;) {
				const r = s$1[a];
				if (!this.getNodeDisabled(r)) return r;
			}
		}), E(this, "getNextSibling", (n$1) => {
			const o = this.getParentNode(n$1);
			if (!o) return;
			const s$1 = this.getNodeChildren(o);
			let a = n$1[n$1.length - 1];
			for (; ++a < s$1.length;) {
				const r = s$1[a];
				if (!this.getNodeDisabled(r)) return r;
			}
		}), E(this, "getSiblingNodes", (n$1) => {
			const o = this.getParentNode(n$1);
			return o ? this.getNodeChildren(o) : [];
		}), E(this, "getValues", (n$1 = this.rootNode) => xa$1(n$1, {
			getChildren: this.getNodeChildren,
			transform: (s$1) => [this.getNodeValue(s$1)]
		}).slice(1)), E(this, "isValidDepth", (n$1, o) => o == null ? !0 : typeof o == "function" ? o(n$1.length) : n$1.length === o), E(this, "isBranchNode", (n$1) => this.getNodeChildren(n$1).length > 0 || this.getNodeChildrenCount(n$1) != null), E(this, "getBranchValues", (n$1 = this.rootNode, o = {}) => {
			let s$1 = [];
			return H$1(n$1, {
				getChildren: this.getNodeChildren,
				onEnter: (a, r) => {
					if (r.length === 0) return;
					const i = this.getNodeValue(a);
					if (o.skip?.({
						value: i,
						node: a,
						indexPath: r
					})) return "skip";
					this.isBranchNode(a) && this.isValidDepth(r, o.depth) && s$1.push(this.getNodeValue(a));
				}
			}), s$1;
		}), E(this, "flatten", (n$1 = this.rootNode) => Va$1(n$1, { getChildren: this.getNodeChildren })), E(this, "_create", (n$1, o) => this.getNodeChildren(n$1).length > 0 || o.length > 0 ? {
			...n$1,
			children: o
		} : { ...n$1 }), E(this, "_insert", (n$1, o, s$1) => this.copy(Ia(n$1, {
			at: o,
			nodes: s$1,
			getChildren: this.getNodeChildren,
			create: this._create
		}))), E(this, "copy", (n$1) => new $n$1({
			...this.options,
			rootNode: n$1
		})), E(this, "_replace", (n$1, o, s$1) => this.copy(ka$1(n$1, {
			at: o,
			node: s$1,
			getChildren: this.getNodeChildren,
			create: this._create
		}))), E(this, "_move", (n$1, o, s$1) => this.copy(Ba$1(n$1, {
			indexPaths: o,
			to: s$1,
			getChildren: this.getNodeChildren,
			create: this._create
		}))), E(this, "_remove", (n$1, o) => this.copy(Sa$1(n$1, {
			indexPaths: o,
			getChildren: this.getNodeChildren,
			create: this._create
		}))), E(this, "replace", (n$1, o) => this._replace(this.rootNode, n$1, o)), E(this, "remove", (n$1) => this._remove(this.rootNode, n$1)), E(this, "insertBefore", (n$1, o) => this.getParentNode(n$1) ? this._insert(this.rootNode, n$1, o) : void 0), E(this, "insertAfter", (n$1, o) => {
			if (!this.getParentNode(n$1)) return;
			const a = [...n$1.slice(0, -1), n$1[n$1.length - 1] + 1];
			return this._insert(this.rootNode, a, o);
		}), E(this, "move", (n$1, o) => this._move(this.rootNode, n$1, o)), E(this, "filter", (n$1) => {
			const o = _a$1(this.rootNode, {
				predicate: n$1,
				getChildren: this.getNodeChildren,
				create: this._create
			});
			return this.copy(o);
		}), E(this, "toJSON", () => this.getValues(this.rootNode)), this.rootNode = t.rootNode;
	}
}, be = {
	nodeToValue(e) {
		return typeof e == "string" ? e : Eo$1(e) && gr$1(e, "value") ? e.value : "";
	},
	nodeToString(e) {
		return typeof e == "string" ? e : Eo$1(e) && gr$1(e, "label") ? e.label : be.nodeToValue(e);
	},
	isNodeDisabled(e) {
		return Eo$1(e) && gr$1(e, "disabled") ? !!e.disabled : !1;
	},
	nodeToChildren(e) {
		return e.children;
	},
	nodeToChildrenCount(e) {
		if (Eo$1(e) && gr$1(e, "childrenCount")) return e.childrenCount;
	}
}, [Mn, A] = ce$1("TreeViewContext"), [Da$1, z] = ce$1("TreeViewNodePropsContext");
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
var [Ga$1, Ft$1] = ce$1("TreeViewNodeContext");
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean, Boolean, Boolean;
ne("tree-view").parts("branch", "branchContent", "branchControl", "branchIndentGuide", "branchIndicator", "branchText", "branchTrigger", "item", "itemIndicator", "itemText", "label", "nodeCheckbox", "nodeRenameInput", "root", "tree").build();
var Kn = (e) => new Lt$1(e);
Kn.empty = () => new Lt$1({ rootNode: { children: [] } });
var At$1 = (e, t) => e.ids?.node?.(t) ?? `tree:${e.id}:node:${t}`, L = (e, t) => {
	t != null && e.getById(At$1(e, t))?.focus();
}, Gn = (e, t) => `tree:${e.id}:rename-input:${t}`, un = (e, t) => e.getById(Gn(e, t));
function or$1(e, t, n$1) {
	const o = e.getDescendantValues(t);
	return bo$1(o.every((a) => n$1.includes(a)) ? lr$1(n$1, ...o) : ur$1(n$1, ...o));
}
function We$1(e, t) {
	const { context: n$1, prop: o, refs: s$1 } = e;
	if (!o("loadChildren")) {
		n$1.set("expandedValue", (f) => bo$1(ur$1(f, ...t)));
		return;
	}
	const a = n$1.get("loadingStatus"), [r, i] = xo$1(t, (f) => a[f] === "loaded");
	if (r.length > 0 && n$1.set("expandedValue", (f) => bo$1(ur$1(f, ...r))), i.length === 0) return;
	const l$1 = o("collection"), [u, g] = xo$1(i, (f) => {
		const d = l$1.findNode(f);
		return l$1.getNodeChildren(d).length > 0;
	});
	if (u.length > 0 && n$1.set("expandedValue", (f) => bo$1(ur$1(f, ...u))), g.length === 0) return;
	n$1.set("loadingStatus", (f) => ({
		...f,
		...g.reduce((d, c) => ({
			...d,
			[c]: "loading"
		}), {})
	}));
	const C = g.map((f) => {
		const d = l$1.getIndexPath(f);
		return {
			id: f,
			indexPath: d,
			valuePath: l$1.getValuePath(d),
			node: l$1.findNode(f)
		};
	}), b = s$1.get("pendingAborts"), h$1 = o("loadChildren");
	Er$1(h$1, () => "[zag-js/tree-view] `loadChildren` is required for async expansion");
	const m = C.map(({ id: f, indexPath: d, valuePath: c, node: v$1 }) => {
		const y = b.get(f);
		y && (y.abort(), b.delete(f));
		const k = new AbortController();
		return b.set(f, k), h$1({
			valuePath: c,
			indexPath: d,
			node: v$1,
			signal: k.signal
		});
	});
	Promise.allSettled(m).then((f) => {
		const d = [], c = [], v$1 = n$1.get("loadingStatus");
		let y = o("collection");
		f.forEach((k, D$1) => {
			const { id: M$1, indexPath: K$1, node: w, valuePath: J$2 } = C[D$1];
			k.status === "fulfilled" ? (v$1[M$1] = "loaded", d.push(M$1), y = y.replace(K$1, {
				...w,
				children: k.value
			})) : (b.delete(M$1), Reflect.deleteProperty(v$1, M$1), c.push({
				node: w,
				error: k.reason,
				indexPath: K$1,
				valuePath: J$2
			}));
		}), n$1.set("loadingStatus", v$1), d.length && (n$1.set("expandedValue", (k) => bo$1(ur$1(k, ...d))), o("onLoadChildrenComplete")?.({ collection: y })), c.length && o("onLoadChildrenError")?.({ nodes: c });
	});
}
function te$1(e) {
	const { prop: t, context: n$1 } = e;
	return function({ indexPath: s$1 }) {
		return t("collection").getValuePath(s$1).slice(0, -1).some((r) => !n$1.get("expandedValue").includes(r));
	};
}
var { and: X$1 } = $n();
ps$1({
	props({ props: e }) {
		return {
			selectionMode: "single",
			collection: Kn.empty(),
			typeahead: !0,
			expandOnClick: !0,
			defaultExpandedValue: [],
			defaultSelectedValue: [],
			...e
		};
	},
	initialState() {
		return "idle";
	},
	context({ prop: e, bindable: t, getContext: n$1 }) {
		return {
			expandedValue: t(() => ({
				defaultValue: e("defaultExpandedValue"),
				value: e("expandedValue"),
				isEqual: Te$1,
				onChange(o) {
					const a = n$1().get("focusedValue");
					e("onExpandedChange")?.({
						expandedValue: o,
						focusedValue: a,
						get expandedNodes() {
							return e("collection").findNodes(o);
						}
					});
				}
			})),
			selectedValue: t(() => ({
				defaultValue: e("defaultSelectedValue"),
				value: e("selectedValue"),
				isEqual: Te$1,
				onChange(o) {
					const a = n$1().get("focusedValue");
					e("onSelectionChange")?.({
						selectedValue: o,
						focusedValue: a,
						get selectedNodes() {
							return e("collection").findNodes(o);
						}
					});
				}
			})),
			focusedValue: t(() => ({
				defaultValue: e("defaultFocusedValue") || null,
				value: e("focusedValue"),
				onChange(o) {
					e("onFocusChange")?.({
						focusedValue: o,
						get focusedNode() {
							return o ? e("collection").findNode(o) : null;
						}
					});
				}
			})),
			loadingStatus: t(() => ({ defaultValue: {} })),
			checkedValue: t(() => ({
				defaultValue: e("defaultCheckedValue") || [],
				value: e("checkedValue"),
				isEqual: Te$1,
				onChange(o) {
					e("onCheckedChange")?.({ checkedValue: o });
				}
			})),
			renamingValue: t(() => ({
				sync: !0,
				defaultValue: null
			}))
		};
	},
	refs() {
		return {
			typeaheadState: { ...ls$1.defaultOptions },
			pendingAborts: /* @__PURE__ */ new Map()
		};
	},
	computed: {
		isMultipleSelection: ({ prop: e }) => e("selectionMode") === "multiple",
		isTypingAhead: ({ refs: e }) => e.get("typeaheadState").keysSoFar.length > 0,
		visibleNodes: ({ prop: e, context: t }) => {
			const n$1 = [];
			return e("collection").visit({
				skip: te$1({
					prop: e,
					context: t
				}),
				onEnter: (o, s$1) => {
					n$1.push({
						node: o,
						indexPath: s$1
					});
				}
			}), n$1;
		}
	},
	on: {
		"EXPANDED.SET": { actions: ["setExpanded"] },
		"EXPANDED.CLEAR": { actions: ["clearExpanded"] },
		"EXPANDED.ALL": { actions: ["expandAllBranches"] },
		"BRANCH.EXPAND": { actions: ["expandBranches"] },
		"BRANCH.COLLAPSE": { actions: ["collapseBranches"] },
		"SELECTED.SET": { actions: ["setSelected"] },
		"SELECTED.ALL": [{
			guard: X$1("isMultipleSelection", "moveFocus"),
			actions: ["selectAllNodes", "focusTreeLastNode"]
		}, {
			guard: "isMultipleSelection",
			actions: ["selectAllNodes"]
		}],
		"SELECTED.CLEAR": { actions: ["clearSelected"] },
		"NODE.SELECT": { actions: ["selectNode"] },
		"NODE.DESELECT": { actions: ["deselectNode"] },
		"CHECKED.TOGGLE": { actions: ["toggleChecked"] },
		"CHECKED.SET": { actions: ["setChecked"] },
		"CHECKED.CLEAR": { actions: ["clearChecked"] },
		"NODE.FOCUS": { actions: ["setFocusedNode"] },
		"NODE.ARROW_DOWN": [{
			guard: X$1("isShiftKey", "isMultipleSelection"),
			actions: ["focusTreeNextNode", "extendSelectionToNextNode"]
		}, { actions: ["focusTreeNextNode"] }],
		"NODE.ARROW_UP": [{
			guard: X$1("isShiftKey", "isMultipleSelection"),
			actions: ["focusTreePrevNode", "extendSelectionToPrevNode"]
		}, { actions: ["focusTreePrevNode"] }],
		"NODE.ARROW_LEFT": { actions: ["focusBranchNode"] },
		"BRANCH_NODE.ARROW_LEFT": [{
			guard: "isBranchExpanded",
			actions: ["collapseBranch"]
		}, { actions: ["focusBranchNode"] }],
		"BRANCH_NODE.ARROW_RIGHT": [{
			guard: X$1("isBranchFocused", "isBranchExpanded"),
			actions: ["focusBranchFirstNode"]
		}, { actions: ["expandBranch"] }],
		"SIBLINGS.EXPAND": { actions: ["expandSiblingBranches"] },
		"NODE.HOME": [{
			guard: X$1("isShiftKey", "isMultipleSelection"),
			actions: ["extendSelectionToFirstNode", "focusTreeFirstNode"]
		}, { actions: ["focusTreeFirstNode"] }],
		"NODE.END": [{
			guard: X$1("isShiftKey", "isMultipleSelection"),
			actions: ["extendSelectionToLastNode", "focusTreeLastNode"]
		}, { actions: ["focusTreeLastNode"] }],
		"NODE.CLICK": [
			{
				guard: X$1("isCtrlKey", "isMultipleSelection"),
				actions: ["toggleNodeSelection"]
			},
			{
				guard: X$1("isShiftKey", "isMultipleSelection"),
				actions: ["extendSelectionToNode"]
			},
			{ actions: ["selectNode"] }
		],
		"BRANCH_NODE.CLICK": [
			{
				guard: X$1("isCtrlKey", "isMultipleSelection"),
				actions: ["toggleNodeSelection"]
			},
			{
				guard: X$1("isShiftKey", "isMultipleSelection"),
				actions: ["extendSelectionToNode"]
			},
			{
				guard: "expandOnClick",
				actions: ["selectNode", "toggleBranchNode"]
			},
			{ actions: ["selectNode"] }
		],
		"BRANCH_TOGGLE.CLICK": { actions: ["toggleBranchNode"] },
		"TREE.TYPEAHEAD": { actions: ["focusMatchedNode"] }
	},
	exit: ["clearPendingAborts"],
	states: {
		idle: { on: { "NODE.RENAME": {
			target: "renaming",
			actions: ["setRenamingValue"]
		} } },
		renaming: {
			entry: ["syncRenameInput", "focusRenameInput"],
			on: {
				"RENAME.SUBMIT": {
					guard: "isRenameLabelValid",
					target: "idle",
					actions: ["submitRenaming"]
				},
				"RENAME.CANCEL": {
					target: "idle",
					actions: ["cancelRenaming"]
				}
			}
		}
	},
	implementations: {
		guards: {
			isBranchFocused: ({ context: e, event: t }) => e.get("focusedValue") === t.id,
			isBranchExpanded: ({ context: e, event: t }) => e.get("expandedValue").includes(t.id),
			isShiftKey: ({ event: e }) => e.shiftKey,
			isCtrlKey: ({ event: e }) => e.ctrlKey,
			hasSelectedItems: ({ context: e }) => e.get("selectedValue").length > 0,
			isMultipleSelection: ({ prop: e }) => e("selectionMode") === "multiple",
			moveFocus: ({ event: e }) => !!e.moveFocus,
			expandOnClick: ({ prop: e }) => !!e("expandOnClick"),
			isRenameLabelValid: ({ event: e }) => e.label.trim() !== ""
		},
		actions: {
			selectNode({ context: e, event: t }) {
				const n$1 = t.id || t.value;
				e.set("selectedValue", (o) => n$1 == null ? o : !t.isTrusted && pr$1(n$1) ? o.concat(...n$1) : [pr$1(n$1) ? mo$1(n$1) : n$1].filter(Boolean));
			},
			deselectNode({ context: e, event: t }) {
				const n$1 = ar$1(t.id || t.value);
				e.set("selectedValue", (o) => lr$1(o, ...n$1));
			},
			setFocusedNode({ context: e, event: t }) {
				e.set("focusedValue", t.id);
			},
			clearFocusedNode({ context: e }) {
				e.set("focusedValue", null);
			},
			clearSelectedItem({ context: e }) {
				e.set("selectedValue", []);
			},
			toggleBranchNode({ context: e, event: t, action: n$1 }) {
				n$1(e.get("expandedValue").includes(t.id) ? ["collapseBranch"] : ["expandBranch"]);
			},
			expandBranch(e) {
				const { event: t } = e;
				We$1(e, [t.id]);
			},
			expandBranches(e) {
				const { context: t, event: n$1 } = e;
				We$1(e, vo(ar$1(n$1.value), t.get("expandedValue")));
			},
			collapseBranch({ context: e, event: t }) {
				e.set("expandedValue", (n$1) => lr$1(n$1, t.id));
			},
			collapseBranches(e) {
				const { context: t, event: n$1 } = e, o = ar$1(n$1.value);
				t.set("expandedValue", (s$1) => lr$1(s$1, ...o));
			},
			setExpanded({ context: e, event: t }) {
				pr$1(t.value) && e.set("expandedValue", t.value);
			},
			clearExpanded({ context: e }) {
				e.set("expandedValue", []);
			},
			setSelected({ context: e, event: t }) {
				pr$1(t.value) && e.set("selectedValue", t.value);
			},
			clearSelected({ context: e }) {
				e.set("selectedValue", []);
			},
			focusTreeFirstNode(e) {
				const { prop: t, scope: n$1 } = e, o = t("collection"), s$1 = o.getFirstNode(), a = o.getNodeValue(s$1);
				de$1(e, a) ? K(() => L(n$1, a)) : L(n$1, a);
			},
			focusTreeLastNode(e) {
				const { prop: t, scope: n$1 } = e, o = t("collection"), s$1 = o.getLastNode(void 0, { skip: te$1(e) }), a = o.getNodeValue(s$1);
				de$1(e, a) ? K(() => L(n$1, a)) : L(n$1, a);
			},
			focusBranchFirstNode(e) {
				const { event: t, prop: n$1, scope: o } = e, s$1 = n$1("collection"), a = s$1.findNode(t.id), r = s$1.getFirstNode(a), i = s$1.getNodeValue(r);
				de$1(e, i) ? K(() => L(o, i)) : L(o, i);
			},
			focusTreeNextNode(e) {
				const { event: t, prop: n$1, scope: o } = e, s$1 = n$1("collection"), a = s$1.getNextNode(t.id, { skip: te$1(e) });
				if (!a) return;
				const r = s$1.getNodeValue(a);
				de$1(e, r) ? K(() => L(o, r)) : L(o, r);
			},
			focusTreePrevNode(e) {
				const { event: t, prop: n$1, scope: o } = e, s$1 = n$1("collection"), a = s$1.getPreviousNode(t.id, { skip: te$1(e) });
				if (!a) return;
				const r = s$1.getNodeValue(a);
				de$1(e, r) ? K(() => L(o, r)) : L(o, r);
			},
			focusBranchNode(e) {
				const { event: t, prop: n$1, scope: o } = e, s$1 = n$1("collection"), a = s$1.getParentNode(t.id), r = a ? s$1.getNodeValue(a) : void 0;
				if (!r) return;
				de$1(e, r) ? K(() => L(o, r)) : L(o, r);
			},
			selectAllNodes({ context: e, prop: t }) {
				e.set("selectedValue", t("collection").getValues());
			},
			focusMatchedNode(e) {
				const { context: t, prop: n$1, refs: o, event: s$1, scope: a, computed: r } = e, u = ls$1(r("visibleNodes").map(({ node: C }) => ({
					textContent: n$1("collection").stringifyNode(C),
					id: n$1("collection").getNodeValue(C)
				})), {
					state: o.get("typeaheadState"),
					activeId: t.get("focusedValue"),
					key: s$1.key
				});
				if (!u?.id) return;
				de$1(e, u.id) ? K(() => L(a, u.id)) : L(a, u.id);
			},
			toggleNodeSelection({ context: e, event: t }) {
				const n$1 = yo$1(e.get("selectedValue"), t.id);
				e.set("selectedValue", n$1);
			},
			expandAllBranches(e) {
				const { context: t, prop: n$1 } = e;
				We$1(e, vo(n$1("collection").getBranchValues(), t.get("expandedValue")));
			},
			expandSiblingBranches(e) {
				const { context: t, event: n$1, prop: o } = e, s$1 = o("collection"), a = s$1.getIndexPath(n$1.id);
				if (!a) return;
				We$1(e, vo(s$1.getSiblingNodes(a).map((u) => s$1.getNodeValue(u)), t.get("expandedValue")));
			},
			extendSelectionToNode(e) {
				const { context: t, event: n$1, prop: o, computed: s$1 } = e, a = o("collection"), r = go(t.get("selectedValue")) || a.getNodeValue(a.getFirstNode()), i = n$1.id;
				let l$1 = [r, i], u = 0;
				s$1("visibleNodes").forEach(({ node: C }) => {
					const b = a.getNodeValue(C);
					u === 1 && l$1.push(b), (b === r || b === i) && u++;
				}), t.set("selectedValue", bo$1(l$1));
			},
			extendSelectionToNextNode(e) {
				const { context: t, event: n$1, prop: o } = e, s$1 = o("collection"), a = s$1.getNextNode(n$1.id, { skip: te$1(e) });
				if (!a) return;
				const r = new Set(t.get("selectedValue")), i = s$1.getNodeValue(a);
				i != null && (r.has(n$1.id) && r.has(i) ? r.delete(n$1.id) : r.has(i) || r.add(i), t.set("selectedValue", Array.from(r)));
			},
			extendSelectionToPrevNode(e) {
				const { context: t, event: n$1, prop: o } = e, s$1 = o("collection"), a = s$1.getPreviousNode(n$1.id, { skip: te$1(e) });
				if (!a) return;
				const r = new Set(t.get("selectedValue")), i = s$1.getNodeValue(a);
				i != null && (r.has(n$1.id) && r.has(i) ? r.delete(n$1.id) : r.has(i) || r.add(i), t.set("selectedValue", Array.from(r)));
			},
			extendSelectionToFirstNode(e) {
				const { context: t, prop: n$1 } = e, o = n$1("collection"), s$1 = go(t.get("selectedValue")), a = [];
				o.visit({
					skip: te$1(e),
					onEnter: (r) => {
						const i = o.getNodeValue(r);
						if (a.push(i), i === s$1) return "stop";
					}
				}), t.set("selectedValue", a);
			},
			extendSelectionToLastNode(e) {
				const { context: t, prop: n$1 } = e, o = n$1("collection"), s$1 = go(t.get("selectedValue")), a = [];
				let r = !1;
				o.visit({
					skip: te$1(e),
					onEnter: (i) => {
						const l$1 = o.getNodeValue(i);
						l$1 === s$1 && (r = !0), r && a.push(l$1);
					}
				}), t.set("selectedValue", a);
			},
			clearPendingAborts({ refs: e }) {
				const t = e.get("pendingAborts");
				t.forEach((n$1) => n$1.abort()), t.clear();
			},
			toggleChecked({ context: e, event: t, prop: n$1 }) {
				const o = n$1("collection");
				e.set("checkedValue", (s$1) => t.isBranch ? or$1(o, t.value, s$1) : yo$1(s$1, t.value));
			},
			setChecked({ context: e, event: t }) {
				e.set("checkedValue", t.value);
			},
			clearChecked({ context: e }) {
				e.set("checkedValue", []);
			},
			setRenamingValue({ context: e, event: t, prop: n$1 }) {
				e.set("renamingValue", t.value);
				const o = n$1("onRenameStart");
				if (o) {
					const s$1 = n$1("collection"), a = s$1.getIndexPath(t.value);
					if (a) {
						const r = s$1.at(a);
						r && o({
							value: t.value,
							node: r,
							indexPath: a
						});
					}
				}
			},
			submitRenaming({ context: e, event: t, prop: n$1, scope: o }) {
				const s$1 = e.get("renamingValue");
				if (!s$1) return;
				const r = n$1("collection").getIndexPath(s$1);
				if (!r) return;
				const i = t.label.trim(), l$1 = n$1("onBeforeRename");
				if (l$1 && !l$1({
					value: s$1,
					label: i,
					indexPath: r
				})) {
					e.set("renamingValue", null), L(o, s$1);
					return;
				}
				n$1("onRenameComplete")?.({
					value: s$1,
					label: i,
					indexPath: r
				}), e.set("renamingValue", null), L(o, s$1);
			},
			cancelRenaming({ context: e, scope: t }) {
				const n$1 = e.get("renamingValue");
				e.set("renamingValue", null), n$1 && L(t, n$1);
			},
			syncRenameInput({ context: e, scope: t, prop: n$1 }) {
				const o = e.get("renamingValue");
				if (!o) return;
				const s$1 = n$1("collection"), a = s$1.findNode(o);
				if (!a) return;
				const r = s$1.stringifyNode(a);
				Ko$1(un(t, o), r);
			},
			focusRenameInput({ context: e, scope: t }) {
				const n$1 = e.get("renamingValue");
				if (!n$1) return;
				const o = un(t, n$1);
				o && (o.focus(), o.select());
			}
		}
	}
});
function de$1(e, t) {
	const { prop: n$1, scope: o, computed: s$1 } = e, a = n$1("scrollToIndexFn");
	if (!a) return !1;
	const r = n$1("collection"), i = s$1("visibleNodes");
	for (let l$1 = 0; l$1 < i.length; l$1++) {
		const { node: u, indexPath: g } = i[l$1];
		if (r.getNodeValue(u) === t) return a({
			index: l$1,
			node: u,
			indexPath: g,
			getElement: () => o.getById(At$1(o, t))
		}), !0;
	}
	return !1;
}
Wn()([
	"ids",
	"collection",
	"dir",
	"expandedValue",
	"expandOnClick",
	"defaultFocusedValue",
	"focusedValue",
	"getRootNode",
	"id",
	"onExpandedChange",
	"onFocusChange",
	"onSelectionChange",
	"checkedValue",
	"selectedValue",
	"selectionMode",
	"typeahead",
	"defaultExpandedValue",
	"defaultSelectedValue",
	"defaultCheckedValue",
	"onCheckedChange",
	"onLoadChildrenComplete",
	"onLoadChildrenError",
	"loadChildren",
	"canRename",
	"onRenameStart",
	"onBeforeRename",
	"onRenameComplete",
	"scrollToIndexFn"
]);
Wn()(["node", "indexPath"]);
var LuxonError = class extends Error {};
var InvalidDateTimeError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid DateTime: ${reason.toMessage()}`);
	}
};
var InvalidIntervalError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid Interval: ${reason.toMessage()}`);
	}
};
var InvalidDurationError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid Duration: ${reason.toMessage()}`);
	}
};
var ConflictingSpecificationError = class extends LuxonError {};
var InvalidUnitError = class extends LuxonError {
	constructor(unit) {
		super(`Invalid unit ${unit}`);
	}
};
var InvalidArgumentError = class extends LuxonError {};
var ZoneIsAbstractError = class extends LuxonError {
	constructor() {
		super("Zone is an abstract class");
	}
};
var n = "numeric", s = "short", l = "long";
const DATE_SHORT = {
	year: n,
	month: n,
	day: n
};
const DATE_MED = {
	year: n,
	month: s,
	day: n
};
const DATE_MED_WITH_WEEKDAY = {
	year: n,
	month: s,
	day: n,
	weekday: s
};
const DATE_FULL = {
	year: n,
	month: l,
	day: n
};
const DATE_HUGE = {
	year: n,
	month: l,
	day: n,
	weekday: l
};
const TIME_SIMPLE = {
	hour: n,
	minute: n
};
const TIME_WITH_SECONDS = {
	hour: n,
	minute: n,
	second: n
};
const TIME_WITH_SHORT_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	timeZoneName: s
};
const TIME_WITH_LONG_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	timeZoneName: l
};
const TIME_24_SIMPLE = {
	hour: n,
	minute: n,
	hourCycle: "h23"
};
const TIME_24_WITH_SECONDS = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23"
};
const TIME_24_WITH_SHORT_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23",
	timeZoneName: s
};
const TIME_24_WITH_LONG_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23",
	timeZoneName: l
};
const DATETIME_SHORT = {
	year: n,
	month: n,
	day: n,
	hour: n,
	minute: n
};
const DATETIME_SHORT_WITH_SECONDS = {
	year: n,
	month: n,
	day: n,
	hour: n,
	minute: n,
	second: n
};
const DATETIME_MED = {
	year: n,
	month: s,
	day: n,
	hour: n,
	minute: n
};
const DATETIME_MED_WITH_SECONDS = {
	year: n,
	month: s,
	day: n,
	hour: n,
	minute: n,
	second: n
};
const DATETIME_MED_WITH_WEEKDAY = {
	year: n,
	month: s,
	day: n,
	weekday: s,
	hour: n,
	minute: n
};
const DATETIME_FULL = {
	year: n,
	month: l,
	day: n,
	hour: n,
	minute: n,
	timeZoneName: s
};
const DATETIME_FULL_WITH_SECONDS = {
	year: n,
	month: l,
	day: n,
	hour: n,
	minute: n,
	second: n,
	timeZoneName: s
};
const DATETIME_HUGE = {
	year: n,
	month: l,
	day: n,
	weekday: l,
	hour: n,
	minute: n,
	timeZoneName: l
};
const DATETIME_HUGE_WITH_SECONDS = {
	year: n,
	month: l,
	day: n,
	weekday: l,
	hour: n,
	minute: n,
	second: n,
	timeZoneName: l
};
var Zone = class {
	get type() {
		throw new ZoneIsAbstractError();
	}
	get name() {
		throw new ZoneIsAbstractError();
	}
	get ianaName() {
		return this.name;
	}
	get isUniversal() {
		throw new ZoneIsAbstractError();
	}
	offsetName(ts$3, opts) {
		throw new ZoneIsAbstractError();
	}
	formatOffset(ts$3, format) {
		throw new ZoneIsAbstractError();
	}
	offset(ts$3) {
		throw new ZoneIsAbstractError();
	}
	equals(otherZone) {
		throw new ZoneIsAbstractError();
	}
	get isValid() {
		throw new ZoneIsAbstractError();
	}
};
var singleton$1 = null;
var SystemZone = class SystemZone extends Zone {
	static get instance() {
		if (singleton$1 === null) singleton$1 = new SystemZone();
		return singleton$1;
	}
	get type() {
		return "system";
	}
	get name() {
		return new Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
	get isUniversal() {
		return false;
	}
	offsetName(ts$3, { format, locale }) {
		return parseZoneInfo(ts$3, format, locale);
	}
	formatOffset(ts$3, format) {
		return formatOffset(this.offset(ts$3), format);
	}
	offset(ts$3) {
		return -new Date(ts$3).getTimezoneOffset();
	}
	equals(otherZone) {
		return otherZone.type === "system";
	}
	get isValid() {
		return true;
	}
};
var dtfCache = {};
function makeDTF(zone) {
	if (!dtfCache[zone]) dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
		hour12: false,
		timeZone: zone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		era: "short"
	});
	return dtfCache[zone];
}
var typeToPos = {
	year: 0,
	month: 1,
	day: 2,
	era: 3,
	hour: 4,
	minute: 5,
	second: 6
};
function hackyOffset(dtf, date) {
	const formatted = dtf.format(date).replace(/\u200E/g, ""), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted);
	return [
		fYear,
		fMonth,
		fDay,
		fadOrBc,
		fHour,
		fMinute,
		fSecond
	];
}
function partsOffset(dtf, date) {
	const formatted = dtf.formatToParts(date);
	const filled = [];
	for (let i = 0; i < formatted.length; i++) {
		const { type, value } = formatted[i];
		const pos = typeToPos[type];
		if (type === "era") filled[pos] = value;
		else if (!isUndefined(pos)) filled[pos] = parseInt(value, 10);
	}
	return filled;
}
var ianaZoneCache = {};
var IANAZone = class IANAZone extends Zone {
	static create(name) {
		if (!ianaZoneCache[name]) ianaZoneCache[name] = new IANAZone(name);
		return ianaZoneCache[name];
	}
	static resetCache() {
		ianaZoneCache = {};
		dtfCache = {};
	}
	static isValidSpecifier(s$1) {
		return this.isValidZone(s$1);
	}
	static isValidZone(zone) {
		if (!zone) return false;
		try {
			new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
			return true;
		} catch (e) {
			return false;
		}
	}
	constructor(name) {
		super();
		this.zoneName = name;
		this.valid = IANAZone.isValidZone(name);
	}
	get type() {
		return "iana";
	}
	get name() {
		return this.zoneName;
	}
	get isUniversal() {
		return false;
	}
	offsetName(ts$3, { format, locale }) {
		return parseZoneInfo(ts$3, format, locale, this.name);
	}
	formatOffset(ts$3, format) {
		return formatOffset(this.offset(ts$3), format);
	}
	offset(ts$3) {
		const date = new Date(ts$3);
		if (isNaN(date)) return NaN;
		const dtf = makeDTF(this.name);
		let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date);
		if (adOrBc === "BC") year = -Math.abs(year) + 1;
		const asUTC = objToLocalTS({
			year,
			month,
			day,
			hour: hour === 24 ? 0 : hour,
			minute,
			second,
			millisecond: 0
		});
		let asTS = +date;
		const over = asTS % 1e3;
		asTS -= over >= 0 ? over : 1e3 + over;
		return (asUTC - asTS) / (60 * 1e3);
	}
	equals(otherZone) {
		return otherZone.type === "iana" && otherZone.name === this.name;
	}
	get isValid() {
		return this.valid;
	}
};
var intlLFCache = {};
function getCachedLF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let dtf = intlLFCache[key];
	if (!dtf) {
		dtf = new Intl.ListFormat(locString, opts);
		intlLFCache[key] = dtf;
	}
	return dtf;
}
var intlDTCache = {};
function getCachedDTF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let dtf = intlDTCache[key];
	if (!dtf) {
		dtf = new Intl.DateTimeFormat(locString, opts);
		intlDTCache[key] = dtf;
	}
	return dtf;
}
var intlNumCache = {};
function getCachedINF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let inf = intlNumCache[key];
	if (!inf) {
		inf = new Intl.NumberFormat(locString, opts);
		intlNumCache[key] = inf;
	}
	return inf;
}
var intlRelCache = {};
function getCachedRTF(locString, opts = {}) {
	const { base, ...cacheKeyOpts } = opts;
	const key = JSON.stringify([locString, cacheKeyOpts]);
	let inf = intlRelCache[key];
	if (!inf) {
		inf = new Intl.RelativeTimeFormat(locString, opts);
		intlRelCache[key] = inf;
	}
	return inf;
}
var sysLocaleCache = null;
function systemLocale() {
	if (sysLocaleCache) return sysLocaleCache;
	else {
		sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
		return sysLocaleCache;
	}
}
var weekInfoCache = {};
function getCachedWeekInfo(locString) {
	let data = weekInfoCache[locString];
	if (!data) {
		const locale = new Intl.Locale(locString);
		data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
		weekInfoCache[locString] = data;
	}
	return data;
}
function parseLocaleString(localeStr) {
	const xIndex = localeStr.indexOf("-x-");
	if (xIndex !== -1) localeStr = localeStr.substring(0, xIndex);
	const uIndex = localeStr.indexOf("-u-");
	if (uIndex === -1) return [localeStr];
	else {
		let options;
		let selectedStr;
		try {
			options = getCachedDTF(localeStr).resolvedOptions();
			selectedStr = localeStr;
		} catch (e) {
			const smaller = localeStr.substring(0, uIndex);
			options = getCachedDTF(smaller).resolvedOptions();
			selectedStr = smaller;
		}
		const { numberingSystem, calendar } = options;
		return [
			selectedStr,
			numberingSystem,
			calendar
		];
	}
}
function intlConfigString(localeStr, numberingSystem, outputCalendar) {
	if (outputCalendar || numberingSystem) {
		if (!localeStr.includes("-u-")) localeStr += "-u";
		if (outputCalendar) localeStr += `-ca-${outputCalendar}`;
		if (numberingSystem) localeStr += `-nu-${numberingSystem}`;
		return localeStr;
	} else return localeStr;
}
function mapMonths(f) {
	const ms$3 = [];
	for (let i = 1; i <= 12; i++) {
		const dt$1 = DateTime.utc(2009, i, 1);
		ms$3.push(f(dt$1));
	}
	return ms$3;
}
function mapWeekdays(f) {
	const ms$3 = [];
	for (let i = 1; i <= 7; i++) {
		const dt$1 = DateTime.utc(2016, 11, 13 + i);
		ms$3.push(f(dt$1));
	}
	return ms$3;
}
function listStuff(loc, length, englishFn, intlFn) {
	const mode = loc.listingMode();
	if (mode === "error") return null;
	else if (mode === "en") return englishFn(length);
	else return intlFn(length);
}
function supportsFastNumbers(loc) {
	if (loc.numberingSystem && loc.numberingSystem !== "latn") return false;
	else return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || new Intl.DateTimeFormat(loc.intl).resolvedOptions().numberingSystem === "latn";
}
var PolyNumberFormatter = class {
	constructor(intl, forceSimple, opts) {
		this.padTo = opts.padTo || 0;
		this.floor = opts.floor || false;
		const { padTo, floor, ...otherOpts } = opts;
		if (!forceSimple || Object.keys(otherOpts).length > 0) {
			const intlOpts = {
				useGrouping: false,
				...opts
			};
			if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
			this.inf = getCachedINF(intl, intlOpts);
		}
	}
	format(i) {
		if (this.inf) {
			const fixed = this.floor ? Math.floor(i) : i;
			return this.inf.format(fixed);
		} else return padStart(this.floor ? Math.floor(i) : roundTo(i, 3), this.padTo);
	}
};
var PolyDateFormatter = class {
	constructor(dt$1, intl, opts) {
		this.opts = opts;
		this.originalZone = void 0;
		let z$1 = void 0;
		if (this.opts.timeZone) this.dt = dt$1;
		else if (dt$1.zone.type === "fixed") {
			const gmtOffset = -1 * (dt$1.offset / 60);
			const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
			if (dt$1.offset !== 0 && IANAZone.create(offsetZ).valid) {
				z$1 = offsetZ;
				this.dt = dt$1;
			} else {
				z$1 = "UTC";
				this.dt = dt$1.offset === 0 ? dt$1 : dt$1.setZone("UTC").plus({ minutes: dt$1.offset });
				this.originalZone = dt$1.zone;
			}
		} else if (dt$1.zone.type === "system") this.dt = dt$1;
		else if (dt$1.zone.type === "iana") {
			this.dt = dt$1;
			z$1 = dt$1.zone.name;
		} else {
			z$1 = "UTC";
			this.dt = dt$1.setZone("UTC").plus({ minutes: dt$1.offset });
			this.originalZone = dt$1.zone;
		}
		const intlOpts = { ...this.opts };
		intlOpts.timeZone = intlOpts.timeZone || z$1;
		this.dtf = getCachedDTF(intl, intlOpts);
	}
	format() {
		if (this.originalZone) return this.formatToParts().map(({ value }) => value).join("");
		return this.dtf.format(this.dt.toJSDate());
	}
	formatToParts() {
		const parts = this.dtf.formatToParts(this.dt.toJSDate());
		if (this.originalZone) return parts.map((part) => {
			if (part.type === "timeZoneName") {
				const offsetName = this.originalZone.offsetName(this.dt.ts, {
					locale: this.dt.locale,
					format: this.opts.timeZoneName
				});
				return {
					...part,
					value: offsetName
				};
			} else return part;
		});
		return parts;
	}
	resolvedOptions() {
		return this.dtf.resolvedOptions();
	}
};
var PolyRelFormatter = class {
	constructor(intl, isEnglish, opts) {
		this.opts = {
			style: "long",
			...opts
		};
		if (!isEnglish && hasRelative()) this.rtf = getCachedRTF(intl, opts);
	}
	format(count, unit) {
		if (this.rtf) return this.rtf.format(count, unit);
		else return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
	}
	formatToParts(count, unit) {
		if (this.rtf) return this.rtf.formatToParts(count, unit);
		else return [];
	}
};
var fallbackWeekSettings = {
	firstDay: 1,
	minimalDays: 4,
	weekend: [6, 7]
};
var Locale = class Locale {
	static fromOpts(opts) {
		return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.weekSettings, opts.defaultToEN);
	}
	static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
		const specifiedLocale = locale || Settings.defaultLocale;
		return new Locale(specifiedLocale || (defaultToEN ? "en-US" : systemLocale()), numberingSystem || Settings.defaultNumberingSystem, outputCalendar || Settings.defaultOutputCalendar, validateWeekSettings(weekSettings) || Settings.defaultWeekSettings, specifiedLocale);
	}
	static resetCache() {
		sysLocaleCache = null;
		intlDTCache = {};
		intlNumCache = {};
		intlRelCache = {};
	}
	static fromObject({ locale, numberingSystem, outputCalendar, weekSettings } = {}) {
		return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
	}
	constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
		const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
		this.locale = parsedLocale;
		this.numberingSystem = numbering || parsedNumberingSystem || null;
		this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
		this.weekSettings = weekSettings;
		this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
		this.weekdaysCache = {
			format: {},
			standalone: {}
		};
		this.monthsCache = {
			format: {},
			standalone: {}
		};
		this.meridiemCache = null;
		this.eraCache = {};
		this.specifiedLocale = specifiedLocale;
		this.fastNumbersCached = null;
	}
	get fastNumbers() {
		if (this.fastNumbersCached == null) this.fastNumbersCached = supportsFastNumbers(this);
		return this.fastNumbersCached;
	}
	listingMode() {
		const isActuallyEn = this.isEnglish();
		const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
		return isActuallyEn && hasNoWeirdness ? "en" : "intl";
	}
	clone(alts) {
		if (!alts || Object.getOwnPropertyNames(alts).length === 0) return this;
		else return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, validateWeekSettings(alts.weekSettings) || this.weekSettings, alts.defaultToEN || false);
	}
	redefaultToEN(alts = {}) {
		return this.clone({
			...alts,
			defaultToEN: true
		});
	}
	redefaultToSystem(alts = {}) {
		return this.clone({
			...alts,
			defaultToEN: false
		});
	}
	months(length, format = false) {
		return listStuff(this, length, months, () => {
			const intl = format ? {
				month: length,
				day: "numeric"
			} : { month: length }, formatStr = format ? "format" : "standalone";
			if (!this.monthsCache[formatStr][length]) this.monthsCache[formatStr][length] = mapMonths((dt$1) => this.extract(dt$1, intl, "month"));
			return this.monthsCache[formatStr][length];
		});
	}
	weekdays(length, format = false) {
		return listStuff(this, length, weekdays, () => {
			const intl = format ? {
				weekday: length,
				year: "numeric",
				month: "long",
				day: "numeric"
			} : { weekday: length }, formatStr = format ? "format" : "standalone";
			if (!this.weekdaysCache[formatStr][length]) this.weekdaysCache[formatStr][length] = mapWeekdays((dt$1) => this.extract(dt$1, intl, "weekday"));
			return this.weekdaysCache[formatStr][length];
		});
	}
	meridiems() {
		return listStuff(this, void 0, () => meridiems, () => {
			if (!this.meridiemCache) {
				const intl = {
					hour: "numeric",
					hourCycle: "h12"
				};
				this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map((dt$1) => this.extract(dt$1, intl, "dayperiod"));
			}
			return this.meridiemCache;
		});
	}
	eras(length) {
		return listStuff(this, length, eras, () => {
			const intl = { era: length };
			if (!this.eraCache[length]) this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt$1) => this.extract(dt$1, intl, "era"));
			return this.eraCache[length];
		});
	}
	extract(dt$1, intlOpts, field) {
		const matching = this.dtFormatter(dt$1, intlOpts).formatToParts().find((m) => m.type.toLowerCase() === field);
		return matching ? matching.value : null;
	}
	numberFormatter(opts = {}) {
		return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
	}
	dtFormatter(dt$1, intlOpts = {}) {
		return new PolyDateFormatter(dt$1, this.intl, intlOpts);
	}
	relFormatter(opts = {}) {
		return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
	}
	listFormatter(opts = {}) {
		return getCachedLF(this.intl, opts);
	}
	isEnglish() {
		return this.locale === "en" || this.locale.toLowerCase() === "en-us" || new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us");
	}
	getWeekSettings() {
		if (this.weekSettings) return this.weekSettings;
		else if (!hasLocaleWeekInfo()) return fallbackWeekSettings;
		else return getCachedWeekInfo(this.locale);
	}
	getStartOfWeek() {
		return this.getWeekSettings().firstDay;
	}
	getMinDaysInFirstWeek() {
		return this.getWeekSettings().minimalDays;
	}
	getWeekendDays() {
		return this.getWeekSettings().weekend;
	}
	equals(other) {
		return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
	}
	toString() {
		return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
	}
};
var singleton = null;
var FixedOffsetZone = class FixedOffsetZone extends Zone {
	static get utcInstance() {
		if (singleton === null) singleton = new FixedOffsetZone(0);
		return singleton;
	}
	static instance(offset$1) {
		return offset$1 === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset$1);
	}
	static parseSpecifier(s$1) {
		if (s$1) {
			const r = s$1.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
			if (r) return new FixedOffsetZone(signedOffset(r[1], r[2]));
		}
		return null;
	}
	constructor(offset$1) {
		super();
		this.fixed = offset$1;
	}
	get type() {
		return "fixed";
	}
	get name() {
		return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
	}
	get ianaName() {
		if (this.fixed === 0) return "Etc/UTC";
		else return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
	}
	offsetName() {
		return this.name;
	}
	formatOffset(ts$3, format) {
		return formatOffset(this.fixed, format);
	}
	get isUniversal() {
		return true;
	}
	offset() {
		return this.fixed;
	}
	equals(otherZone) {
		return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
	}
	get isValid() {
		return true;
	}
};
var InvalidZone = class extends Zone {
	constructor(zoneName) {
		super();
		this.zoneName = zoneName;
	}
	get type() {
		return "invalid";
	}
	get name() {
		return this.zoneName;
	}
	get isUniversal() {
		return false;
	}
	offsetName() {
		return null;
	}
	formatOffset() {
		return "";
	}
	offset() {
		return NaN;
	}
	equals() {
		return false;
	}
	get isValid() {
		return false;
	}
};
function normalizeZone(input, defaultZone$1) {
	if (isUndefined(input) || input === null) return defaultZone$1;
	else if (input instanceof Zone) return input;
	else if (isString(input)) {
		const lowered = input.toLowerCase();
		if (lowered === "default") return defaultZone$1;
		else if (lowered === "local" || lowered === "system") return SystemZone.instance;
		else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
		else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
	} else if (isNumber(input)) return FixedOffsetZone.instance(input);
	else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") return input;
	else return new InvalidZone(input);
}
var numberingSystems = {
	arab: "[٠-٩]",
	arabext: "[۰-۹]",
	bali: "[᭐-᭙]",
	beng: "[০-৯]",
	deva: "[०-९]",
	fullwide: "[０-９]",
	gujr: "[૦-૯]",
	hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
	khmr: "[០-៩]",
	knda: "[೦-೯]",
	laoo: "[໐-໙]",
	limb: "[᥆-᥏]",
	mlym: "[൦-൯]",
	mong: "[᠐-᠙]",
	mymr: "[၀-၉]",
	orya: "[୦-୯]",
	tamldec: "[௦-௯]",
	telu: "[౦-౯]",
	thai: "[๐-๙]",
	tibt: "[༠-༩]",
	latn: "\\d"
};
var numberingSystemsUTF16 = {
	arab: [1632, 1641],
	arabext: [1776, 1785],
	bali: [6992, 7001],
	beng: [2534, 2543],
	deva: [2406, 2415],
	fullwide: [65296, 65303],
	gujr: [2790, 2799],
	khmr: [6112, 6121],
	knda: [3302, 3311],
	laoo: [3792, 3801],
	limb: [6470, 6479],
	mlym: [3430, 3439],
	mong: [6160, 6169],
	mymr: [4160, 4169],
	orya: [2918, 2927],
	tamldec: [3046, 3055],
	telu: [3174, 3183],
	thai: [3664, 3673],
	tibt: [3872, 3881]
};
var hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
function parseDigits(str) {
	let value = parseInt(str, 10);
	if (isNaN(value)) {
		value = "";
		for (let i = 0; i < str.length; i++) {
			const code = str.charCodeAt(i);
			if (str[i].search(numberingSystems.hanidec) !== -1) value += hanidecChars.indexOf(str[i]);
			else for (const key in numberingSystemsUTF16) {
				const [min, max] = numberingSystemsUTF16[key];
				if (code >= min && code <= max) value += code - min;
			}
		}
		return parseInt(value, 10);
	} else return value;
}
var digitRegexCache = {};
function resetDigitRegexCache() {
	digitRegexCache = {};
}
function digitRegex({ numberingSystem }, append = "") {
	const ns$3 = numberingSystem || "latn";
	if (!digitRegexCache[ns$3]) digitRegexCache[ns$3] = {};
	if (!digitRegexCache[ns$3][append]) digitRegexCache[ns$3][append] = /* @__PURE__ */ new RegExp(`${numberingSystems[ns$3]}${append}`);
	return digitRegexCache[ns$3][append];
}
var now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
var Settings = class {
	static get now() {
		return now;
	}
	static set now(n$1) {
		now = n$1;
	}
	static set defaultZone(zone) {
		defaultZone = zone;
	}
	static get defaultZone() {
		return normalizeZone(defaultZone, SystemZone.instance);
	}
	static get defaultLocale() {
		return defaultLocale;
	}
	static set defaultLocale(locale) {
		defaultLocale = locale;
	}
	static get defaultNumberingSystem() {
		return defaultNumberingSystem;
	}
	static set defaultNumberingSystem(numberingSystem) {
		defaultNumberingSystem = numberingSystem;
	}
	static get defaultOutputCalendar() {
		return defaultOutputCalendar;
	}
	static set defaultOutputCalendar(outputCalendar) {
		defaultOutputCalendar = outputCalendar;
	}
	static get defaultWeekSettings() {
		return defaultWeekSettings;
	}
	static set defaultWeekSettings(weekSettings) {
		defaultWeekSettings = validateWeekSettings(weekSettings);
	}
	static get twoDigitCutoffYear() {
		return twoDigitCutoffYear;
	}
	static set twoDigitCutoffYear(cutoffYear) {
		twoDigitCutoffYear = cutoffYear % 100;
	}
	static get throwOnInvalid() {
		return throwOnInvalid;
	}
	static set throwOnInvalid(t) {
		throwOnInvalid = t;
	}
	static resetCaches() {
		Locale.resetCache();
		IANAZone.resetCache();
		DateTime.resetCache();
		resetDigitRegexCache();
	}
};
var Invalid = class {
	constructor(reason, explanation) {
		this.reason = reason;
		this.explanation = explanation;
	}
	toMessage() {
		if (this.explanation) return `${this.reason}: ${this.explanation}`;
		else return this.reason;
	}
};
var nonLeapLadder = [
	0,
	31,
	59,
	90,
	120,
	151,
	181,
	212,
	243,
	273,
	304,
	334
], leapLadder = [
	0,
	31,
	60,
	91,
	121,
	152,
	182,
	213,
	244,
	274,
	305,
	335
];
function unitOutOfRange(unit, value) {
	return new Invalid("unit out of range", `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);
}
function dayOfWeek(year, month, day) {
	const d = new Date(Date.UTC(year, month - 1, day));
	if (year < 100 && year >= 0) d.setUTCFullYear(d.getUTCFullYear() - 1900);
	const js$1 = d.getUTCDay();
	return js$1 === 0 ? 7 : js$1;
}
function computeOrdinal(year, month, day) {
	return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
	const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i) => i < ordinal), day = ordinal - table[month0];
	return {
		month: month0 + 1,
		day
	};
}
function isoWeekdayToLocal(isoWeekday, startOfWeek) {
	return (isoWeekday - startOfWeek + 7) % 7 + 1;
}
function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const { year, month, day } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
	let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
	if (weekNumber < 1) {
		weekYear = year - 1;
		weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
	} else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
		weekYear = year + 1;
		weekNumber = 1;
	} else weekYear = year;
	return {
		weekYear,
		weekNumber,
		weekday,
		...timeObject(gregObj)
	};
}
function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const { weekYear, weekNumber, weekday } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
	let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
	if (ordinal < 1) {
		year = weekYear - 1;
		ordinal += daysInYear(year);
	} else if (ordinal > yearInDays) {
		year = weekYear + 1;
		ordinal -= daysInYear(weekYear);
	} else year = weekYear;
	const { month, day } = uncomputeOrdinal(year, ordinal);
	return {
		year,
		month,
		day,
		...timeObject(weekData)
	};
}
function gregorianToOrdinal(gregData) {
	const { year, month, day } = gregData;
	return {
		year,
		ordinal: computeOrdinal(year, month, day),
		...timeObject(gregData)
	};
}
function ordinalToGregorian(ordinalData) {
	const { year, ordinal } = ordinalData;
	const { month, day } = uncomputeOrdinal(year, ordinal);
	return {
		year,
		month,
		day,
		...timeObject(ordinalData)
	};
}
function usesLocalWeekValues(obj, loc) {
	if (!isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear)) {
		if (!isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear)) throw new ConflictingSpecificationError("Cannot mix locale-based week fields with ISO-based week fields");
		if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
		if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
		if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
		delete obj.localWeekday;
		delete obj.localWeekNumber;
		delete obj.localWeekYear;
		return {
			minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
			startOfWeek: loc.getStartOfWeek()
		};
	} else return {
		minDaysInFirstWeek: 4,
		startOfWeek: 1
	};
}
function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)), validWeekday = integerBetween(obj.weekday, 1, 7);
	if (!validYear) return unitOutOfRange("weekYear", obj.weekYear);
	else if (!validWeek) return unitOutOfRange("week", obj.weekNumber);
	else if (!validWeekday) return unitOutOfRange("weekday", obj.weekday);
	else return false;
}
function hasInvalidOrdinalData(obj) {
	const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
	if (!validYear) return unitOutOfRange("year", obj.year);
	else if (!validOrdinal) return unitOutOfRange("ordinal", obj.ordinal);
	else return false;
}
function hasInvalidGregorianData(obj) {
	const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
	if (!validYear) return unitOutOfRange("year", obj.year);
	else if (!validMonth) return unitOutOfRange("month", obj.month);
	else if (!validDay) return unitOutOfRange("day", obj.day);
	else return false;
}
function hasInvalidTimeData(obj) {
	const { hour, minute, second, millisecond } = obj;
	const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
	if (!validHour) return unitOutOfRange("hour", hour);
	else if (!validMinute) return unitOutOfRange("minute", minute);
	else if (!validSecond) return unitOutOfRange("second", second);
	else if (!validMillisecond) return unitOutOfRange("millisecond", millisecond);
	else return false;
}
function isUndefined(o) {
	return typeof o === "undefined";
}
function isNumber(o) {
	return typeof o === "number";
}
function isInteger(o) {
	return typeof o === "number" && o % 1 === 0;
}
function isString(o) {
	return typeof o === "string";
}
function isDate(o) {
	return Object.prototype.toString.call(o) === "[object Date]";
}
function hasRelative() {
	try {
		return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
	} catch (e) {
		return false;
	}
}
function hasLocaleWeekInfo() {
	try {
		return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
	} catch (e) {
		return false;
	}
}
function maybeArray(thing) {
	return Array.isArray(thing) ? thing : [thing];
}
function bestBy(arr, by, compare) {
	if (arr.length === 0) return;
	return arr.reduce((best, next) => {
		const pair = [by(next), next];
		if (!best) return pair;
		else if (compare(best[0], pair[0]) === best[0]) return best;
		else return pair;
	}, null)[1];
}
function pick(obj, keys) {
	return keys.reduce((a, k) => {
		a[k] = obj[k];
		return a;
	}, {});
}
function hasOwnProperty(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}
function validateWeekSettings(settings) {
	if (settings == null) return null;
	else if (typeof settings !== "object") throw new InvalidArgumentError("Week settings must be an object");
	else {
		if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v$1) => !integerBetween(v$1, 1, 7))) throw new InvalidArgumentError("Invalid week settings");
		return {
			firstDay: settings.firstDay,
			minimalDays: settings.minimalDays,
			weekend: Array.from(settings.weekend)
		};
	}
}
function integerBetween(thing, bottom, top) {
	return isInteger(thing) && thing >= bottom && thing <= top;
}
function floorMod(x$1, n$1) {
	return x$1 - n$1 * Math.floor(x$1 / n$1);
}
function padStart(input, n$1 = 2) {
	const isNeg = input < 0;
	let padded;
	if (isNeg) padded = "-" + ("" + -input).padStart(n$1, "0");
	else padded = ("" + input).padStart(n$1, "0");
	return padded;
}
function parseInteger(string) {
	if (isUndefined(string) || string === null || string === "") return;
	else return parseInt(string, 10);
}
function parseFloating(string) {
	if (isUndefined(string) || string === null || string === "") return;
	else return parseFloat(string);
}
function parseMillis(fraction) {
	if (isUndefined(fraction) || fraction === null || fraction === "") return;
	else {
		const f = parseFloat("0." + fraction) * 1e3;
		return Math.floor(f);
	}
}
function roundTo(number, digits, towardZero = false) {
	const factor = 10 ** digits;
	return (towardZero ? Math.trunc : Math.round)(number * factor) / factor;
}
function isLeapYear(year) {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function daysInYear(year) {
	return isLeapYear(year) ? 366 : 365;
}
function daysInMonth(year, month) {
	const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
	if (modMonth === 2) return isLeapYear(modYear) ? 29 : 28;
	else return [
		31,
		null,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	][modMonth - 1];
}
function objToLocalTS(obj) {
	let d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
	if (obj.year < 100 && obj.year >= 0) {
		d = new Date(d);
		d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
	}
	return +d;
}
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
	return -isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek) + minDaysInFirstWeek - 1;
}
function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
	const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
	return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}
function untruncateYear(year) {
	if (year > 99) return year;
	else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
}
function parseZoneInfo(ts$3, offsetFormat, locale, timeZone = null) {
	const date = new Date(ts$3), intlOpts = {
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	};
	if (timeZone) intlOpts.timeZone = timeZone;
	const modified = {
		timeZoneName: offsetFormat,
		...intlOpts
	};
	const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date).find((m) => m.type.toLowerCase() === "timezonename");
	return parsed ? parsed.value : null;
}
function signedOffset(offHourStr, offMinuteStr) {
	let offHour = parseInt(offHourStr, 10);
	if (Number.isNaN(offHour)) offHour = 0;
	const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
	return offHour * 60 + offMinSigned;
}
function asNumber(value) {
	const numericValue = Number(value);
	if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue)) throw new InvalidArgumentError(`Invalid unit value ${value}`);
	return numericValue;
}
function normalizeObject(obj, normalizer) {
	const normalized = {};
	for (const u in obj) if (hasOwnProperty(obj, u)) {
		const v$1 = obj[u];
		if (v$1 === void 0 || v$1 === null) continue;
		normalized[normalizer(u)] = asNumber(v$1);
	}
	return normalized;
}
function formatOffset(offset$1, format) {
	const hours = Math.trunc(Math.abs(offset$1 / 60)), minutes = Math.trunc(Math.abs(offset$1 % 60)), sign = offset$1 >= 0 ? "+" : "-";
	switch (format) {
		case "short": return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
		case "narrow": return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
		case "techie": return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
		default: throw new RangeError(`Value format ${format} is out of range for property format`);
	}
}
function timeObject(obj) {
	return pick(obj, [
		"hour",
		"minute",
		"second",
		"millisecond"
	]);
}
const monthsLong = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
const monthsShort = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
const monthsNarrow = [
	"J",
	"F",
	"M",
	"A",
	"M",
	"J",
	"J",
	"A",
	"S",
	"O",
	"N",
	"D"
];
function months(length) {
	switch (length) {
		case "narrow": return [...monthsNarrow];
		case "short": return [...monthsShort];
		case "long": return [...monthsLong];
		case "numeric": return [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"11",
			"12"
		];
		case "2-digit": return [
			"01",
			"02",
			"03",
			"04",
			"05",
			"06",
			"07",
			"08",
			"09",
			"10",
			"11",
			"12"
		];
		default: return null;
	}
}
const weekdaysLong = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday"
];
const weekdaysShort = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];
const weekdaysNarrow = [
	"M",
	"T",
	"W",
	"T",
	"F",
	"S",
	"S"
];
function weekdays(length) {
	switch (length) {
		case "narrow": return [...weekdaysNarrow];
		case "short": return [...weekdaysShort];
		case "long": return [...weekdaysLong];
		case "numeric": return [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7"
		];
		default: return null;
	}
}
const meridiems = ["AM", "PM"];
const erasLong = ["Before Christ", "Anno Domini"];
const erasShort = ["BC", "AD"];
const erasNarrow = ["B", "A"];
function eras(length) {
	switch (length) {
		case "narrow": return [...erasNarrow];
		case "short": return [...erasShort];
		case "long": return [...erasLong];
		default: return null;
	}
}
function meridiemForDateTime(dt$1) {
	return meridiems[dt$1.hour < 12 ? 0 : 1];
}
function weekdayForDateTime(dt$1, length) {
	return weekdays(length)[dt$1.weekday - 1];
}
function monthForDateTime(dt$1, length) {
	return months(length)[dt$1.month - 1];
}
function eraForDateTime(dt$1, length) {
	return eras(length)[dt$1.year < 0 ? 0 : 1];
}
function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
	const units = {
		years: ["year", "yr."],
		quarters: ["quarter", "qtr."],
		months: ["month", "mo."],
		weeks: ["week", "wk."],
		days: [
			"day",
			"day",
			"days"
		],
		hours: ["hour", "hr."],
		minutes: ["minute", "min."],
		seconds: ["second", "sec."]
	};
	const lastable = [
		"hours",
		"minutes",
		"seconds"
	].indexOf(unit) === -1;
	if (numeric === "auto" && lastable) {
		const isDay = unit === "days";
		switch (count) {
			case 1: return isDay ? "tomorrow" : `next ${units[unit][0]}`;
			case -1: return isDay ? "yesterday" : `last ${units[unit][0]}`;
			case 0: return isDay ? "today" : `this ${units[unit][0]}`;
			default:
		}
	}
	const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
	return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}
function stringifyTokens(splits, tokenToString) {
	let s$1 = "";
	for (const token of splits) if (token.literal) s$1 += token.val;
	else s$1 += tokenToString(token.val);
	return s$1;
}
var macroTokenToFormatOpts = {
	D: DATE_SHORT,
	DD: DATE_MED,
	DDD: DATE_FULL,
	DDDD: DATE_HUGE,
	t: TIME_SIMPLE,
	tt: TIME_WITH_SECONDS,
	ttt: TIME_WITH_SHORT_OFFSET,
	tttt: TIME_WITH_LONG_OFFSET,
	T: TIME_24_SIMPLE,
	TT: TIME_24_WITH_SECONDS,
	TTT: TIME_24_WITH_SHORT_OFFSET,
	TTTT: TIME_24_WITH_LONG_OFFSET,
	f: DATETIME_SHORT,
	ff: DATETIME_MED,
	fff: DATETIME_FULL,
	ffff: DATETIME_HUGE,
	F: DATETIME_SHORT_WITH_SECONDS,
	FF: DATETIME_MED_WITH_SECONDS,
	FFF: DATETIME_FULL_WITH_SECONDS,
	FFFF: DATETIME_HUGE_WITH_SECONDS
};
var Formatter = class Formatter {
	static create(locale, opts = {}) {
		return new Formatter(locale, opts);
	}
	static parseFormat(fmt) {
		let current = null, currentFull = "", bracketed = false;
		const splits = [];
		for (let i = 0; i < fmt.length; i++) {
			const c = fmt.charAt(i);
			if (c === "'") {
				if (currentFull.length > 0) splits.push({
					literal: bracketed || /^\s+$/.test(currentFull),
					val: currentFull
				});
				current = null;
				currentFull = "";
				bracketed = !bracketed;
			} else if (bracketed) currentFull += c;
			else if (c === current) currentFull += c;
			else {
				if (currentFull.length > 0) splits.push({
					literal: /^\s+$/.test(currentFull),
					val: currentFull
				});
				currentFull = c;
				current = c;
			}
		}
		if (currentFull.length > 0) splits.push({
			literal: bracketed || /^\s+$/.test(currentFull),
			val: currentFull
		});
		return splits;
	}
	static macroTokenToFormatOpts(token) {
		return macroTokenToFormatOpts[token];
	}
	constructor(locale, formatOpts) {
		this.opts = formatOpts;
		this.loc = locale;
		this.systemLoc = null;
	}
	formatWithSystemDefault(dt$1, opts) {
		if (this.systemLoc === null) this.systemLoc = this.loc.redefaultToSystem();
		return this.systemLoc.dtFormatter(dt$1, {
			...this.opts,
			...opts
		}).format();
	}
	dtFormatter(dt$1, opts = {}) {
		return this.loc.dtFormatter(dt$1, {
			...this.opts,
			...opts
		});
	}
	formatDateTime(dt$1, opts) {
		return this.dtFormatter(dt$1, opts).format();
	}
	formatDateTimeParts(dt$1, opts) {
		return this.dtFormatter(dt$1, opts).formatToParts();
	}
	formatInterval(interval, opts) {
		return this.dtFormatter(interval.start, opts).dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
	}
	resolvedOptions(dt$1, opts) {
		return this.dtFormatter(dt$1, opts).resolvedOptions();
	}
	num(n$1, p = 0) {
		if (this.opts.forceSimple) return padStart(n$1, p);
		const opts = { ...this.opts };
		if (p > 0) opts.padTo = p;
		return this.loc.numberFormatter(opts).format(n$1);
	}
	formatDateTimeFromString(dt$1, fmt) {
		const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string = (opts, extract) => this.loc.extract(dt$1, opts, extract), formatOffset$1 = (opts) => {
			if (dt$1.isOffsetFixed && dt$1.offset === 0 && opts.allowZ) return "Z";
			return dt$1.isValid ? dt$1.zone.formatOffset(dt$1.ts, opts.format) : "";
		}, meridiem = () => knownEnglish ? meridiemForDateTime(dt$1) : string({
			hour: "numeric",
			hourCycle: "h12"
		}, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt$1, length) : string(standalone ? { month: length } : {
			month: length,
			day: "numeric"
		}, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt$1, length) : string(standalone ? { weekday: length } : {
			weekday: length,
			month: "long",
			day: "numeric"
		}, "weekday"), maybeMacro = (token) => {
			const formatOpts = Formatter.macroTokenToFormatOpts(token);
			if (formatOpts) return this.formatWithSystemDefault(dt$1, formatOpts);
			else return token;
		}, era = (length) => knownEnglish ? eraForDateTime(dt$1, length) : string({ era: length }, "era"), tokenToString = (token) => {
			switch (token) {
				case "S": return this.num(dt$1.millisecond);
				case "u":
				case "SSS": return this.num(dt$1.millisecond, 3);
				case "s": return this.num(dt$1.second);
				case "ss": return this.num(dt$1.second, 2);
				case "uu": return this.num(Math.floor(dt$1.millisecond / 10), 2);
				case "uuu": return this.num(Math.floor(dt$1.millisecond / 100));
				case "m": return this.num(dt$1.minute);
				case "mm": return this.num(dt$1.minute, 2);
				case "h": return this.num(dt$1.hour % 12 === 0 ? 12 : dt$1.hour % 12);
				case "hh": return this.num(dt$1.hour % 12 === 0 ? 12 : dt$1.hour % 12, 2);
				case "H": return this.num(dt$1.hour);
				case "HH": return this.num(dt$1.hour, 2);
				case "Z": return formatOffset$1({
					format: "narrow",
					allowZ: this.opts.allowZ
				});
				case "ZZ": return formatOffset$1({
					format: "short",
					allowZ: this.opts.allowZ
				});
				case "ZZZ": return formatOffset$1({
					format: "techie",
					allowZ: this.opts.allowZ
				});
				case "ZZZZ": return dt$1.zone.offsetName(dt$1.ts, {
					format: "short",
					locale: this.loc.locale
				});
				case "ZZZZZ": return dt$1.zone.offsetName(dt$1.ts, {
					format: "long",
					locale: this.loc.locale
				});
				case "z": return dt$1.zoneName;
				case "a": return meridiem();
				case "d": return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt$1.day);
				case "dd": return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt$1.day, 2);
				case "c": return this.num(dt$1.weekday);
				case "ccc": return weekday("short", true);
				case "cccc": return weekday("long", true);
				case "ccccc": return weekday("narrow", true);
				case "E": return this.num(dt$1.weekday);
				case "EEE": return weekday("short", false);
				case "EEEE": return weekday("long", false);
				case "EEEEE": return weekday("narrow", false);
				case "L": return useDateTimeFormatter ? string({
					month: "numeric",
					day: "numeric"
				}, "month") : this.num(dt$1.month);
				case "LL": return useDateTimeFormatter ? string({
					month: "2-digit",
					day: "numeric"
				}, "month") : this.num(dt$1.month, 2);
				case "LLL": return month("short", true);
				case "LLLL": return month("long", true);
				case "LLLLL": return month("narrow", true);
				case "M": return useDateTimeFormatter ? string({ month: "numeric" }, "month") : this.num(dt$1.month);
				case "MM": return useDateTimeFormatter ? string({ month: "2-digit" }, "month") : this.num(dt$1.month, 2);
				case "MMM": return month("short", false);
				case "MMMM": return month("long", false);
				case "MMMMM": return month("narrow", false);
				case "y": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt$1.year);
				case "yy": return useDateTimeFormatter ? string({ year: "2-digit" }, "year") : this.num(dt$1.year.toString().slice(-2), 2);
				case "yyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt$1.year, 4);
				case "yyyyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt$1.year, 6);
				case "G": return era("short");
				case "GG": return era("long");
				case "GGGGG": return era("narrow");
				case "kk": return this.num(dt$1.weekYear.toString().slice(-2), 2);
				case "kkkk": return this.num(dt$1.weekYear, 4);
				case "W": return this.num(dt$1.weekNumber);
				case "WW": return this.num(dt$1.weekNumber, 2);
				case "n": return this.num(dt$1.localWeekNumber);
				case "nn": return this.num(dt$1.localWeekNumber, 2);
				case "ii": return this.num(dt$1.localWeekYear.toString().slice(-2), 2);
				case "iiii": return this.num(dt$1.localWeekYear, 4);
				case "o": return this.num(dt$1.ordinal);
				case "ooo": return this.num(dt$1.ordinal, 3);
				case "q": return this.num(dt$1.quarter);
				case "qq": return this.num(dt$1.quarter, 2);
				case "X": return this.num(Math.floor(dt$1.ts / 1e3));
				case "x": return this.num(dt$1.ts);
				default: return maybeMacro(token);
			}
		};
		return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
	}
	formatDurationFromString(dur, fmt) {
		const tokenToField = (token) => {
			switch (token[0]) {
				case "S": return "millisecond";
				case "s": return "second";
				case "m": return "minute";
				case "h": return "hour";
				case "d": return "day";
				case "w": return "week";
				case "M": return "month";
				case "y": return "year";
				default: return null;
			}
		}, tokenToString = (lildur) => (token) => {
			const mapped = tokenToField(token);
			if (mapped) return this.num(lildur.get(mapped), token.length);
			else return token;
		}, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce((found, { literal, val }) => literal ? found : found.concat(val), []);
		return stringifyTokens(tokens, tokenToString(dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t))));
	}
};
var ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function combineRegexes(...regexes) {
	const full = regexes.reduce((f, r) => f + r.source, "");
	return RegExp(`^${full}$`);
}
function combineExtractors(...extractors) {
	return (m) => extractors.reduce(([mergedVals, mergedZone, cursor], ex) => {
		const [val, zone, next] = ex(m, cursor);
		return [
			{
				...mergedVals,
				...val
			},
			zone || mergedZone,
			next
		];
	}, [
		{},
		null,
		1
	]).slice(0, 2);
}
function parse(s$1, ...patterns) {
	if (s$1 == null) return [null, null];
	for (const [regex, extractor] of patterns) {
		const m = regex.exec(s$1);
		if (m) return extractor(m);
	}
	return [null, null];
}
function simpleParse(...keys) {
	return (match$1, cursor) => {
		const ret = {};
		let i;
		for (i = 0; i < keys.length; i++) ret[keys[i]] = parseInteger(match$1[cursor + i]);
		return [
			ret,
			null,
			cursor + i
		];
	};
}
var offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
var isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
var isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
var isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
var isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
var isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
var isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
var isoOrdinalRegex = /(\d{4})-?(\d{3})/;
var extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
var extractISOOrdinalData = simpleParse("year", "ordinal");
var sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
var sqlTimeRegex = RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`);
var sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function int(match$1, pos, fallback) {
	const m = match$1[pos];
	return isUndefined(m) ? fallback : parseInteger(m);
}
function extractISOYmd(match$1, cursor) {
	return [
		{
			year: int(match$1, cursor),
			month: int(match$1, cursor + 1, 1),
			day: int(match$1, cursor + 2, 1)
		},
		null,
		cursor + 3
	];
}
function extractISOTime(match$1, cursor) {
	return [
		{
			hours: int(match$1, cursor, 0),
			minutes: int(match$1, cursor + 1, 0),
			seconds: int(match$1, cursor + 2, 0),
			milliseconds: parseMillis(match$1[cursor + 3])
		},
		null,
		cursor + 4
	];
}
function extractISOOffset(match$1, cursor) {
	const local = !match$1[cursor] && !match$1[cursor + 1], fullOffset = signedOffset(match$1[cursor + 1], match$1[cursor + 2]);
	return [
		{},
		local ? null : FixedOffsetZone.instance(fullOffset),
		cursor + 3
	];
}
function extractIANAZone(match$1, cursor) {
	return [
		{},
		match$1[cursor] ? IANAZone.create(match$1[cursor]) : null,
		cursor + 1
	];
}
var isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
var isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function extractISODuration(match$1) {
	const [s$1, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match$1;
	const hasNegativePrefix = s$1[0] === "-";
	const negativeSeconds = secondStr && secondStr[0] === "-";
	const maybeNegate = (num, force = false) => num !== void 0 && (force || num && hasNegativePrefix) ? -num : num;
	return [{
		years: maybeNegate(parseFloating(yearStr)),
		months: maybeNegate(parseFloating(monthStr)),
		weeks: maybeNegate(parseFloating(weekStr)),
		days: maybeNegate(parseFloating(dayStr)),
		hours: maybeNegate(parseFloating(hourStr)),
		minutes: maybeNegate(parseFloating(minuteStr)),
		seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
		milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
	}];
}
var obsOffsets = {
	GMT: 0,
	EDT: -240,
	EST: -300,
	CDT: -300,
	CST: -360,
	MDT: -360,
	MST: -420,
	PDT: -420,
	PST: -480
};
function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
	const result = {
		year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
		month: monthsShort.indexOf(monthStr) + 1,
		day: parseInteger(dayStr),
		hour: parseInteger(hourStr),
		minute: parseInteger(minuteStr)
	};
	if (secondStr) result.second = parseInteger(secondStr);
	if (weekdayStr) result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
	return result;
}
var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(match$1) {
	const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr, obsOffset, milOffset, offHourStr, offMinuteStr] = match$1, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
	let offset$1;
	if (obsOffset) offset$1 = obsOffsets[obsOffset];
	else if (milOffset) offset$1 = 0;
	else offset$1 = signedOffset(offHourStr, offMinuteStr);
	return [result, new FixedOffsetZone(offset$1)];
}
function preprocessRFC2822(s$1) {
	return s$1.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
var rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(match$1) {
	const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match$1;
	return [fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr), FixedOffsetZone.utcInstance];
}
function extractASCII(match$1) {
	const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match$1;
	return [fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr), FixedOffsetZone.utcInstance];
}
var isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
var isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
var isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
var isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
var extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
var extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset, extractIANAZone);
var extractISOOrdinalDateAndTime = combineExtractors(extractISOOrdinalData, extractISOTime, extractISOOffset, extractIANAZone);
var extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseISODate(s$1) {
	return parse(s$1, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
}
function parseRFC2822Date(s$1) {
	return parse(preprocessRFC2822(s$1), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(s$1) {
	return parse(s$1, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}
function parseISODuration(s$1) {
	return parse(s$1, [isoDuration, extractISODuration]);
}
var extractISOTimeOnly = combineExtractors(extractISOTime);
function parseISOTimeOnly(s$1) {
	return parse(s$1, [isoTimeOnly, extractISOTimeOnly]);
}
var sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
var sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
var extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseSQL(s$1) {
	return parse(s$1, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
}
var INVALID$2 = "Invalid Duration";
const lowOrderMatrix = {
	weeks: {
		days: 7,
		hours: 168,
		minutes: 10080,
		seconds: 10080 * 60,
		milliseconds: 10080 * 60 * 1e3
	},
	days: {
		hours: 24,
		minutes: 1440,
		seconds: 1440 * 60,
		milliseconds: 1440 * 60 * 1e3
	},
	hours: {
		minutes: 60,
		seconds: 3600,
		milliseconds: 3600 * 1e3
	},
	minutes: {
		seconds: 60,
		milliseconds: 60 * 1e3
	},
	seconds: { milliseconds: 1e3 }
};
const casualMatrix = {
	years: {
		quarters: 4,
		months: 12,
		weeks: 52,
		days: 365,
		hours: 365 * 24,
		minutes: 365 * 24 * 60,
		seconds: 365 * 24 * 60 * 60,
		milliseconds: 365 * 24 * 60 * 60 * 1e3
	},
	quarters: {
		months: 3,
		weeks: 13,
		days: 91,
		hours: 2184,
		minutes: 2184 * 60,
		seconds: 2184 * 60 * 60,
		milliseconds: 2184 * 60 * 60 * 1e3
	},
	months: {
		weeks: 4,
		days: 30,
		hours: 720,
		minutes: 720 * 60,
		seconds: 720 * 60 * 60,
		milliseconds: 720 * 60 * 60 * 1e3
	},
	...lowOrderMatrix
};
const daysInYearAccurate = 146097 / 400;
const daysInMonthAccurate = 146097 / 4800;
const accurateMatrix = {
	years: {
		quarters: 4,
		months: 12,
		weeks: daysInYearAccurate / 7,
		days: daysInYearAccurate,
		hours: daysInYearAccurate * 24,
		minutes: daysInYearAccurate * 24 * 60,
		seconds: daysInYearAccurate * 24 * 60 * 60,
		milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
	},
	quarters: {
		months: 3,
		weeks: daysInYearAccurate / 28,
		days: daysInYearAccurate / 4,
		hours: daysInYearAccurate * 24 / 4,
		minutes: daysInYearAccurate * 24 * 60 / 4,
		seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
		milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
	},
	months: {
		weeks: daysInMonthAccurate / 7,
		days: daysInMonthAccurate,
		hours: daysInMonthAccurate * 24,
		minutes: daysInMonthAccurate * 24 * 60,
		seconds: daysInMonthAccurate * 24 * 60 * 60,
		milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
	},
	...lowOrderMatrix
};
var orderedUnits$1 = [
	"years",
	"quarters",
	"months",
	"weeks",
	"days",
	"hours",
	"minutes",
	"seconds",
	"milliseconds"
];
var reverseUnits = orderedUnits$1.slice(0).reverse();
function clone$1(dur, alts, clear = false) {
	return new Duration({
		values: clear ? alts.values : {
			...dur.values,
			...alts.values || {}
		},
		loc: dur.loc.clone(alts.loc),
		conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
		matrix: alts.matrix || dur.matrix
	});
}
function durationToMillis(matrix, vals) {
	let sum = vals.milliseconds ?? 0;
	for (const unit of reverseUnits.slice(1)) if (vals[unit]) sum += vals[unit] * matrix[unit]["milliseconds"];
	return sum;
}
function normalizeValues(matrix, vals) {
	const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
	orderedUnits$1.reduceRight((previous, current) => {
		if (!isUndefined(vals[current])) {
			if (previous) {
				const previousVal = vals[previous] * factor;
				const conv = matrix[current][previous];
				const rollUp = Math.floor(previousVal / conv);
				vals[current] += rollUp * factor;
				vals[previous] -= rollUp * conv * factor;
			}
			return current;
		} else return previous;
	}, null);
	orderedUnits$1.reduce((previous, current) => {
		if (!isUndefined(vals[current])) {
			if (previous) {
				const fraction = vals[previous] % 1;
				vals[previous] -= fraction;
				vals[current] += fraction * matrix[previous][current];
			}
			return current;
		} else return previous;
	}, null);
}
function removeZeroes(vals) {
	const newVals = {};
	for (const [key, value] of Object.entries(vals)) if (value !== 0) newVals[key] = value;
	return newVals;
}
var Duration = class Duration {
	constructor(config) {
		const accurate = config.conversionAccuracy === "longterm" || false;
		let matrix = accurate ? accurateMatrix : casualMatrix;
		if (config.matrix) matrix = config.matrix;
		this.values = config.values;
		this.loc = config.loc || Locale.create();
		this.conversionAccuracy = accurate ? "longterm" : "casual";
		this.invalid = config.invalid || null;
		this.matrix = matrix;
		this.isLuxonDuration = true;
	}
	static fromMillis(count, opts) {
		return Duration.fromObject({ milliseconds: count }, opts);
	}
	static fromObject(obj, opts = {}) {
		if (obj == null || typeof obj !== "object") throw new InvalidArgumentError(`Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`);
		return new Duration({
			values: normalizeObject(obj, Duration.normalizeUnit),
			loc: Locale.fromObject(opts),
			conversionAccuracy: opts.conversionAccuracy,
			matrix: opts.matrix
		});
	}
	static fromDurationLike(durationLike) {
		if (isNumber(durationLike)) return Duration.fromMillis(durationLike);
		else if (Duration.isDuration(durationLike)) return durationLike;
		else if (typeof durationLike === "object") return Duration.fromObject(durationLike);
		else throw new InvalidArgumentError(`Unknown duration argument ${durationLike} of type ${typeof durationLike}`);
	}
	static fromISO(text, opts) {
		const [parsed] = parseISODuration(text);
		if (parsed) return Duration.fromObject(parsed, opts);
		else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	static fromISOTime(text, opts) {
		const [parsed] = parseISOTimeOnly(text);
		if (parsed) return Duration.fromObject(parsed, opts);
		else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidDurationError(invalid);
		else return new Duration({ invalid });
	}
	static normalizeUnit(unit) {
		const normalized = {
			year: "years",
			years: "years",
			quarter: "quarters",
			quarters: "quarters",
			month: "months",
			months: "months",
			week: "weeks",
			weeks: "weeks",
			day: "days",
			days: "days",
			hour: "hours",
			hours: "hours",
			minute: "minutes",
			minutes: "minutes",
			second: "seconds",
			seconds: "seconds",
			millisecond: "milliseconds",
			milliseconds: "milliseconds"
		}[unit ? unit.toLowerCase() : unit];
		if (!normalized) throw new InvalidUnitError(unit);
		return normalized;
	}
	static isDuration(o) {
		return o && o.isLuxonDuration || false;
	}
	get locale() {
		return this.isValid ? this.loc.locale : null;
	}
	get numberingSystem() {
		return this.isValid ? this.loc.numberingSystem : null;
	}
	toFormat(fmt, opts = {}) {
		const fmtOpts = {
			...opts,
			floor: opts.round !== false && opts.floor !== false
		};
		return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
	}
	toHuman(opts = {}) {
		if (!this.isValid) return INVALID$2;
		const l$1 = orderedUnits$1.map((unit) => {
			const val = this.values[unit];
			if (isUndefined(val)) return null;
			return this.loc.numberFormatter({
				style: "unit",
				unitDisplay: "long",
				...opts,
				unit: unit.slice(0, -1)
			}).format(val);
		}).filter((n$1) => n$1);
		return this.loc.listFormatter({
			type: "conjunction",
			style: opts.listStyle || "narrow",
			...opts
		}).format(l$1);
	}
	toObject() {
		if (!this.isValid) return {};
		return { ...this.values };
	}
	toISO() {
		if (!this.isValid) return null;
		let s$1 = "P";
		if (this.years !== 0) s$1 += this.years + "Y";
		if (this.months !== 0 || this.quarters !== 0) s$1 += this.months + this.quarters * 3 + "M";
		if (this.weeks !== 0) s$1 += this.weeks + "W";
		if (this.days !== 0) s$1 += this.days + "D";
		if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) s$1 += "T";
		if (this.hours !== 0) s$1 += this.hours + "H";
		if (this.minutes !== 0) s$1 += this.minutes + "M";
		if (this.seconds !== 0 || this.milliseconds !== 0) s$1 += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
		if (s$1 === "P") s$1 += "T0S";
		return s$1;
	}
	toISOTime(opts = {}) {
		if (!this.isValid) return null;
		const millis = this.toMillis();
		if (millis < 0 || millis >= 864e5) return null;
		opts = {
			suppressMilliseconds: false,
			suppressSeconds: false,
			includePrefix: false,
			format: "extended",
			...opts,
			includeOffset: false
		};
		return DateTime.fromMillis(millis, { zone: "UTC" }).toISOTime(opts);
	}
	toJSON() {
		return this.toISO();
	}
	toString() {
		return this.toISO();
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `Duration { values: ${JSON.stringify(this.values)} }`;
		else return `Duration { Invalid, reason: ${this.invalidReason} }`;
	}
	toMillis() {
		if (!this.isValid) return NaN;
		return durationToMillis(this.matrix, this.values);
	}
	valueOf() {
		return this.toMillis();
	}
	plus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration), result = {};
		for (const k of orderedUnits$1) if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) result[k] = dur.get(k) + this.get(k);
		return clone$1(this, { values: result }, true);
	}
	minus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration);
		return this.plus(dur.negate());
	}
	mapUnits(fn$1) {
		if (!this.isValid) return this;
		const result = {};
		for (const k of Object.keys(this.values)) result[k] = asNumber(fn$1(this.values[k], k));
		return clone$1(this, { values: result }, true);
	}
	get(unit) {
		return this[Duration.normalizeUnit(unit)];
	}
	set(values) {
		if (!this.isValid) return this;
		const mixed = {
			...this.values,
			...normalizeObject(values, Duration.normalizeUnit)
		};
		return clone$1(this, { values: mixed });
	}
	reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
		const opts = {
			loc: this.loc.clone({
				locale,
				numberingSystem
			}),
			matrix,
			conversionAccuracy
		};
		return clone$1(this, opts);
	}
	as(unit) {
		return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
	}
	normalize() {
		if (!this.isValid) return this;
		const vals = this.toObject();
		normalizeValues(this.matrix, vals);
		return clone$1(this, { values: vals }, true);
	}
	rescale() {
		if (!this.isValid) return this;
		const vals = removeZeroes(this.normalize().shiftToAll().toObject());
		return clone$1(this, { values: vals }, true);
	}
	shiftTo(...units) {
		if (!this.isValid) return this;
		if (units.length === 0) return this;
		units = units.map((u) => Duration.normalizeUnit(u));
		const built = {}, accumulated = {}, vals = this.toObject();
		let lastUnit;
		for (const k of orderedUnits$1) if (units.indexOf(k) >= 0) {
			lastUnit = k;
			let own = 0;
			for (const ak in accumulated) {
				own += this.matrix[ak][k] * accumulated[ak];
				accumulated[ak] = 0;
			}
			if (isNumber(vals[k])) own += vals[k];
			const i = Math.trunc(own);
			built[k] = i;
			accumulated[k] = (own * 1e3 - i * 1e3) / 1e3;
		} else if (isNumber(vals[k])) accumulated[k] = vals[k];
		for (const key in accumulated) if (accumulated[key] !== 0) built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
		normalizeValues(this.matrix, built);
		return clone$1(this, { values: built }, true);
	}
	shiftToAll() {
		if (!this.isValid) return this;
		return this.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds");
	}
	negate() {
		if (!this.isValid) return this;
		const negated = {};
		for (const k of Object.keys(this.values)) negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
		return clone$1(this, { values: negated }, true);
	}
	get years() {
		return this.isValid ? this.values.years || 0 : NaN;
	}
	get quarters() {
		return this.isValid ? this.values.quarters || 0 : NaN;
	}
	get months() {
		return this.isValid ? this.values.months || 0 : NaN;
	}
	get weeks() {
		return this.isValid ? this.values.weeks || 0 : NaN;
	}
	get days() {
		return this.isValid ? this.values.days || 0 : NaN;
	}
	get hours() {
		return this.isValid ? this.values.hours || 0 : NaN;
	}
	get minutes() {
		return this.isValid ? this.values.minutes || 0 : NaN;
	}
	get seconds() {
		return this.isValid ? this.values.seconds || 0 : NaN;
	}
	get milliseconds() {
		return this.isValid ? this.values.milliseconds || 0 : NaN;
	}
	get isValid() {
		return this.invalid === null;
	}
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	equals(other) {
		if (!this.isValid || !other.isValid) return false;
		if (!this.loc.equals(other.loc)) return false;
		function eq(v1, v2) {
			if (v1 === void 0 || v1 === 0) return v2 === void 0 || v2 === 0;
			return v1 === v2;
		}
		for (const u of orderedUnits$1) if (!eq(this.values[u], other.values[u])) return false;
		return true;
	}
};
var INVALID$1 = "Invalid Interval";
function validateStartEnd(start, end) {
	if (!start || !start.isValid) return Interval.invalid("missing or invalid start");
	else if (!end || !end.isValid) return Interval.invalid("missing or invalid end");
	else if (end < start) return Interval.invalid("end before start", `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`);
	else return null;
}
var Interval = class Interval {
	constructor(config) {
		this.s = config.start;
		this.e = config.end;
		this.invalid = config.invalid || null;
		this.isLuxonInterval = true;
	}
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidIntervalError(invalid);
		else return new Interval({ invalid });
	}
	static fromDateTimes(start, end) {
		const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
		const validateError = validateStartEnd(builtStart, builtEnd);
		if (validateError == null) return new Interval({
			start: builtStart,
			end: builtEnd
		});
		else return validateError;
	}
	static after(start, duration) {
		const dur = Duration.fromDurationLike(duration), dt$1 = friendlyDateTime(start);
		return Interval.fromDateTimes(dt$1, dt$1.plus(dur));
	}
	static before(end, duration) {
		const dur = Duration.fromDurationLike(duration), dt$1 = friendlyDateTime(end);
		return Interval.fromDateTimes(dt$1.minus(dur), dt$1);
	}
	static fromISO(text, opts) {
		const [s$1, e] = (text || "").split("/", 2);
		if (s$1 && e) {
			let start, startIsValid;
			try {
				start = DateTime.fromISO(s$1, opts);
				startIsValid = start.isValid;
			} catch (e$1) {
				startIsValid = false;
			}
			let end, endIsValid;
			try {
				end = DateTime.fromISO(e, opts);
				endIsValid = end.isValid;
			} catch (e$1) {
				endIsValid = false;
			}
			if (startIsValid && endIsValid) return Interval.fromDateTimes(start, end);
			if (startIsValid) {
				const dur = Duration.fromISO(e, opts);
				if (dur.isValid) return Interval.after(start, dur);
			} else if (endIsValid) {
				const dur = Duration.fromISO(s$1, opts);
				if (dur.isValid) return Interval.before(end, dur);
			}
		}
		return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	static isInterval(o) {
		return o && o.isLuxonInterval || false;
	}
	get start() {
		return this.isValid ? this.s : null;
	}
	get end() {
		return this.isValid ? this.e : null;
	}
	get isValid() {
		return this.invalidReason === null;
	}
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	length(unit = "milliseconds") {
		return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
	}
	count(unit = "milliseconds", opts) {
		if (!this.isValid) return NaN;
		const start = this.start.startOf(unit, opts);
		let end;
		if (opts?.useLocaleWeeks) end = this.end.reconfigure({ locale: start.locale });
		else end = this.end;
		end = end.startOf(unit, opts);
		return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
	}
	hasSame(unit) {
		return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
	}
	isEmpty() {
		return this.s.valueOf() === this.e.valueOf();
	}
	isAfter(dateTime) {
		if (!this.isValid) return false;
		return this.s > dateTime;
	}
	isBefore(dateTime) {
		if (!this.isValid) return false;
		return this.e <= dateTime;
	}
	contains(dateTime) {
		if (!this.isValid) return false;
		return this.s <= dateTime && this.e > dateTime;
	}
	set({ start, end } = {}) {
		if (!this.isValid) return this;
		return Interval.fromDateTimes(start || this.s, end || this.e);
	}
	splitAt(...dateTimes) {
		if (!this.isValid) return [];
		const sorted = dateTimes.map(friendlyDateTime).filter((d) => this.contains(d)).sort((a, b) => a.toMillis() - b.toMillis()), results = [];
		let { s: s$1 } = this, i = 0;
		while (s$1 < this.e) {
			const added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
			results.push(Interval.fromDateTimes(s$1, next));
			s$1 = next;
			i += 1;
		}
		return results;
	}
	splitBy(duration) {
		const dur = Duration.fromDurationLike(duration);
		if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) return [];
		let { s: s$1 } = this, idx = 1, next;
		const results = [];
		while (s$1 < this.e) {
			const added = this.start.plus(dur.mapUnits((x$1) => x$1 * idx));
			next = +added > +this.e ? this.e : added;
			results.push(Interval.fromDateTimes(s$1, next));
			s$1 = next;
			idx += 1;
		}
		return results;
	}
	divideEqually(numberOfParts) {
		if (!this.isValid) return [];
		return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
	}
	overlaps(other) {
		return this.e > other.s && this.s < other.e;
	}
	abutsStart(other) {
		if (!this.isValid) return false;
		return +this.e === +other.s;
	}
	abutsEnd(other) {
		if (!this.isValid) return false;
		return +other.e === +this.s;
	}
	engulfs(other) {
		if (!this.isValid) return false;
		return this.s <= other.s && this.e >= other.e;
	}
	equals(other) {
		if (!this.isValid || !other.isValid) return false;
		return this.s.equals(other.s) && this.e.equals(other.e);
	}
	intersection(other) {
		if (!this.isValid) return this;
		const s$1 = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
		if (s$1 >= e) return null;
		else return Interval.fromDateTimes(s$1, e);
	}
	union(other) {
		if (!this.isValid) return this;
		const s$1 = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
		return Interval.fromDateTimes(s$1, e);
	}
	static merge(intervals) {
		const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(([sofar, current], item) => {
			if (!current) return [sofar, item];
			else if (current.overlaps(item) || current.abutsStart(item)) return [sofar, current.union(item)];
			else return [sofar.concat([current]), item];
		}, [[], null]);
		if (final) found.push(final);
		return found;
	}
	static xor(intervals) {
		let start = null, currentCount = 0;
		const results = [], ends = intervals.map((i) => [{
			time: i.s,
			type: "s"
		}, {
			time: i.e,
			type: "e"
		}]), arr = Array.prototype.concat(...ends).sort((a, b) => a.time - b.time);
		for (const i of arr) {
			currentCount += i.type === "s" ? 1 : -1;
			if (currentCount === 1) start = i.time;
			else {
				if (start && +start !== +i.time) results.push(Interval.fromDateTimes(start, i.time));
				start = null;
			}
		}
		return Interval.merge(results);
	}
	difference(...intervals) {
		return Interval.xor([this].concat(intervals)).map((i) => this.intersection(i)).filter((i) => i && !i.isEmpty());
	}
	toString() {
		if (!this.isValid) return INVALID$1;
		return `[${this.s.toISO()} – ${this.e.toISO()})`;
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
		else return `Interval { Invalid, reason: ${this.invalidReason} }`;
	}
	toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
		return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
	}
	toISO(opts) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
	}
	toISODate() {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISODate()}/${this.e.toISODate()}`;
	}
	toISOTime(opts) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
	}
	toFormat(dateFormat, { separator = " – " } = {}) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
	}
	toDuration(unit, opts) {
		if (!this.isValid) return Duration.invalid(this.invalidReason);
		return this.e.diff(this.s, unit, opts);
	}
	mapEndpoints(mapFn) {
		return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
	}
};
var Info = class {
	static hasDST(zone = Settings.defaultZone) {
		const proto = DateTime.now().setZone(zone).set({ month: 12 });
		return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
	}
	static isValidIANAZone(zone) {
		return IANAZone.isValidZone(zone);
	}
	static normalizeZone(input) {
		return normalizeZone(input, Settings.defaultZone);
	}
	static getStartOfWeek({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getStartOfWeek();
	}
	static getMinimumDaysInFirstWeek({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
	}
	static getWeekendWeekdays({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getWeekendDays().slice();
	}
	static months(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
	}
	static monthsFormat(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
	}
	static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
	}
	static weekdaysFormat(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
	}
	static meridiems({ locale = null } = {}) {
		return Locale.create(locale).meridiems();
	}
	static eras(length = "short", { locale = null } = {}) {
		return Locale.create(locale, null, "gregory").eras(length);
	}
	static features() {
		return {
			relative: hasRelative(),
			localeWeek: hasLocaleWeekInfo()
		};
	}
};
function dayDiff(earlier, later) {
	const utcDayStart = (dt$1) => dt$1.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(), ms$3 = utcDayStart(later) - utcDayStart(earlier);
	return Math.floor(Duration.fromMillis(ms$3).as("days"));
}
function highOrderDiffs(cursor, later, units) {
	const differs = [
		["years", (a, b) => b.year - a.year],
		["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
		["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
		["weeks", (a, b) => {
			const days = dayDiff(a, b);
			return (days - days % 7) / 7;
		}],
		["days", dayDiff]
	];
	const results = {};
	const earlier = cursor;
	let lowestOrder, highWater;
	for (const [unit, differ] of differs) if (units.indexOf(unit) >= 0) {
		lowestOrder = unit;
		results[unit] = differ(cursor, later);
		highWater = earlier.plus(results);
		if (highWater > later) {
			results[unit]--;
			cursor = earlier.plus(results);
			if (cursor > later) {
				highWater = cursor;
				results[unit]--;
				cursor = earlier.plus(results);
			}
		} else cursor = highWater;
	}
	return [
		cursor,
		results,
		highWater,
		lowestOrder
	];
}
function diff_default(earlier, later, units, opts) {
	let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
	const remainingMillis = later - cursor;
	const lowerOrderUnits = units.filter((u) => [
		"hours",
		"minutes",
		"seconds",
		"milliseconds"
	].indexOf(u) >= 0);
	if (lowerOrderUnits.length === 0) {
		if (highWater < later) highWater = cursor.plus({ [lowestOrder]: 1 });
		if (highWater !== cursor) results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
	}
	const duration = Duration.fromObject(results, opts);
	if (lowerOrderUnits.length > 0) return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
	else return duration;
}
var MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
function intUnit(regex, post = (i) => i) {
	return {
		regex,
		deser: ([s$1]) => post(parseDigits(s$1))
	};
}
var spaceOrNBSP = `[ ${String.fromCharCode(160)}]`;
var spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
function fixListRegex(s$1) {
	return s$1.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}
function stripInsensitivities(s$1) {
	return s$1.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
}
function oneOf(strings, startIndex) {
	if (strings === null) return null;
	else return {
		regex: RegExp(strings.map(fixListRegex).join("|")),
		deser: ([s$1]) => strings.findIndex((i) => stripInsensitivities(s$1) === stripInsensitivities(i)) + startIndex
	};
}
function offset(regex, groups) {
	return {
		regex,
		deser: ([, h$1, m]) => signedOffset(h$1, m),
		groups
	};
}
function simple(regex) {
	return {
		regex,
		deser: ([s$1]) => s$1
	};
}
function escapeToken(value) {
	return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function unitForToken(token, loc) {
	const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t) => ({
		regex: RegExp(escapeToken(t.val)),
		deser: ([s$1]) => s$1,
		literal: true
	}), unitate = (t) => {
		if (token.literal) return literal(t);
		switch (t.val) {
			case "G": return oneOf(loc.eras("short"), 0);
			case "GG": return oneOf(loc.eras("long"), 0);
			case "y": return intUnit(oneToSix);
			case "yy": return intUnit(twoToFour, untruncateYear);
			case "yyyy": return intUnit(four);
			case "yyyyy": return intUnit(fourToSix);
			case "yyyyyy": return intUnit(six);
			case "M": return intUnit(oneOrTwo);
			case "MM": return intUnit(two);
			case "MMM": return oneOf(loc.months("short", true), 1);
			case "MMMM": return oneOf(loc.months("long", true), 1);
			case "L": return intUnit(oneOrTwo);
			case "LL": return intUnit(two);
			case "LLL": return oneOf(loc.months("short", false), 1);
			case "LLLL": return oneOf(loc.months("long", false), 1);
			case "d": return intUnit(oneOrTwo);
			case "dd": return intUnit(two);
			case "o": return intUnit(oneToThree);
			case "ooo": return intUnit(three);
			case "HH": return intUnit(two);
			case "H": return intUnit(oneOrTwo);
			case "hh": return intUnit(two);
			case "h": return intUnit(oneOrTwo);
			case "mm": return intUnit(two);
			case "m": return intUnit(oneOrTwo);
			case "q": return intUnit(oneOrTwo);
			case "qq": return intUnit(two);
			case "s": return intUnit(oneOrTwo);
			case "ss": return intUnit(two);
			case "S": return intUnit(oneToThree);
			case "SSS": return intUnit(three);
			case "u": return simple(oneToNine);
			case "uu": return simple(oneOrTwo);
			case "uuu": return intUnit(one);
			case "a": return oneOf(loc.meridiems(), 0);
			case "kkkk": return intUnit(four);
			case "kk": return intUnit(twoToFour, untruncateYear);
			case "W": return intUnit(oneOrTwo);
			case "WW": return intUnit(two);
			case "E":
			case "c": return intUnit(one);
			case "EEE": return oneOf(loc.weekdays("short", false), 1);
			case "EEEE": return oneOf(loc.weekdays("long", false), 1);
			case "ccc": return oneOf(loc.weekdays("short", true), 1);
			case "cccc": return oneOf(loc.weekdays("long", true), 1);
			case "Z":
			case "ZZ": return offset(/* @__PURE__ */ new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
			case "ZZZ": return offset(/* @__PURE__ */ new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
			case "z": return simple(/[a-z_+-/]{1,256}?/i);
			case " ": return simple(/[^\S\n\r]/);
			default: return literal(t);
		}
	};
	const unit = unitate(token) || { invalidReason: MISSING_FTP };
	unit.token = token;
	return unit;
}
var partTypeStyleToTokenVal = {
	year: {
		"2-digit": "yy",
		numeric: "yyyyy"
	},
	month: {
		numeric: "M",
		"2-digit": "MM",
		short: "MMM",
		long: "MMMM"
	},
	day: {
		numeric: "d",
		"2-digit": "dd"
	},
	weekday: {
		short: "EEE",
		long: "EEEE"
	},
	dayperiod: "a",
	dayPeriod: "a",
	hour12: {
		numeric: "h",
		"2-digit": "hh"
	},
	hour24: {
		numeric: "H",
		"2-digit": "HH"
	},
	minute: {
		numeric: "m",
		"2-digit": "mm"
	},
	second: {
		numeric: "s",
		"2-digit": "ss"
	},
	timeZoneName: {
		long: "ZZZZZ",
		short: "ZZZ"
	}
};
function tokenForPart(part, formatOpts, resolvedOpts) {
	const { type, value } = part;
	if (type === "literal") {
		const isSpace = /^\s+$/.test(value);
		return {
			literal: !isSpace,
			val: isSpace ? " " : value
		};
	}
	const style = formatOpts[type];
	let actualType = type;
	if (type === "hour") if (formatOpts.hour12 != null) actualType = formatOpts.hour12 ? "hour12" : "hour24";
	else if (formatOpts.hourCycle != null) if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") actualType = "hour12";
	else actualType = "hour24";
	else actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
	let val = partTypeStyleToTokenVal[actualType];
	if (typeof val === "object") val = val[style];
	if (val) return {
		literal: false,
		val
	};
}
function buildRegex(units) {
	return [`^${units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "")}$`, units];
}
function match(input, regex, handlers) {
	const matches = input.match(regex);
	if (matches) {
		const all = {};
		let matchIndex = 1;
		for (const i in handlers) if (hasOwnProperty(handlers, i)) {
			const h$1 = handlers[i], groups = h$1.groups ? h$1.groups + 1 : 1;
			if (!h$1.literal && h$1.token) all[h$1.token.val[0]] = h$1.deser(matches.slice(matchIndex, matchIndex + groups));
			matchIndex += groups;
		}
		return [matches, all];
	} else return [matches, {}];
}
function dateTimeFromMatches(matches) {
	const toField = (token) => {
		switch (token) {
			case "S": return "millisecond";
			case "s": return "second";
			case "m": return "minute";
			case "h":
			case "H": return "hour";
			case "d": return "day";
			case "o": return "ordinal";
			case "L":
			case "M": return "month";
			case "y": return "year";
			case "E":
			case "c": return "weekday";
			case "W": return "weekNumber";
			case "k": return "weekYear";
			case "q": return "quarter";
			default: return null;
		}
	};
	let zone = null;
	let specificOffset;
	if (!isUndefined(matches.z)) zone = IANAZone.create(matches.z);
	if (!isUndefined(matches.Z)) {
		if (!zone) zone = new FixedOffsetZone(matches.Z);
		specificOffset = matches.Z;
	}
	if (!isUndefined(matches.q)) matches.M = (matches.q - 1) * 3 + 1;
	if (!isUndefined(matches.h)) {
		if (matches.h < 12 && matches.a === 1) matches.h += 12;
		else if (matches.h === 12 && matches.a === 0) matches.h = 0;
	}
	if (matches.G === 0 && matches.y) matches.y = -matches.y;
	if (!isUndefined(matches.u)) matches.S = parseMillis(matches.u);
	return [
		Object.keys(matches).reduce((r, k) => {
			const f = toField(k);
			if (f) r[f] = matches[k];
			return r;
		}, {}),
		zone,
		specificOffset
	];
}
var dummyDateTimeCache = null;
function getDummyDateTime() {
	if (!dummyDateTimeCache) dummyDateTimeCache = DateTime.fromMillis(1555555555555);
	return dummyDateTimeCache;
}
function maybeExpandMacroToken(token, locale) {
	if (token.literal) return token;
	const tokens = formatOptsToTokens(Formatter.macroTokenToFormatOpts(token.val), locale);
	if (tokens == null || tokens.includes(void 0)) return token;
	return tokens;
}
function expandMacroTokens(tokens, locale) {
	return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
}
var TokenParser = class {
	constructor(locale, format) {
		this.locale = locale;
		this.format = format;
		this.tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
		this.units = this.tokens.map((t) => unitForToken(t, locale));
		this.disqualifyingUnit = this.units.find((t) => t.invalidReason);
		if (!this.disqualifyingUnit) {
			const [regexString, handlers] = buildRegex(this.units);
			this.regex = RegExp(regexString, "i");
			this.handlers = handlers;
		}
	}
	explainFromTokens(input) {
		if (!this.isValid) return {
			input,
			tokens: this.tokens,
			invalidReason: this.invalidReason
		};
		else {
			const [rawMatches, matches] = match(input, this.regex, this.handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [
				null,
				null,
				void 0
			];
			if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");
			return {
				input,
				tokens: this.tokens,
				regex: this.regex,
				rawMatches,
				matches,
				result,
				zone,
				specificOffset
			};
		}
	}
	get isValid() {
		return !this.disqualifyingUnit;
	}
	get invalidReason() {
		return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
	}
};
function explainFromTokens(locale, input, format) {
	return new TokenParser(locale, format).explainFromTokens(input);
}
function parseFromTokens(locale, input, format) {
	const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
	return [
		result,
		zone,
		specificOffset,
		invalidReason
	];
}
function formatOptsToTokens(formatOpts, locale) {
	if (!formatOpts) return null;
	const df = Formatter.create(locale, formatOpts).dtFormatter(getDummyDateTime());
	const parts = df.formatToParts();
	const resolvedOpts = df.resolvedOptions();
	return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
}
var INVALID = "Invalid DateTime";
var MAX_DATE = 864e13;
function unsupportedZone(zone) {
	return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}
function possiblyCachedWeekData(dt$1) {
	if (dt$1.weekData === null) dt$1.weekData = gregorianToWeek(dt$1.c);
	return dt$1.weekData;
}
function possiblyCachedLocalWeekData(dt$1) {
	if (dt$1.localWeekData === null) dt$1.localWeekData = gregorianToWeek(dt$1.c, dt$1.loc.getMinDaysInFirstWeek(), dt$1.loc.getStartOfWeek());
	return dt$1.localWeekData;
}
function clone(inst, alts) {
	const current = {
		ts: inst.ts,
		zone: inst.zone,
		c: inst.c,
		o: inst.o,
		loc: inst.loc,
		invalid: inst.invalid
	};
	return new DateTime({
		...current,
		...alts,
		old: current
	});
}
function fixOffset(localTS, o, tz) {
	let utcGuess = localTS - o * 60 * 1e3;
	const o2 = tz.offset(utcGuess);
	if (o === o2) return [utcGuess, o];
	utcGuess -= (o2 - o) * 60 * 1e3;
	const o3 = tz.offset(utcGuess);
	if (o2 === o3) return [utcGuess, o2];
	return [localTS - Math.min(o2, o3) * 60 * 1e3, Math.max(o2, o3)];
}
function tsToObj(ts$3, offset$1) {
	ts$3 += offset$1 * 60 * 1e3;
	const d = new Date(ts$3);
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		day: d.getUTCDate(),
		hour: d.getUTCHours(),
		minute: d.getUTCMinutes(),
		second: d.getUTCSeconds(),
		millisecond: d.getUTCMilliseconds()
	};
}
function objToTS(obj, offset$1, zone) {
	return fixOffset(objToLocalTS(obj), offset$1, zone);
}
function adjustTime(inst, dur) {
	const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = {
		...inst.c,
		year,
		month,
		day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
	}, millisToAdd = Duration.fromObject({
		years: dur.years - Math.trunc(dur.years),
		quarters: dur.quarters - Math.trunc(dur.quarters),
		months: dur.months - Math.trunc(dur.months),
		weeks: dur.weeks - Math.trunc(dur.weeks),
		days: dur.days - Math.trunc(dur.days),
		hours: dur.hours,
		minutes: dur.minutes,
		seconds: dur.seconds,
		milliseconds: dur.milliseconds
	}).as("milliseconds");
	let [ts$3, o] = fixOffset(objToLocalTS(c), oPre, inst.zone);
	if (millisToAdd !== 0) {
		ts$3 += millisToAdd;
		o = inst.zone.offset(ts$3);
	}
	return {
		ts: ts$3,
		o
	};
}
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
	const { setZone, zone } = opts;
	if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
		const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
			...opts,
			zone: interpretationZone,
			specificOffset
		});
		return setZone ? inst : inst.setZone(zone);
	} else return DateTime.invalid(new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`));
}
function toTechFormat(dt$1, format, allowZ = true) {
	return dt$1.isValid ? Formatter.create(Locale.create("en-US"), {
		allowZ,
		forceSimple: true
	}).formatDateTimeFromString(dt$1, format) : null;
}
function toISODate(o, extended) {
	const longFormat = o.c.year > 9999 || o.c.year < 0;
	let c = "";
	if (longFormat && o.c.year >= 0) c += "+";
	c += padStart(o.c.year, longFormat ? 6 : 4);
	if (extended) {
		c += "-";
		c += padStart(o.c.month);
		c += "-";
		c += padStart(o.c.day);
	} else {
		c += padStart(o.c.month);
		c += padStart(o.c.day);
	}
	return c;
}
function toISOTime(o, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone) {
	let c = padStart(o.c.hour);
	if (extended) {
		c += ":";
		c += padStart(o.c.minute);
		if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) c += ":";
	} else c += padStart(o.c.minute);
	if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
		c += padStart(o.c.second);
		if (o.c.millisecond !== 0 || !suppressMilliseconds) {
			c += ".";
			c += padStart(o.c.millisecond, 3);
		}
	}
	if (includeOffset) if (o.isOffsetFixed && o.offset === 0 && !extendedZone) c += "Z";
	else if (o.o < 0) {
		c += "-";
		c += padStart(Math.trunc(-o.o / 60));
		c += ":";
		c += padStart(Math.trunc(-o.o % 60));
	} else {
		c += "+";
		c += padStart(Math.trunc(o.o / 60));
		c += ":";
		c += padStart(Math.trunc(o.o % 60));
	}
	if (extendedZone) c += "[" + o.zone.ianaName + "]";
	return c;
}
var defaultUnitValues = {
	month: 1,
	day: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
}, defaultWeekUnitValues = {
	weekNumber: 1,
	weekday: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
}, defaultOrdinalUnitValues = {
	ordinal: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
};
var orderedUnits = [
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
	"millisecond"
], orderedWeekUnits = [
	"weekYear",
	"weekNumber",
	"weekday",
	"hour",
	"minute",
	"second",
	"millisecond"
], orderedOrdinalUnits = [
	"year",
	"ordinal",
	"hour",
	"minute",
	"second",
	"millisecond"
];
function normalizeUnit(unit) {
	const normalized = {
		year: "year",
		years: "year",
		month: "month",
		months: "month",
		day: "day",
		days: "day",
		hour: "hour",
		hours: "hour",
		minute: "minute",
		minutes: "minute",
		quarter: "quarter",
		quarters: "quarter",
		second: "second",
		seconds: "second",
		millisecond: "millisecond",
		milliseconds: "millisecond",
		weekday: "weekday",
		weekdays: "weekday",
		weeknumber: "weekNumber",
		weeksnumber: "weekNumber",
		weeknumbers: "weekNumber",
		weekyear: "weekYear",
		weekyears: "weekYear",
		ordinal: "ordinal"
	}[unit.toLowerCase()];
	if (!normalized) throw new InvalidUnitError(unit);
	return normalized;
}
function normalizeUnitWithLocalWeeks(unit) {
	switch (unit.toLowerCase()) {
		case "localweekday":
		case "localweekdays": return "localWeekday";
		case "localweeknumber":
		case "localweeknumbers": return "localWeekNumber";
		case "localweekyear":
		case "localweekyears": return "localWeekYear";
		default: return normalizeUnit(unit);
	}
}
function guessOffsetForZone(zone) {
	if (!zoneOffsetGuessCache[zone]) {
		if (zoneOffsetTs === void 0) zoneOffsetTs = Settings.now();
		zoneOffsetGuessCache[zone] = zone.offset(zoneOffsetTs);
	}
	return zoneOffsetGuessCache[zone];
}
function quickDT(obj, opts) {
	const zone = normalizeZone(opts.zone, Settings.defaultZone);
	if (!zone.isValid) return DateTime.invalid(unsupportedZone(zone));
	const loc = Locale.fromObject(opts);
	let ts$3, o;
	if (!isUndefined(obj.year)) {
		for (const u of orderedUnits) if (isUndefined(obj[u])) obj[u] = defaultUnitValues[u];
		const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
		if (invalid) return DateTime.invalid(invalid);
		const offsetProvis = guessOffsetForZone(zone);
		[ts$3, o] = objToTS(obj, offsetProvis, zone);
	} else ts$3 = Settings.now();
	return new DateTime({
		ts: ts$3,
		zone,
		loc,
		o
	});
}
function diffRelative(start, end, opts) {
	const round = isUndefined(opts.round) ? true : opts.round, format = (c, unit) => {
		c = roundTo(c, round || opts.calendary ? 0 : 2, true);
		return end.loc.clone(opts).relFormatter(opts).format(c, unit);
	}, differ = (unit) => {
		if (opts.calendary) if (!end.hasSame(start, unit)) return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
		else return 0;
		else return end.diff(start, unit).get(unit);
	};
	if (opts.unit) return format(differ(opts.unit), opts.unit);
	for (const unit of opts.units) {
		const count = differ(unit);
		if (Math.abs(count) >= 1) return format(count, unit);
	}
	return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}
function lastOpts(argList) {
	let opts = {}, args;
	if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
		opts = argList[argList.length - 1];
		args = Array.from(argList).slice(0, argList.length - 1);
	} else args = Array.from(argList);
	return [opts, args];
}
var zoneOffsetTs;
var zoneOffsetGuessCache = {};
var DateTime = class DateTime {
	constructor(config) {
		const zone = config.zone || Settings.defaultZone;
		let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
		this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
		let c = null, o = null;
		if (!invalid) if (config.old && config.old.ts === this.ts && config.old.zone.equals(zone)) [c, o] = [config.old.c, config.old.o];
		else {
			const ot$2 = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
			c = tsToObj(this.ts, ot$2);
			invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
			c = invalid ? null : c;
			o = invalid ? null : ot$2;
		}
		this._zone = zone;
		this.loc = config.loc || Locale.create();
		this.invalid = invalid;
		this.weekData = null;
		this.localWeekData = null;
		this.c = c;
		this.o = o;
		this.isLuxonDateTime = true;
	}
	static now() {
		return new DateTime({});
	}
	static local() {
		const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
		return quickDT({
			year,
			month,
			day,
			hour,
			minute,
			second,
			millisecond
		}, opts);
	}
	static utc() {
		const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
		opts.zone = FixedOffsetZone.utcInstance;
		return quickDT({
			year,
			month,
			day,
			hour,
			minute,
			second,
			millisecond
		}, opts);
	}
	static fromJSDate(date, options = {}) {
		const ts$3 = isDate(date) ? date.valueOf() : NaN;
		if (Number.isNaN(ts$3)) return DateTime.invalid("invalid input");
		const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
		if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
		return new DateTime({
			ts: ts$3,
			zone: zoneToUse,
			loc: Locale.fromObject(options)
		});
	}
	static fromMillis(milliseconds, options = {}) {
		if (!isNumber(milliseconds)) throw new InvalidArgumentError(`fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`);
		else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) return DateTime.invalid("Timestamp out of range");
		else return new DateTime({
			ts: milliseconds,
			zone: normalizeZone(options.zone, Settings.defaultZone),
			loc: Locale.fromObject(options)
		});
	}
	static fromSeconds(seconds, options = {}) {
		if (!isNumber(seconds)) throw new InvalidArgumentError("fromSeconds requires a numerical input");
		else return new DateTime({
			ts: seconds * 1e3,
			zone: normalizeZone(options.zone, Settings.defaultZone),
			loc: Locale.fromObject(options)
		});
	}
	static fromObject(obj, opts = {}) {
		obj = obj || {};
		const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
		if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
		const loc = Locale.fromObject(opts);
		const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
		const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
		const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
		if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
		if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
		const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
		let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
		if (useWeekData) {
			units = orderedWeekUnits;
			defaultValues = defaultWeekUnitValues;
			objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
		} else if (containsOrdinal) {
			units = orderedOrdinalUnits;
			defaultValues = defaultOrdinalUnitValues;
			objNow = gregorianToOrdinal(objNow);
		} else {
			units = orderedUnits;
			defaultValues = defaultUnitValues;
		}
		let foundFirst = false;
		for (const u of units) {
			const v$1 = normalized[u];
			if (!isUndefined(v$1)) foundFirst = true;
			else if (foundFirst) normalized[u] = defaultValues[u];
			else normalized[u] = objNow[u];
		}
		const invalid = (useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized)) || hasInvalidTimeData(normalized);
		if (invalid) return DateTime.invalid(invalid);
		const [tsFinal, offsetFinal] = objToTS(useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, offsetProvis, zoneToUse), inst = new DateTime({
			ts: tsFinal,
			zone: zoneToUse,
			o: offsetFinal,
			loc
		});
		if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) return DateTime.invalid("mismatched weekday", `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`);
		if (!inst.isValid) return DateTime.invalid(inst.invalid);
		return inst;
	}
	static fromISO(text, opts = {}) {
		const [vals, parsedZone] = parseISODate(text);
		return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
	}
	static fromRFC2822(text, opts = {}) {
		const [vals, parsedZone] = parseRFC2822Date(text);
		return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
	}
	static fromHTTP(text, opts = {}) {
		const [vals, parsedZone] = parseHTTPDate(text);
		return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
	}
	static fromFormat(text, fmt, opts = {}) {
		if (isUndefined(text) || isUndefined(fmt)) throw new InvalidArgumentError("fromFormat requires an input string and a format");
		const { locale = null, numberingSystem = null } = opts, [vals, parsedZone, specificOffset, invalid] = parseFromTokens(Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		}), text, fmt);
		if (invalid) return DateTime.invalid(invalid);
		else return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
	}
	static fromString(text, fmt, opts = {}) {
		return DateTime.fromFormat(text, fmt, opts);
	}
	static fromSQL(text, opts = {}) {
		const [vals, parsedZone] = parseSQL(text);
		return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
	}
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidDateTimeError(invalid);
		else return new DateTime({ invalid });
	}
	static isDateTime(o) {
		return o && o.isLuxonDateTime || false;
	}
	static parseFormatForOpts(formatOpts, localeOpts = {}) {
		const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
		return !tokenList ? null : tokenList.map((t) => t ? t.val : null).join("");
	}
	static expandFormat(fmt, localeOpts = {}) {
		return expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts)).map((t) => t.val).join("");
	}
	static resetCache() {
		zoneOffsetTs = void 0;
		zoneOffsetGuessCache = {};
	}
	get(unit) {
		return this[unit];
	}
	get isValid() {
		return this.invalid === null;
	}
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	get locale() {
		return this.isValid ? this.loc.locale : null;
	}
	get numberingSystem() {
		return this.isValid ? this.loc.numberingSystem : null;
	}
	get outputCalendar() {
		return this.isValid ? this.loc.outputCalendar : null;
	}
	get zone() {
		return this._zone;
	}
	get zoneName() {
		return this.isValid ? this.zone.name : null;
	}
	get year() {
		return this.isValid ? this.c.year : NaN;
	}
	get quarter() {
		return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
	}
	get month() {
		return this.isValid ? this.c.month : NaN;
	}
	get day() {
		return this.isValid ? this.c.day : NaN;
	}
	get hour() {
		return this.isValid ? this.c.hour : NaN;
	}
	get minute() {
		return this.isValid ? this.c.minute : NaN;
	}
	get second() {
		return this.isValid ? this.c.second : NaN;
	}
	get millisecond() {
		return this.isValid ? this.c.millisecond : NaN;
	}
	get weekYear() {
		return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
	}
	get weekNumber() {
		return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
	}
	get weekday() {
		return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
	}
	get isWeekend() {
		return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
	}
	get localWeekday() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
	}
	get localWeekNumber() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
	}
	get localWeekYear() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
	}
	get ordinal() {
		return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
	}
	get monthShort() {
		return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
	}
	get monthLong() {
		return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
	}
	get weekdayShort() {
		return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
	}
	get weekdayLong() {
		return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
	}
	get offset() {
		return this.isValid ? +this.o : NaN;
	}
	get offsetNameShort() {
		if (this.isValid) return this.zone.offsetName(this.ts, {
			format: "short",
			locale: this.locale
		});
		else return null;
	}
	get offsetNameLong() {
		if (this.isValid) return this.zone.offsetName(this.ts, {
			format: "long",
			locale: this.locale
		});
		else return null;
	}
	get isOffsetFixed() {
		return this.isValid ? this.zone.isUniversal : null;
	}
	get isInDST() {
		if (this.isOffsetFixed) return false;
		else return this.offset > this.set({
			month: 1,
			day: 1
		}).offset || this.offset > this.set({ month: 5 }).offset;
	}
	getPossibleOffsets() {
		if (!this.isValid || this.isOffsetFixed) return [this];
		const dayMs = 864e5;
		const minuteMs = 6e4;
		const localTS = objToLocalTS(this.c);
		const oEarlier = this.zone.offset(localTS - dayMs);
		const oLater = this.zone.offset(localTS + dayMs);
		const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
		const o2 = this.zone.offset(localTS - oLater * minuteMs);
		if (o1 === o2) return [this];
		const ts1 = localTS - o1 * minuteMs;
		const ts2 = localTS - o2 * minuteMs;
		const c1 = tsToObj(ts1, o1);
		const c2 = tsToObj(ts2, o2);
		if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) return [clone(this, { ts: ts1 }), clone(this, { ts: ts2 })];
		return [this];
	}
	get isInLeapYear() {
		return isLeapYear(this.year);
	}
	get daysInMonth() {
		return daysInMonth(this.year, this.month);
	}
	get daysInYear() {
		return this.isValid ? daysInYear(this.year) : NaN;
	}
	get weeksInWeekYear() {
		return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
	}
	get weeksInLocalWeekYear() {
		return this.isValid ? weeksInWeekYear(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
	}
	resolvedLocaleOptions(opts = {}) {
		const { locale, numberingSystem, calendar } = Formatter.create(this.loc.clone(opts), opts).resolvedOptions(this);
		return {
			locale,
			numberingSystem,
			outputCalendar: calendar
		};
	}
	toUTC(offset$1 = 0, opts = {}) {
		return this.setZone(FixedOffsetZone.instance(offset$1), opts);
	}
	toLocal() {
		return this.setZone(Settings.defaultZone);
	}
	setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
		zone = normalizeZone(zone, Settings.defaultZone);
		if (zone.equals(this.zone)) return this;
		else if (!zone.isValid) return DateTime.invalid(unsupportedZone(zone));
		else {
			let newTS = this.ts;
			if (keepLocalTime || keepCalendarTime) {
				const offsetGuess = zone.offset(this.ts);
				const asObj = this.toObject();
				[newTS] = objToTS(asObj, offsetGuess, zone);
			}
			return clone(this, {
				ts: newTS,
				zone
			});
		}
	}
	reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
		const loc = this.loc.clone({
			locale,
			numberingSystem,
			outputCalendar
		});
		return clone(this, { loc });
	}
	setLocale(locale) {
		return this.reconfigure({ locale });
	}
	set(values) {
		if (!this.isValid) return this;
		const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
		const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
		const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
		if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
		if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
		let mixed;
		if (settingWeekStuff) mixed = weekToGregorian({
			...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek),
			...normalized
		}, minDaysInFirstWeek, startOfWeek);
		else if (!isUndefined(normalized.ordinal)) mixed = ordinalToGregorian({
			...gregorianToOrdinal(this.c),
			...normalized
		});
		else {
			mixed = {
				...this.toObject(),
				...normalized
			};
			if (isUndefined(normalized.day)) mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
		}
		const [ts$3, o] = objToTS(mixed, this.o, this.zone);
		return clone(this, {
			ts: ts$3,
			o
		});
	}
	plus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration);
		return clone(this, adjustTime(this, dur));
	}
	minus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration).negate();
		return clone(this, adjustTime(this, dur));
	}
	startOf(unit, { useLocaleWeeks = false } = {}) {
		if (!this.isValid) return this;
		const o = {}, normalizedUnit = Duration.normalizeUnit(unit);
		switch (normalizedUnit) {
			case "years": o.month = 1;
			case "quarters":
			case "months": o.day = 1;
			case "weeks":
			case "days": o.hour = 0;
			case "hours": o.minute = 0;
			case "minutes": o.second = 0;
			case "seconds":
				o.millisecond = 0;
				break;
			case "milliseconds": break;
		}
		if (normalizedUnit === "weeks") if (useLocaleWeeks) {
			const startOfWeek = this.loc.getStartOfWeek();
			const { weekday } = this;
			if (weekday < startOfWeek) o.weekNumber = this.weekNumber - 1;
			o.weekday = startOfWeek;
		} else o.weekday = 1;
		if (normalizedUnit === "quarters") o.month = (Math.ceil(this.month / 3) - 1) * 3 + 1;
		return this.set(o);
	}
	endOf(unit, opts) {
		return this.isValid ? this.plus({ [unit]: 1 }).startOf(unit, opts).minus(1) : this;
	}
	toFormat(fmt, opts = {}) {
		return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
	}
	toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
		return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
	}
	toLocaleParts(opts = {}) {
		return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
	}
	toISO({ format = "extended", suppressSeconds = false, suppressMilliseconds = false, includeOffset = true, extendedZone = false } = {}) {
		if (!this.isValid) return null;
		const ext = format === "extended";
		let c = toISODate(this, ext);
		c += "T";
		c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
		return c;
	}
	toISODate({ format = "extended" } = {}) {
		if (!this.isValid) return null;
		return toISODate(this, format === "extended");
	}
	toISOWeekDate() {
		return toTechFormat(this, "kkkk-'W'WW-c");
	}
	toISOTime({ suppressMilliseconds = false, suppressSeconds = false, includeOffset = true, includePrefix = false, extendedZone = false, format = "extended" } = {}) {
		if (!this.isValid) return null;
		return (includePrefix ? "T" : "") + toISOTime(this, format === "extended", suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
	}
	toRFC2822() {
		return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
	}
	toHTTP() {
		return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
	}
	toSQLDate() {
		if (!this.isValid) return null;
		return toISODate(this, true);
	}
	toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
		let fmt = "HH:mm:ss.SSS";
		if (includeZone || includeOffset) {
			if (includeOffsetSpace) fmt += " ";
			if (includeZone) fmt += "z";
			else if (includeOffset) fmt += "ZZ";
		}
		return toTechFormat(this, fmt, true);
	}
	toSQL(opts = {}) {
		if (!this.isValid) return null;
		return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
	}
	toString() {
		return this.isValid ? this.toISO() : INVALID;
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
		else return `DateTime { Invalid, reason: ${this.invalidReason} }`;
	}
	valueOf() {
		return this.toMillis();
	}
	toMillis() {
		return this.isValid ? this.ts : NaN;
	}
	toSeconds() {
		return this.isValid ? this.ts / 1e3 : NaN;
	}
	toUnixInteger() {
		return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
	}
	toJSON() {
		return this.toISO();
	}
	toBSON() {
		return this.toJSDate();
	}
	toObject(opts = {}) {
		if (!this.isValid) return {};
		const base = { ...this.c };
		if (opts.includeConfig) {
			base.outputCalendar = this.outputCalendar;
			base.numberingSystem = this.loc.numberingSystem;
			base.locale = this.loc.locale;
		}
		return base;
	}
	toJSDate() {
		return new Date(this.isValid ? this.ts : NaN);
	}
	diff(otherDateTime, unit = "milliseconds", opts = {}) {
		if (!this.isValid || !otherDateTime.isValid) return Duration.invalid("created by diffing an invalid DateTime");
		const durOpts = {
			locale: this.locale,
			numberingSystem: this.numberingSystem,
			...opts
		};
		const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), diffed = diff_default(otherIsLater ? this : otherDateTime, otherIsLater ? otherDateTime : this, units, durOpts);
		return otherIsLater ? diffed.negate() : diffed;
	}
	diffNow(unit = "milliseconds", opts = {}) {
		return this.diff(DateTime.now(), unit, opts);
	}
	until(otherDateTime) {
		return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
	}
	hasSame(otherDateTime, unit, opts) {
		if (!this.isValid) return false;
		const inputMs = otherDateTime.valueOf();
		const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
		return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
	}
	equals(other) {
		return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
	}
	toRelative(options = {}) {
		if (!this.isValid) return null;
		const base = options.base || DateTime.fromObject({}, { zone: this.zone }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
		let units = [
			"years",
			"months",
			"days",
			"hours",
			"minutes",
			"seconds"
		];
		let unit = options.unit;
		if (Array.isArray(options.unit)) {
			units = options.unit;
			unit = void 0;
		}
		return diffRelative(base, this.plus(padding), {
			...options,
			numeric: "always",
			units,
			unit
		});
	}
	toRelativeCalendar(options = {}) {
		if (!this.isValid) return null;
		return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
			...options,
			numeric: "auto",
			units: [
				"years",
				"months",
				"days"
			],
			calendary: true
		});
	}
	static min(...dateTimes) {
		if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("min requires all arguments be DateTimes");
		return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
	}
	static max(...dateTimes) {
		if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("max requires all arguments be DateTimes");
		return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
	}
	static fromFormatExplain(text, fmt, options = {}) {
		const { locale = null, numberingSystem = null } = options;
		return explainFromTokens(Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		}), text, fmt);
	}
	static fromStringExplain(text, fmt, options = {}) {
		return DateTime.fromFormatExplain(text, fmt, options);
	}
	static buildFormatParser(fmt, options = {}) {
		const { locale = null, numberingSystem = null } = options;
		return new TokenParser(Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		}), fmt);
	}
	static fromFormatParser(text, formatParser, opts = {}) {
		if (isUndefined(text) || isUndefined(formatParser)) throw new InvalidArgumentError("fromFormatParser requires an input string and a format parser");
		const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		});
		if (!localeToUse.equals(formatParser.locale)) throw new InvalidArgumentError(`fromFormatParser called with a locale of ${localeToUse}, but the format parser was created for ${formatParser.locale}`);
		const { result, zone, specificOffset, invalidReason } = formatParser.explainFromTokens(text);
		if (invalidReason) return DateTime.invalid(invalidReason);
		else return parseDataToDateTime(result, zone, opts, `format ${formatParser.format}`, text, specificOffset);
	}
	static get DATE_SHORT() {
		return DATE_SHORT;
	}
	static get DATE_MED() {
		return DATE_MED;
	}
	static get DATE_MED_WITH_WEEKDAY() {
		return DATE_MED_WITH_WEEKDAY;
	}
	static get DATE_FULL() {
		return DATE_FULL;
	}
	static get DATE_HUGE() {
		return DATE_HUGE;
	}
	static get TIME_SIMPLE() {
		return TIME_SIMPLE;
	}
	static get TIME_WITH_SECONDS() {
		return TIME_WITH_SECONDS;
	}
	static get TIME_WITH_SHORT_OFFSET() {
		return TIME_WITH_SHORT_OFFSET;
	}
	static get TIME_WITH_LONG_OFFSET() {
		return TIME_WITH_LONG_OFFSET;
	}
	static get TIME_24_SIMPLE() {
		return TIME_24_SIMPLE;
	}
	static get TIME_24_WITH_SECONDS() {
		return TIME_24_WITH_SECONDS;
	}
	static get TIME_24_WITH_SHORT_OFFSET() {
		return TIME_24_WITH_SHORT_OFFSET;
	}
	static get TIME_24_WITH_LONG_OFFSET() {
		return TIME_24_WITH_LONG_OFFSET;
	}
	static get DATETIME_SHORT() {
		return DATETIME_SHORT;
	}
	static get DATETIME_SHORT_WITH_SECONDS() {
		return DATETIME_SHORT_WITH_SECONDS;
	}
	static get DATETIME_MED() {
		return DATETIME_MED;
	}
	static get DATETIME_MED_WITH_SECONDS() {
		return DATETIME_MED_WITH_SECONDS;
	}
	static get DATETIME_MED_WITH_WEEKDAY() {
		return DATETIME_MED_WITH_WEEKDAY;
	}
	static get DATETIME_FULL() {
		return DATETIME_FULL;
	}
	static get DATETIME_FULL_WITH_SECONDS() {
		return DATETIME_FULL_WITH_SECONDS;
	}
	static get DATETIME_HUGE() {
		return DATETIME_HUGE;
	}
	static get DATETIME_HUGE_WITH_SECONDS() {
		return DATETIME_HUGE_WITH_SECONDS;
	}
};
function friendlyDateTime(dateTimeish) {
	if (DateTime.isDateTime(dateTimeish)) return dateTimeish;
	else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) return DateTime.fromJSDate(dateTimeish);
	else if (dateTimeish && typeof dateTimeish === "object") return DateTime.fromObject(dateTimeish);
	else throw new InvalidArgumentError(`Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`);
}
var R = ["aria-expanded", "aria-label"], W = { class: "text-xs font-medium" }, q = /* @__PURE__ */ createElementVNode("svg", {
	xmlns: "http://www.w3.org/2000/svg",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round",
	"stroke-linejoin": "round",
	class: "h-3.5 w-3.5"
}, [/* @__PURE__ */ createElementVNode("path", { d: "m6 9 6 6 6-6" })], -1), F = { class: "flex flex-col gap-1" }, G = ["onClick"], H = ["aria-label"], J = [/* @__PURE__ */ createElementVNode("circle", {
	cx: "12",
	cy: "12",
	r: "5"
}, null, -1), /* @__PURE__ */ createElementVNode("path", { d: "M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" }, null, -1)], X = [/* @__PURE__ */ createElementVNode("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }, null, -1)], te = {
	__name: "SThemeToggle",
	props: /* @__PURE__ */ mergeModels({
		size: {
			type: String,
			default: "md",
			validator: (t) => [
				"xs",
				"sm",
				"md",
				"lg"
			].includes(t)
		},
		showDropdown: {
			type: Boolean,
			default: !1
		}
	}, {
		modelValue: {
			type: String,
			required: !1
		},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		const _$1 = t, r = useModel(t, "modelValue"), C = getCurrentInstance(), b = ref(null), i = ref(!1), d = [
			{
				name: "print",
				label: "Print"
			},
			{
				name: "spruce",
				label: "Spruce"
			},
			{
				name: "citrine",
				label: "Citrine"
			},
			{
				name: "harbor",
				label: "Harbor"
			},
			{
				name: "obsidian",
				label: "Obsidian"
			},
			{
				name: "pixpax",
				label: "PixPax"
			},
			{
				name: "garnet",
				label: "Garnet"
			},
			{
				name: "prism",
				label: "Prism"
			},
			{
				name: "sunset",
				label: "Sunset"
			},
			{
				name: "aurora",
				label: "Aurora"
			}
		], c = computed(() => ({
			xs: {
				trigger: "h-8 w-8",
				icon: "h-3.5 w-3.5",
				menu: "min-w-28"
			},
			sm: {
				trigger: "h-9 w-9",
				icon: "h-4 w-4",
				menu: "min-w-32"
			},
			md: {
				trigger: "h-10 w-10",
				icon: "h-5 w-5",
				menu: "min-w-36"
			},
			lg: {
				trigger: "h-12 w-12",
				icon: "h-6 w-6",
				menu: "min-w-40"
			}
		})), w = ref(r.value || d[0]?.name || "print"), v$1 = ref(x$1());
		function x$1() {
			return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		}
		function k() {
			return typeof document > "u" ? "" : document.documentElement.getAttribute("data-theme") || "";
		}
		function T() {
			if (typeof document > "u") return "";
			const e = document.documentElement;
			return e.dataset.themePrefix ? e.dataset.themePrefix : k().match(/^(.*)-(light|dark)$/)?.[1] || "";
		}
		function S$1() {
			return typeof document > "u" ? "" : document.documentElement.dataset.themeStorageKey || "";
		}
		function z$1() {
			const e = k();
			return e.endsWith("-dark") ? "dark" : e.endsWith("-light") ? "light" : x$1();
		}
		v$1.value = z$1();
		function m() {
			const e = C?.vnode.props ?? {};
			return Object.prototype.hasOwnProperty.call(e, "modelValue") || Object.prototype.hasOwnProperty.call(e, "onUpdate:modelValue");
		}
		function P(e) {
			const o = S$1();
			if (!(!o || typeof window > "u")) try {
				window.localStorage.setItem(o, e);
			} catch {}
		}
		function O$1(e) {
			if (typeof document > "u") return;
			const o = T();
			o && document.documentElement.setAttribute("data-theme", `${o}-${e}`), P(e), v$1.value = e;
		}
		const g = computed(() => m() && (r.value === "dark" || r.value === "light") ? r.value : v$1.value), p = computed(() => m() && r.value ? r.value : w.value), y = computed(() => d.find((e) => e.name === p.value) || d[0]);
		function B$1() {
			const e = g.value === "dark" ? "light" : "dark";
			m() ? r.value = e : O$1(e);
		}
		function D$1() {
			i.value = !i.value;
		}
		function E$1(e) {
			m() ? r.value = e : w.value = e, i.value = !1;
		}
		return onClickOutside(b, () => {
			i.value = !1;
		}), (e, o) => _$1.showDropdown ? (openBlock(), createElementBlock("div", {
			key: 0,
			ref_key: "menuRef",
			ref: b,
			class: "relative inline-flex"
		}, [createElementVNode("button", {
			type: "button",
			class: normalizeClass(["inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-[var(--ui-fg)] transition hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]", c.value[t.size].trigger]),
			"aria-expanded": i.value ? "true" : "false",
			"aria-label": `Theme ${y.value?.label || "selector"}`,
			onClick: D$1
		}, [createElementVNode("span", W, toDisplayString(y.value?.label || "Theme"), 1), q], 10, R), i.value ? (openBlock(), createElementBlock("div", {
			key: 0,
			class: normalizeClass(["absolute right-0 top-[calc(100%+0.5rem)] z-[100] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-2 shadow-[var(--ui-shadow-md)]", c.value[t.size].menu])
		}, [createElementVNode("div", F, [(openBlock(), createElementBlock(Fragment, null, renderList(d, (a) => createElementVNode("button", {
			key: a.name,
			type: "button",
			class: normalizeClass(["rounded-lg px-3 py-2 text-left text-xs transition hover:bg-[var(--ui-surface-hover)]", {
				"bg-[var(--ui-surface)] text-[var(--ui-fg)]": p.value === a.name,
				"text-[var(--ui-fg-muted)]": p.value !== a.name
			}]),
			onClick: (Y$1) => E$1(a.name)
		}, toDisplayString(a.label), 11, G)), 64))])], 2)) : createCommentVNode("", !0)], 512)) : (openBlock(), createElementBlock("button", {
			key: 1,
			type: "button",
			class: normalizeClass(["inline-flex items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] transition hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]", c.value[t.size].trigger]),
			"aria-label": g.value === "dark" ? "Switch to light mode" : "Switch to dark mode",
			onClick: B$1
		}, [g.value === "light" ? (openBlock(), createElementBlock("svg", {
			key: 0,
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			class: normalizeClass(c.value[t.size].icon)
		}, J, 2)) : (openBlock(), createElementBlock("svg", {
			key: 1,
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			class: normalizeClass(c.value[t.size].icon)
		}, X, 2))], 10, H));
	}
};
String;
var de = (e) => (pushScopeId("data-v-f30c5384"), e = e(), popScopeId(), e), Be = {
	key: 0,
	class: "absolute inset-0 grid place-items-center"
}, Ve = [/* @__PURE__ */ de(() => /* @__PURE__ */ createElementVNode("svg", {
	class: "animate-spin h-4 w-4",
	viewBox: "0 0 24 24",
	fill: "none",
	"aria-hidden": "true"
}, [/* @__PURE__ */ createElementVNode("circle", {
	class: "opacity-25",
	cx: "12",
	cy: "12",
	r: "10",
	stroke: "currentColor",
	"stroke-width": "4"
}), /* @__PURE__ */ createElementVNode("path", {
	class: "opacity-75",
	fill: "currentColor",
	d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
})], -1)), /* @__PURE__ */ de(() => /* @__PURE__ */ createElementVNode("span", { class: "sr-only" }, "Loading", -1))], ce = /* @__PURE__ */ Ps({
	__name: "SButton",
	props: {
		to: String,
		href: String,
		external: Boolean,
		variant: {
			type: String,
			default: "primary",
			validator: (e) => [
				"primary",
				"secondary",
				"accent",
				"outline",
				"ghost",
				"link",
				"success",
				"warning",
				"error"
			].includes(e)
		},
		size: {
			type: String,
			default: "md",
			validator: (e) => [
				"micro",
				"xs",
				"sm",
				"md",
				"lg",
				"xl"
			].includes(e)
		},
		loading: Boolean,
		disabled: Boolean,
		fullWidth: Boolean,
		icon: Boolean,
		ariaLabel: String,
		ariaDescribedBy: String
	},
	emits: ["click"],
	setup(e, { emit: o }) {
		const t = e, a = o, n$1 = computed(() => {
			return t.icon ? {
				micro: "w-6 h-6 text-[11px] p-0",
				xs: "w-7 h-7 text-xs p-0",
				sm: "w-8 h-8 text-sm p-0",
				md: "w-10 h-10 text-sm p-0",
				lg: "w-11 h-11 text-base p-0",
				xl: "w-12 h-12 text-lg p-0"
			}[t.size] : {
				micro: "text-[11px] px-2 py-1",
				xs: "text-xs px-2.5 py-1.5",
				sm: "text-sm px-3 py-1.5",
				md: "text-sm px-4 py-2",
				lg: "text-base px-5 py-2.5",
				xl: "text-lg px-6 py-3"
			}[t.size];
		}), d = computed(() => [
			"btn-base inline-flex items-center justify-center gap-2 font-medium select-none",
			"whitespace-nowrap align-middle self-center h-auto",
			"transition-colors duration-200 focus-visible:outline-none",
			"disabled:opacity-60 disabled:cursor-not-allowed"
		].join(" ")), l$1 = computed(() => {
			const m = [d.value, n$1.value];
			return t.fullWidth && !t.icon && m.push("w-full"), t.icon && m.push("aspect-square !px-0 !py-0"), t.loading && m.push("relative"), m.join(" ");
		}), u = computed(() => t.to ? "RouterLink" : t.href ? "a" : "button"), b = computed(() => {
			const m = {
				class: l$1.value,
				disabled: t.disabled || t.loading,
				"aria-busy": t.loading || void 0,
				"aria-disabled": t.disabled || t.loading || void 0,
				"aria-label": t.ariaLabel,
				"aria-describedby": t.ariaDescribedBy,
				"data-variant": t.variant,
				"data-size": t.size
			};
			return t.to ? {
				...m,
				to: t.to
			} : t.href ? {
				...m,
				href: t.href,
				target: t.external ? "_blank" : void 0,
				rel: t.external ? "noopener noreferrer" : void 0,
				role: "button"
			} : {
				...m,
				type: "button"
			};
		}), p = (m) => {
			if (t.disabled || t.loading) {
				m.preventDefault();
				return;
			}
			a("click", m);
		};
		return (m, k) => (openBlock(), createBlock(resolveDynamicComponent(u.value), mergeProps(b.value, { onClick: p }), {
			default: withCtx(() => [e.loading ? (openBlock(), createElementBlock("span", Be, Ve)) : createCommentVNode("", !0), createElementVNode("span", { class: normalizeClass(e.loading ? "opacity-0" : "") }, [renderSlot(m.$slots, "default", {}, void 0, !0)], 2)]),
			_: 3
		}, 16));
	}
}, [["__scopeId", "data-v-f30c5384"]]);
String, String, Boolean, String, String, Boolean, Boolean, Boolean, Boolean;
String, String;
var De = ["innerHTML"], We = { class: "truncate relative z-10 text-sm" }, Ae = {
	key: 1,
	class: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
}, Ee = /* @__PURE__ */ Ps({
	__name: "STabs",
	props: {
		items: {
			type: Array,
			required: !0
		},
		path: {
			type: String,
			required: !0
		},
		exact: {
			type: Boolean,
			default: !1
		},
		type: {
			type: String,
			default: "underline",
			validator: (e) => [
				"underline",
				"pills",
				"bordered",
				"segmented",
				"stripe"
			].includes(e)
		},
		size: {
			type: String,
			default: "micro",
			validator: (e) => [
				"nano",
				"micro",
				"tiny",
				"small",
				"medium",
				"sm",
				"md",
				"lg"
			].includes(e)
		},
		sticky: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		const o = e;
		function t(u) {
			return new RegExp(`${u.path}*`, "g").test(o.path);
		}
		function a(u) {
			return new RegExp(`^${u.path}$`, "g").test(o.path);
		}
		const n$1 = computed(() => ({
			nano: "text-xs px-3 py-1.5",
			micro: "text-sm px-4 py-2",
			tiny: "text-sm px-5 py-2.5",
			small: "text-base px-6 py-3",
			medium: "text-lg px-7 py-3.5",
			sm: "text-sm px-4 py-2",
			md: "text-base px-5 py-2.5",
			lg: "text-lg px-6 py-3"
		})), d = computed(() => ({
			underline: "relative transition-all duration-200 ease-out hover:text-base-content/80",
			pills: "rounded-lg hover:bg-base-200/60 transition-all duration-200 ease-out border border-transparent hover:border-base-300/40",
			bordered: "border border-base-300/40 hover:border-base-300/60 hover:bg-base-50/50 transition-all duration-200 ease-out rounded-lg",
			segmented: "first:rounded-l-lg last:rounded-r-lg border-r border-base-300/30 last:border-r-0 hover:bg-base-100/80 transition-all duration-200 ease-out relative",
			stripe: "relative text-base-content/60 hover:text-base-content"
		})), l$1 = computed(() => ({
			underline: "text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-secondary after:rounded-full",
			pills: "bg-primary/10 text-primary font-medium border-primary/30 shadow-sm",
			bordered: "border-primary/50 bg-primary/5 text-primary font-medium shadow-sm",
			segmented: "bg-base-100 text-primary font-medium shadow-sm z-10",
			stripe: "text-base-content font-semibold relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-secondary"
		}));
		return (u, b) => {
			const p = resolveComponent("RouterLink");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["relative", {
				"sticky top-0 z-40 bg-base-100/95 border-b border-base-300/40": e.sticky,
				"border-b border-base-300/20": e.type === "stripe"
			}]) }, [createElementVNode("nav", {
				role: "tablist",
				class: normalizeClass(["flex relative", {
					"space-x-1": e.type === "pills",
					"space-x-0": e.type !== "pills",
					"bg-gradient-to-r from-base-200/60 to-base-300/40 rounded-2xl p-1.5 border border-base-300/30": e.type === "segmented"
				}])
			}, [(openBlock(!0), createElementBlock(Fragment, null, renderList(e.items, (m) => (openBlock(), createBlock(p, {
				key: `tab-${m.path}`,
				to: m.path,
				role: "tab",
				class: normalizeClass(["relative flex items-center gap-2 font-medium focus:outline-none group text-base-content/70 flex-1 justify-center", [
					n$1.value[e.size],
					d.value[e.type],
					{ [l$1.value[e.type]]: !e.exact && t(m) || e.exact && a(m) }
				]])
			}, {
				default: withCtx(() => [
					m.icon ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "w-4 h-4 flex-shrink-0",
						innerHTML: m.icon
					}, null, 8, De)) : createCommentVNode("", !0),
					createElementVNode("span", We, toDisplayString(m.title), 1),
					m.badge ? (openBlock(), createElementBlock("span", Ae, toDisplayString(m.badge), 1)) : createCommentVNode("", !0)
				]),
				_: 2
			}, 1032, ["to", "class"]))), 128))], 2)], 2);
		};
	}
}, [["__scopeId", "data-v-7e72dbdf"]]), S = {
	gray: {
		25: "#fcfcfd",
		50: "#f9fafb",
		100: "#f2f4f7",
		200: "#e4e7ec",
		300: "#d0d5dd",
		400: "#98a2b3",
		500: "#667085",
		600: "#475467",
		700: "#344054",
		800: "#1d2939",
		900: "#101828",
		950: "#0c111d"
	},
	primary: {
		50: "#f0f0ff",
		100: "#e0e0ff",
		200: "#c7c7ff",
		300: "#a5a5ff",
		400: "#8080ff",
		500: "#635bff",
		600: "#5b52ff",
		700: "#4f46e5",
		800: "#4338ca",
		900: "#3730a3",
		950: "#1e1b4b"
	},
	success: {
		50: "#f0fdf4",
		100: "#dcfce7",
		200: "#bbf7d0",
		300: "#86efac",
		400: "#4ade80",
		500: "#00d924",
		600: "#00c221",
		700: "#00a01c",
		800: "#008018",
		900: "#006613"
	},
	warning: {
		50: "#fefaf0",
		100: "#fef3c7",
		200: "#fed7aa",
		300: "#fdba74",
		400: "#fb923c",
		500: "#f5a623",
		600: "#ea580c",
		700: "#c2410c",
		800: "#9a3412",
		900: "#7c2d12"
	},
	error: {
		50: "#fef2f2",
		100: "#fee2e2",
		200: "#fecaca",
		300: "#fca5a5",
		400: "#f87171",
		500: "#e25950",
		600: "#dc2626",
		700: "#b91c1c",
		800: "#991b1b",
		900: "#7f1d1d"
	},
	info: {
		50: "#eff6ff",
		100: "#dbeafe",
		200: "#bfdbfe",
		300: "#93c5fd",
		400: "#60a5fa",
		500: "#0073e6",
		600: "#0066cc",
		700: "#1d4ed8",
		800: "#1e40af",
		900: "#1e3a8a"
	}
}, qe = {
	button: {
		base: {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			fontWeight: "500",
			transition: "color 180ms ease, background-color 180ms ease, box-shadow 180ms ease",
			borderRadius: "0.75rem",
			border: "1px solid transparent",
			cursor: "pointer",
			outline: "none",
			position: "relative",
			overflow: "hidden"
		},
		sizes: {
			xs: {
				height: "1.75rem",
				padding: "0 0.6rem",
				fontSize: "0.75rem",
				gap: "0.25rem"
			},
			sm: {
				height: "2rem",
				padding: "0 0.85rem",
				fontSize: "0.8125rem",
				gap: "0.35rem"
			},
			base: {
				height: "2.5rem",
				padding: "0 1rem",
				fontSize: "0.875rem",
				gap: "0.5rem"
			},
			lg: {
				height: "2.75rem",
				padding: "0 1.15rem",
				fontSize: "0.9375rem",
				gap: "0.45rem"
			},
			xl: {
				height: "3rem",
				padding: "0 1.35rem",
				fontSize: "1rem",
				gap: "0.6rem"
			}
		},
		variants: {
			primary: {
				backgroundColor: S.primary[500],
				color: "white",
				hover: {
					backgroundColor: S.primary[600],
					boxShadow: "0 6px 18px rgba(99, 91, 255, 0.18)"
				},
				focus: { boxShadow: "0 0 0 3px rgba(99, 91, 255, 0.2)" }
			},
			secondary: {
				backgroundColor: S.gray[100],
				color: S.gray[800],
				border: `1px solid ${S.gray[300]}`,
				hover: {
					backgroundColor: S.gray[200],
					borderColor: S.gray[400],
					boxShadow: "0 8px 20px rgba(52, 64, 84, 0.08)"
				}
			},
			outline: {
				backgroundColor: "transparent",
				color: S.primary[600],
				border: `1px solid ${S.primary[300]}`,
				hover: {
					backgroundColor: S.primary[50],
					borderColor: S.primary[400],
					boxShadow: "0 0 0 1px rgba(99, 91, 255, 0.25)"
				}
			},
			ghost: {
				backgroundColor: "transparent",
				color: S.gray[700],
				hover: { backgroundColor: S.gray[100] }
			}
		}
	},
	card: {
		base: {
			backgroundColor: "white",
			borderRadius: "0.75rem",
			border: `1px solid ${S.gray[200]}`,
			boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
			transition: "all 200ms ease-out"
		},
		variants: {
			default: {},
			elevated: {
				boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
				hover: {
					boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
					transform: "translateY(-2px)"
				}
			},
			interactive: {
				cursor: "pointer",
				hover: {
					borderColor: S.primary[300],
					boxShadow: "0 4px 12px rgba(99, 91, 255, 0.15)"
				}
			}
		}
	},
	input: {
		base: {
			width: "100%",
			padding: "0.5rem 0.75rem",
			backgroundColor: "white",
			border: `1px solid ${S.gray[300]}`,
			borderRadius: "0.5rem",
			fontSize: "0.875rem",
			transition: "all 200ms ease-out",
			outline: "none"
		},
		states: {
			focus: {
				borderColor: S.primary[500],
				boxShadow: "0 0 0 3px rgba(99, 91, 255, 0.1)"
			},
			error: {
				borderColor: S.error[500],
				boxShadow: "0 0 0 3px rgba(226, 89, 80, 0.1)"
			},
			disabled: {
				backgroundColor: S.gray[50],
				color: S.gray[400],
				cursor: "not-allowed"
			}
		}
	}
}, Je = {
	colors: { ...S },
	spacing: {
		px: "1px",
		0: "0",
		.5: "2px",
		1: "4px",
		1.5: "6px",
		2: "8px",
		2.5: "10px",
		3: "12px",
		3.5: "14px",
		4: "16px",
		5: "20px",
		6: "24px",
		7: "28px",
		8: "32px",
		9: "36px",
		10: "40px",
		11: "44px",
		12: "48px",
		14: "56px",
		16: "64px",
		20: "80px",
		24: "96px",
		28: "112px",
		32: "128px",
		36: "144px",
		40: "160px",
		44: "176px",
		48: "192px",
		52: "208px",
		56: "224px",
		60: "240px",
		64: "256px",
		72: "288px",
		80: "320px",
		96: "384px"
	},
	typography: {
		fontSize: {
			xs: ["12px", "16px"],
			sm: ["14px", "20px"],
			base: ["16px", "24px"],
			lg: ["18px", "28px"],
			xl: ["20px", "28px"],
			"2xl": ["24px", "32px"],
			"3xl": ["30px", "36px"],
			"4xl": ["36px", "40px"],
			"5xl": ["48px", "56px"],
			"6xl": ["60px", "72px"],
			"7xl": ["72px", "80px"],
			"8xl": ["96px", "104px"],
			"9xl": ["128px", "136px"]
		},
		fontWeight: {
			thin: "100",
			extralight: "200",
			light: "300",
			normal: "400",
			medium: "500",
			semibold: "600",
			bold: "700",
			extrabold: "800",
			black: "900"
		},
		fontFamily: {
			sans: [
				"Inter",
				"-apple-system",
				"BlinkMacSystemFont",
				"\"Segoe UI\"",
				"Roboto",
				"\"Helvetica Neue\"",
				"Arial",
				"sans-serif"
			],
			mono: [
				"\"JetBrains Mono\"",
				"\"Fira Code\"",
				"Consolas",
				"\"SF Mono\"",
				"Monaco",
				"monospace"
			]
		},
		letterSpacing: {
			tighter: "-0.05em",
			tight: "-0.025em",
			normal: "0em",
			wide: "0.025em",
			wider: "0.05em",
			widest: "0.1em"
		}
	},
	borderRadius: {
		none: "0",
		xs: "2px",
		sm: "4px",
		base: "6px",
		md: "8px",
		lg: "12px",
		xl: "16px",
		"2xl": "20px",
		"3xl": "24px",
		full: "9999px"
	},
	shadow: {
		xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
		sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
		base: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
		md: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
		lg: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
		xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
		"2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
		inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
		primary: "0 4px 14px 0 rgb(99 91 255 / 0.15)",
		success: "0 4px 14px 0 rgb(0 217 36 / 0.15)",
		warning: "0 4px 14px 0 rgb(255 167 38 / 0.15)",
		error: "0 4px 14px 0 rgb(226 89 80 / 0.15)"
	},
	transition: {
		duration: {
			fastest: "75ms",
			fast: "150ms",
			base: "200ms",
			medium: "300ms",
			slow: "500ms",
			slowest: "1000ms"
		},
		easing: {
			linear: "linear",
			out: "cubic-bezier(0, 0, 0.2, 1)",
			in: "cubic-bezier(0.4, 0, 1, 1)",
			"in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
			smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
			bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
			elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
		}
	},
	zIndex: {
		hide: -1,
		auto: "auto",
		base: 0,
		docked: 10,
		dropdown: 1e3,
		sticky: 1100,
		banner: 1200,
		overlay: 1300,
		modal: 1400,
		popover: 1500,
		skipLink: 1600,
		toast: 1700,
		tooltip: 1800
	},
	size: {
		button: {
			micro: {
				height: "28px",
				padding: "0 10px",
				fontSize: "12px"
			},
			xs: {
				height: "32px",
				padding: "0 12px",
				fontSize: "12px"
			},
			sm: {
				height: "36px",
				padding: "0 14px",
				fontSize: "13px"
			},
			base: {
				height: "40px",
				padding: "0 16px",
				fontSize: "14px"
			},
			lg: {
				height: "44px",
				padding: "0 18px",
				fontSize: "15px"
			},
			xl: {
				height: "48px",
				padding: "0 20px",
				fontSize: "16px"
			}
		},
		input: {
			sm: {
				height: "32px",
				padding: "0 8px",
				fontSize: "sm"
			},
			base: {
				height: "40px",
				padding: "0 12px",
				fontSize: "base"
			},
			lg: {
				height: "48px",
				padding: "0 16px",
				fontSize: "lg"
			}
		},
		avatar: {
			xs: "20px",
			sm: "24px",
			base: "32px",
			lg: "40px",
			xl: "48px",
			"2xl": "56px",
			"3xl": "64px"
		}
	},
	layout: {
		maxWidth: {
			xs: "320px",
			sm: "384px",
			md: "448px",
			lg: "512px",
			xl: "576px",
			"2xl": "672px",
			"3xl": "768px",
			"4xl": "896px",
			"5xl": "1024px",
			"6xl": "1152px",
			"7xl": "1280px",
			full: "100%"
		},
		container: {
			padding: "16px",
			maxWidth: "1200px"
		},
		sidebar: {
			width: "240px",
			collapsedWidth: "64px"
		},
		header: { height: "64px" }
	}
}, { colors: Io, spacing: Ro, typography: Ho, borderRadius: To, shadow: Do, transition: Wo, zIndex: Ao, size: Po, layout: Eo } = Je, Ke = {
	"--ui-bg": "App background (paper).",
	"--ui-fg": "Primary text (ink).",
	"--ui-fg-muted": "Muted text.",
	"--ui-surface": "Raised surface background.",
	"--ui-surface-hover": "Hover surface background.",
	"--ui-border": "Dividers and hairlines.",
	"--ui-primary": "Primary action/brand color.",
	"--ui-on-primary": "Text/icon on primary.",
	"--ui-primary-muted": "Primary tint for subtle fills.",
	"--ui-primary-hover": "Primary hover fill.",
	"--ui-primary-active": "Primary active fill.",
	"--ui-accent": "Accent/attention color.",
	"--ui-on-accent": "Text/icon on accent.",
	"--ui-accent-muted": "Accent tint for subtle fills.",
	"--ui-accent-hover": "Accent hover fill.",
	"--ui-accent-active": "Accent active fill.",
	"--ui-secondary": "Secondary action color.",
	"--ui-on-secondary": "Text/icon on secondary.",
	"--ui-secondary-muted": "Secondary tint for subtle fills.",
	"--ui-secondary-hover": "Secondary hover fill.",
	"--ui-secondary-active": "Secondary active fill.",
	"--ui-critical": "Critical/danger tone.",
	"--ui-on-critical": "Text/icon on critical.",
	"--ui-critical-muted": "Critical tint for subtle fills.",
	"--ui-critical-hover": "Critical hover fill.",
	"--ui-critical-active": "Critical active fill.",
	"--ui-success": "Success/positive tone.",
	"--ui-on-success": "Text/icon on success.",
	"--ui-success-muted": "Success tint for subtle fills.",
	"--ui-success-hover": "Success hover fill.",
	"--ui-success-active": "Success active fill.",
	"--ui-warning": "Warning tone.",
	"--ui-on-warning": "Text/icon on warning.",
	"--ui-warning-muted": "Warning tint for subtle fills.",
	"--ui-warning-hover": "Warning hover fill.",
	"--ui-warning-active": "Warning active fill.",
	"--ui-info": "Info tone.",
	"--ui-on-info": "Text/icon on info.",
	"--ui-info-muted": "Info tint for subtle fills.",
	"--ui-info-hover": "Info hover fill.",
	"--ui-info-active": "Info active fill.",
	"--ui-danger": "Alias of --ui-critical for app configs.",
	"--ui-on-danger": "Alias of --ui-on-critical for app configs.",
	"--ui-danger-muted": "Alias of --ui-critical-muted for app configs.",
	"--ui-danger-hover": "Alias of --ui-critical-hover for app configs.",
	"--ui-danger-active": "Alias of --ui-critical-active for app configs.",
	"--ui-tonal-secondary": "Subtle neutral fill.",
	"--ui-tonal-secondary-hover": "Subtle neutral hover fill.",
	"--ui-tonal-tertiary": "Extra light neutral fill.",
	"--ui-tonal-tertiary-hover": "Extra light neutral hover fill.",
	"--ui-ring": "Focus ring color.",
	"--ui-glow-primary": "Primary glow shadow.",
	"--ui-glow-accent": "Accent glow shadow.",
	"--ui-glow-critical": "Critical glow shadow.",
	"--ui-glow-success": "Success glow shadow.",
	"--ui-logo-start": "Logo gradient start color.",
	"--ui-logo-end": "Logo gradient end color.",
	"--ui-logo-cutout": "Logo interior cutout fill.",
	"--ui-radius-sm": "Small radius.",
	"--ui-radius-md": "Medium radius.",
	"--ui-radius-lg": "Large radius.",
	"--ui-duration-fast": "Fast transition duration.",
	"--ui-duration-normal": "Default transition duration.",
	"--ui-duration-slow": "Slow transition duration.",
	"--ui-ease-out": "Default easing curve.",
	"--ui-shadow-sm": "Small elevation shadow.",
	"--ui-shadow-md": "Medium elevation shadow.",
	"--ui-lift-hover": "Hover translate offset.",
	"--ui-scale-active": "Active press scale."
};
String, String, Boolean;
String, Array, String, Boolean;
String, String, String, Number, Boolean;
String, String, String, Boolean;
String;
String, String, String, String, String;
Array, String;
String, String, String, String, Boolean, Boolean;
String, Number, String, String, String, String, String, String, String, Boolean, Boolean, Boolean, String, String;
Boolean, Boolean, Boolean;
String, String, Boolean, String;
Array, String, String;
String, String, Boolean, Boolean, Boolean, String, String, Boolean;
Boolean, Boolean, Boolean;
var ue = {
	__name: "SResizer",
	props: /* @__PURE__ */ mergeModels({
		container: {
			type: Object,
			default: null
		},
		size: {
			type: String,
			default: "default",
			validator: (e) => ["default"].includes(e)
		},
		direction: {
			type: String,
			default: "vertical",
			validator: (e) => ["vertical", "horizontal"].includes(e)
		},
		type: {
			type: String,
			default: "primary",
			validator: (e) => [
				"primary",
				"secondary",
				"accent"
			].includes(e)
		}
	}, {
		position: {
			type: Number,
			default: 0
		},
		positionModifiers: {},
		dragging: {
			type: Boolean,
			default: !1
		},
		draggingModifiers: {}
	}),
	emits: /* @__PURE__ */ mergeModels(["dragStart", "dragEnd"], ["update:position", "update:dragging"]),
	setup(e, { emit: o }) {
		const t = e, a = o, n$1 = useModel(e, "position"), d = useModel(e, "dragging"), l$1 = shallowRef(null), u = shallowRef(null), { width: b, height: p } = useElementBounding(l$1), { width: m, height: k } = useElementBounding(u), { left: M$1, right: B$1, top: v$1, height: _$1 } = useElementBounding(computed(() => t.container)), z$1 = computed(() => (b.value - m.value) / 2), V = computed(() => (p.value - k.value) / 2), { isDragging: x$1 } = useDraggable(l$1, {
			onStart: () => a("dragStart"),
			onEnd: () => a("dragEnd"),
			onMove({ x: I, y: A$1 }) {
				if (t.container && (t.direction === "vertical" && (I > B$1.value - (z$1.value + m.value) ? n$1.value = B$1.value - M$1.value - m.value : I < M$1.value - z$1.value ? n$1.value = m.value * -1 : n$1.value = I - M$1.value + z$1.value), t.direction === "horizontal")) {
					const P = _$1.value - (A$1 - v$1.value);
					if (P < 0) {
						n$1.value = 0;
						return;
					}
					if (P > _$1.value) {
						n$1.value = _$1.value - V.value / 2;
						return;
					}
					n$1.value = _$1.value - (A$1 - v$1.value + V.value);
				}
			}
		});
		return watch(x$1, (I) => {
			d.value = I;
		}), (I, A$1) => (openBlock(), createElementBlock("div", {
			ref_key: "resizeHandle",
			ref: l$1,
			class: normalizeClass(["absolute z-[9999999] group h-6 translate-y-1/2", {
				"opacity-100": unref(x$1),
				"-left-4 top-0 cursor-ew-resize px-4 h-full": e.direction === "vertical",
				"left-0 -top-5 cursor-ns-resize w-full": e.direction === "horizontal"
			}])
		}, [createElementVNode("button", {
			ref_key: "resizeHandleBtn",
			ref: u,
			type: "button",
			"aria-label": "Drag to resize",
			class: normalizeClass([{
				"opacity-100": unref(x$1),
				"!w-1": unref(x$1) && e.direction === "vertical",
				"!h-1": unref(x$1) && e.direction === "horizontal",
				"w-0.5": e.size === "default" && e.direction === "vertical",
				"h-0.5": e.size === "default" && e.direction === "horizontal",
				"group-hover:w-1 cursor-ew-resize h-full": e.direction === "vertical",
				"group-hover:h-1 cursor-ns-resize w-full": e.direction === "horizontal",
				"group-hover:bg-blue-400": e.type === "primary",
				"bg-blue-200": e.type === "primary" && unref(x$1),
				"bg-green-200": e.type === "secondary" && unref(x$1),
				"bg-indigo-200": e.type === "accent" && unref(x$1)
			}, "z-50 opacity-100 transition-all group-hover:opacity-50 duration-300"])
		}, null, 2)], 2));
	}
};
String, Object, String, Boolean;
Boolean;
String;
String, String, String;
String, Array, String, String, String, String;
String, String, Boolean, String, String, String, String, Number, Boolean, Boolean;
Boolean, String, String, String, Boolean, Boolean;
String, Boolean, Number, Boolean, String, String, String, File, Array, String;
Boolean, Boolean, Boolean;
Number, Number, String, String, Number, Number;
String, String, Boolean;
export { Wn as $, Fo$2 as A, on$1 as At, No$1 as B, wo$1 as Bt, An$1 as C, ko$1 as Ct, Co as D, ms$1 as Dt, Bo as E, mo$1 as Et, Jo$2 as F, rs$2 as Ft, Ps as G, O as H, xr$1 as Ht, K as I, ss$2 as It, Te$1 as J, Se as K, M as L, ts$2 as Lt, Gr as M, ps$1 as Mt, Ho$1 as N, qe$1 as Nt, Cs as O, ne as Ot, Jn as P, qo$1 as Pt, Vn as Q, Mo$1 as R, ur$1 as Rt, $o as S, kn$1 as St, As as T, ls$1 as Tt, Os as U, xs$1 as Ut, Ns as V, ws as Vt, Po$2 as W, zr$1 as Wt, Ts as X, To$1 as Y, Uo$1 as Z, rs$1 as _, ir$1 as _t, qe as a, an$1 as at, wt$1 as b, jo$1 as bt, Cn as c, bs$1 as ct, Is as d, es$2 as dt, Wo$1 as et, Jo$1 as f, go as ft, ht$1 as g, hs$1 as gt, br as h, ho$1 as ht, ce as i, _o$1 as it, Go$1 as j, os$1 as jt, Do$2 as k, ns$2 as kt, Cr as l, ce$1 as lt, as$2 as m, gs$2 as mt, Je as n, Zo$2 as nt, ue as o, as$1 as ot, Yo$1 as p, gr$1 as pt, Ss as q, Ke as r, _ as rt, te as s, bn as st, Ee as t, Yo$2 as tt, Es as u, ds$1 as ut, ss$1 as v, is$2 as vt, Ao$2 as w, lr$1 as wt, $n as x, jr$1 as xt, ws$1 as y, it$1 as yt, Ms as z, vs$1 as zt };
