import { n as createOtpAuthUri, t as useAppApi } from "./api-Er-7VpRh.js";
import "./src-De70Jo1T.js";
import { $ as Wn, A as Fo, At as on, B as No, Bt as wo, C as An, Ct as ko, D as Co, Dt as ms, E as Bo, Et as mo, F as Jo, Ft as rs, G as Ps, H as O, Ht as xr, I as K, It as ss, J as Te, K as Se, L as M, Lt as ts, M as Gr, Mt as ps, N as Ho, Nt as qe, O as Cs, Ot as ne, P as Jn, Pt as qo, Q as Vn, R as Mo, Rt as ur, S as $o, St as kn, T as As, Tt as ls, U as Os, Ut as xs, V as Ns, Vt as ws, W as Po, Wt as zr, X as Ts, Y as To, Z as Uo, _ as rs$1, _t as ir, at as an, b as wt, bt as jo, c as Cn, ct as bs, d as Is, dt as es, et as Wo, f as Jo$1, ft as go, g as ht, gt as hs, h as br, ht as ho, i as ce, it as _o, j as Go, jt as os, k as Do, kt as ns, l as Cr, lt as ce$1, m as as, mt as gs$1, nt as Zo, o as ue, ot as as$2, p as Yo$1, pt as gr, q as Ss, rt as _, st as bn, tt as Yo, u as Es, ut as ds, v as ss$1, vt as is, w as Ao, wt as lr, x as $n, xt as jr, y as ws$1, yt as it, z as Ms, zt as vs } from "./components-B23YkRY5.js";
import { Fragment, Transition, computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, createTextVNode, createVNode, defineAsyncComponent, defineComponent, getCurrentInstance, guardReactiveProps, isRef, mergeDefaults, mergeModels, mergeProps, nextTick, normalizeClass, normalizeProps, onBeforeUnmount, onMounted, openBlock, ref, renderList, renderSlot, resolveComponent, resolveDynamicComponent, shallowRef, toDisplayString, toRefs, toValue, unref, useAttrs, useId, useModel, useSSRContext, useSlots, watch, withCtx, withModifiers } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ssrInterpolate, ssrRenderAttr, ssrRenderAttrs, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderSlot } from "vue/server-renderer";
import { breakpointsTailwind, onClickOutside, useBreakpoints, useLocalStorage, useWindowSize } from "@vueuse/core";
var LOW = [0, 1];
var MEDIUM = [1, 0];
var QUARTILE = [2, 3];
var HIGH = [3, 2];
var EccMap = {
	L: LOW,
	M: MEDIUM,
	Q: QUARTILE,
	H: HIGH
};
var NUMERIC_REGEX = /^[0-9]*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var MIN_VERSION = 1;
var MAX_VERSION = 40;
var PENALTY_N1 = 3;
var PENALTY_N2 = 3;
var PENALTY_N3 = 40;
var PENALTY_N4 = 10;
var DEFAULT_QR_ERROR_CORRECTION = "M";
var DEFAULT_QR_QUIET_ZONE_MODULES = 4;
var DEFAULT_QR_PIXEL_SIZE = 8;
var ECC_CODEWORDS_PER_BLOCK = [
	[
		-1,
		7,
		10,
		15,
		20,
		26,
		18,
		20,
		24,
		30,
		18,
		20,
		24,
		26,
		30,
		22,
		24,
		28,
		30,
		28,
		28,
		28,
		28,
		30,
		30,
		26,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		10,
		16,
		26,
		18,
		24,
		16,
		18,
		22,
		22,
		26,
		30,
		22,
		22,
		24,
		24,
		28,
		28,
		26,
		26,
		26,
		26,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28
	],
	[
		-1,
		13,
		22,
		18,
		26,
		18,
		24,
		18,
		22,
		20,
		24,
		28,
		26,
		24,
		20,
		30,
		24,
		28,
		28,
		26,
		30,
		28,
		30,
		30,
		30,
		30,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		17,
		28,
		22,
		16,
		22,
		28,
		26,
		26,
		24,
		28,
		24,
		28,
		22,
		24,
		24,
		30,
		28,
		28,
		26,
		28,
		30,
		24,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	]
];
var NUM_ERROR_CORRECTION_BLOCKS = [
	[
		-1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		4,
		4,
		4,
		4,
		4,
		6,
		6,
		6,
		6,
		7,
		8,
		8,
		9,
		9,
		10,
		12,
		12,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		19,
		20,
		21,
		22,
		24,
		25
	],
	[
		-1,
		1,
		1,
		1,
		2,
		2,
		4,
		4,
		4,
		5,
		5,
		5,
		8,
		9,
		9,
		10,
		10,
		11,
		13,
		14,
		16,
		17,
		17,
		18,
		20,
		21,
		23,
		25,
		26,
		28,
		29,
		31,
		33,
		35,
		37,
		38,
		40,
		43,
		45,
		47,
		49
	],
	[
		-1,
		1,
		1,
		2,
		2,
		4,
		4,
		6,
		6,
		8,
		8,
		8,
		10,
		12,
		16,
		12,
		17,
		16,
		18,
		21,
		20,
		23,
		23,
		25,
		27,
		29,
		34,
		34,
		35,
		38,
		40,
		43,
		45,
		48,
		51,
		53,
		56,
		59,
		62,
		65,
		68
	],
	[
		-1,
		1,
		1,
		2,
		4,
		4,
		4,
		5,
		6,
		8,
		8,
		11,
		11,
		16,
		16,
		18,
		16,
		19,
		21,
		25,
		25,
		25,
		34,
		30,
		32,
		35,
		37,
		40,
		42,
		45,
		48,
		51,
		54,
		57,
		60,
		63,
		66,
		70,
		74,
		77,
		81
	]
];
function normalizeContent(value) {
	const normalized = String(value || "").trim();
	if (!normalized) throw new Error("QR payload is required.");
	return normalized;
}
function normalizeQuietZone(value) {
	if (!Number.isFinite(value)) return DEFAULT_QR_QUIET_ZONE_MODULES;
	return Math.max(0, Math.floor(Number(value)));
}
function normalizePixelSize(value) {
	if (!Number.isFinite(value)) return DEFAULT_QR_PIXEL_SIZE;
	return Math.max(1, Math.floor(Number(value)));
}
var QrCode = class {
	version;
	ecc;
	size;
	mask;
	modules = [];
	types = [];
	constructor(version, ecc, dataCodewords, msk) {
		if (version < MIN_VERSION || version > MAX_VERSION) throw new RangeError("Version value out of range");
		if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range");
		this.version = version;
		this.ecc = ecc;
		this.size = version * 4 + 17;
		const row = Array.from({ length: this.size }, () => false);
		for (let i = 0; i < this.size; i++) {
			this.modules.push(row.slice());
			this.types.push(row.slice());
		}
		this.drawFunctionPatterns();
		const allCodewords = this.addEccAndInterleave(dataCodewords);
		this.drawCodewords(allCodewords);
		let selectedMask = msk;
		if (selectedMask === -1) {
			let minPenalty = Number.POSITIVE_INFINITY;
			for (let i = 0; i < 8; i++) {
				this.applyMask(i);
				this.drawFormatBits(i);
				const penalty = this.getPenaltyScore();
				if (penalty < minPenalty) {
					selectedMask = i;
					minPenalty = penalty;
				}
				this.applyMask(i);
			}
		}
		this.mask = selectedMask;
		this.applyMask(selectedMask);
		this.drawFormatBits(selectedMask);
	}
	drawFunctionPatterns() {
		for (let i = 0; i < this.size; i++) {
			this.setFunctionModule(6, i, i % 2 === 0);
			this.setFunctionModule(i, 6, i % 2 === 0);
		}
		this.drawFinderPattern(3, 3);
		this.drawFinderPattern(this.size - 4, 3);
		this.drawFinderPattern(3, this.size - 4);
		const alignPatPos = this.getAlignmentPatternPositions();
		const numAlign = alignPatPos.length;
		for (let i = 0; i < numAlign; i++) for (let j = 0; j < numAlign; j++) if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0)) this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
		this.drawFormatBits(0);
		this.drawVersion();
	}
	drawFormatBits(mask) {
		const data = this.ecc[1] << 3 | mask;
		let rem = data;
		for (let i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 1335;
		const bits = (data << 10 | rem) ^ 21522;
		for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
		this.setFunctionModule(8, 7, getBit(bits, 6));
		this.setFunctionModule(8, 8, getBit(bits, 7));
		this.setFunctionModule(7, 8, getBit(bits, 8));
		for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
		for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
		for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
		this.setFunctionModule(8, this.size - 8, true);
	}
	drawVersion() {
		if (this.version < 7) return;
		let rem = this.version;
		for (let i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 7973;
		const bits = this.version << 12 | rem;
		for (let i = 0; i < 18; i++) {
			const color = getBit(bits, i);
			const a = this.size - 11 + i % 3;
			const b = Math.floor(i / 3);
			this.setFunctionModule(a, b, color);
			this.setFunctionModule(b, a, color);
		}
	}
	drawFinderPattern(x, y) {
		for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
			const dist = Math.max(Math.abs(dx), Math.abs(dy));
			const xx = x + dx;
			const yy = y + dy;
			if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
		}
	}
	drawAlignmentPattern(x, y) {
		for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
	}
	setFunctionModule(x, y, isDark) {
		this.modules[y][x] = isDark;
		this.types[y][x] = true;
	}
	addEccAndInterleave(data) {
		const ver = this.version;
		const ecl = this.ecc;
		if (data.length !== getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid argument");
		const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
		const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
		const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
		const numShortBlocks = numBlocks - rawCodewords % numBlocks;
		const shortBlockLen = Math.floor(rawCodewords / numBlocks);
		const blocks = [];
		const rsDiv = reedSolomonComputeDivisor(blockEccLen);
		for (let i = 0, k$1 = 0; i < numBlocks; i++) {
			const dat = data.slice(k$1, k$1 + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
			k$1 += dat.length;
			const ecc = reedSolomonComputeRemainder(dat, rsDiv);
			if (i < numShortBlocks) dat.push(0);
			blocks.push(dat.concat(ecc));
		}
		const result = [];
		for (let i = 0; i < blocks[0].length; i++) blocks.forEach((block, j) => {
			if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
		});
		return result;
	}
	drawCodewords(data) {
		if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument");
		let i = 0;
		for (let right = this.size - 1; right >= 1; right -= 2) {
			if (right === 6) right = 5;
			for (let vert = 0; vert < this.size; vert++) for (let j = 0; j < 2; j++) {
				const x = right - j;
				const y = (right + 1 & 2) === 0 ? this.size - 1 - vert : vert;
				if (!this.types[y][x] && i < data.length * 8) {
					this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
					i++;
				}
			}
		}
	}
	applyMask(mask) {
		if (mask < 0 || mask > 7) throw new RangeError("Mask value out of range");
		for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
			let invert;
			switch (mask) {
				case 0:
					invert = (x + y) % 2 === 0;
					break;
				case 1:
					invert = y % 2 === 0;
					break;
				case 2:
					invert = x % 3 === 0;
					break;
				case 3:
					invert = (x + y) % 3 === 0;
					break;
				case 4:
					invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
					break;
				case 5:
					invert = x * y % 2 + x * y % 3 === 0;
					break;
				case 6:
					invert = (x * y % 2 + x * y % 3) % 2 === 0;
					break;
				case 7:
					invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
					break;
				default: throw new Error("Unreachable");
			}
			if (!this.types[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
		}
	}
	getPenaltyScore() {
		let result = 0;
		for (let y = 0; y < this.size; y++) {
			let runColor = false;
			let runX = 0;
			const runHistory = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let x = 0; x < this.size; x++) if (this.modules[y][x] === runColor) {
				runX++;
				if (runX === 5) result += PENALTY_N1;
				else if (runX > 5) result++;
			} else {
				this.finderPenaltyAddHistory(runX, runHistory);
				if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
				runColor = this.modules[y][x];
				runX = 1;
			}
			result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
		}
		for (let x = 0; x < this.size; x++) {
			let runColor = false;
			let runY = 0;
			const runHistory = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let y = 0; y < this.size; y++) if (this.modules[y][x] === runColor) {
				runY++;
				if (runY === 5) result += PENALTY_N1;
				else if (runY > 5) result++;
			} else {
				this.finderPenaltyAddHistory(runY, runHistory);
				if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
				runColor = this.modules[y][x];
				runY = 1;
			}
			result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
		}
		for (let y = 0; y < this.size - 1; y++) for (let x = 0; x < this.size - 1; x++) {
			const color = this.modules[y][x];
			if (color === this.modules[y][x + 1] && color === this.modules[y + 1][x] && color === this.modules[y + 1][x + 1]) result += PENALTY_N2;
		}
		let dark = 0;
		for (const row of this.modules) dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
		const total = this.size * this.size;
		const k$1 = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
		result += k$1 * PENALTY_N4;
		return result;
	}
	getAlignmentPatternPositions() {
		if (this.version === 1) return [];
		const numAlign = Math.floor(this.version / 7) + 2;
		const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
		const result = [6];
		for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
		return result;
	}
	finderPenaltyCountPatterns(runHistory) {
		const n = runHistory[1];
		const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
		return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
	}
	finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
		if (currentRunColor) {
			this.finderPenaltyAddHistory(currentRunLength, runHistory);
			currentRunLength = 0;
		}
		currentRunLength += this.size;
		this.finderPenaltyAddHistory(currentRunLength, runHistory);
		return this.finderPenaltyCountPatterns(runHistory);
	}
	finderPenaltyAddHistory(currentRunLength, runHistory) {
		if (runHistory[0] === 0) currentRunLength += this.size;
		runHistory.pop();
		runHistory.unshift(currentRunLength);
	}
};
var QrSegment = class {
	mode;
	numChars;
	bitData;
	constructor(mode, numChars, bitData) {
		if (numChars < 0) throw new RangeError("Invalid argument");
		this.mode = mode;
		this.numChars = numChars;
		this.bitData = bitData.slice();
	}
	getData() {
		return this.bitData.slice();
	}
};
var MODE_NUMERIC = [
	1,
	10,
	12,
	14
];
var MODE_ALPHANUMERIC = [
	2,
	9,
	11,
	13
];
var MODE_BYTE = [
	4,
	8,
	16,
	16
];
function appendBits(val, len, bb) {
	if (len < 0 || len > 31 || val >>> len !== 0) throw new RangeError("Value out of range");
	for (let i = len - 1; i >= 0; i--) bb.push(val >>> i & 1);
}
function getBit(x, i) {
	return (x >>> i & 1) !== 0;
}
function numCharCountBits(mode, ver) {
	return mode[Math.floor((ver + 7) / 17) + 1];
}
function makeBytes(data) {
	const bb = [];
	for (const b of data) appendBits(b, 8, bb);
	return new QrSegment(MODE_BYTE, data.length, bb);
}
function makeNumeric(digits) {
	if (!NUMERIC_REGEX.test(digits)) throw new RangeError("String contains non-numeric characters");
	const bb = [];
	for (let i = 0; i < digits.length;) {
		const n = Math.min(digits.length - i, 3);
		appendBits(Number.parseInt(digits.slice(i, i + n), 10), n * 3 + 1, bb);
		i += n;
	}
	return new QrSegment(MODE_NUMERIC, digits.length, bb);
}
function makeAlphanumeric(text) {
	if (!ALPHANUMERIC_REGEX.test(text)) throw new RangeError("String contains unencodable characters in alphanumeric mode");
	const bb = [];
	let i = 0;
	for (; i + 2 <= text.length; i += 2) {
		let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
		temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
		appendBits(temp, 11, bb);
	}
	if (i < text.length) appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
	return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}
function makeSegments(text) {
	if (text === "") return [];
	if (NUMERIC_REGEX.test(text)) return [makeNumeric(text)];
	if (ALPHANUMERIC_REGEX.test(text)) return [makeAlphanumeric(text)];
	return [makeBytes(toUtf8ByteArray(text))];
}
function getTotalBits(segs, version) {
	let result = 0;
	for (const seg of segs) {
		const ccbits = numCharCountBits(seg.mode, version);
		if (seg.numChars >= 1 << ccbits) return Number.POSITIVE_INFINITY;
		result += 4 + ccbits + seg.getData().length;
	}
	return result;
}
function toUtf8ByteArray(str) {
	const encoded = encodeURI(str);
	const result = [];
	for (let i = 0; i < encoded.length; i++) if (encoded.charAt(i) !== "%") result.push(encoded.charCodeAt(i));
	else {
		result.push(Number.parseInt(encoded.slice(i + 1, i + 3), 16));
		i += 2;
	}
	return result;
}
function getNumRawDataModules(ver) {
	if (ver < MIN_VERSION || ver > MAX_VERSION) throw new RangeError("Version number out of range");
	let result = (16 * ver + 128) * ver + 64;
	if (ver >= 2) {
		const numAlign = Math.floor(ver / 7) + 2;
		result -= (25 * numAlign - 10) * numAlign - 55;
		if (ver >= 7) result -= 36;
	}
	return result;
}
function getNumDataCodewords(ver, ecl) {
	return Math.floor(getNumRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
}
function reedSolomonComputeDivisor(degree) {
	if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
	const result = [];
	for (let i = 0; i < degree - 1; i++) result.push(0);
	result.push(1);
	let root = 1;
	for (let i = 0; i < degree; i++) {
		for (let j = 0; j < result.length; j++) {
			result[j] = reedSolomonMultiply(result[j], root);
			if (j + 1 < result.length) result[j] ^= result[j + 1];
		}
		root = reedSolomonMultiply(root, 2);
	}
	return result;
}
function reedSolomonComputeRemainder(data, divisor) {
	const result = divisor.map(() => 0);
	for (const b of data) {
		const factor = b ^ result.shift();
		result.push(0);
		divisor.forEach((coef, i) => {
			result[i] ^= reedSolomonMultiply(coef, factor);
		});
	}
	return result;
}
function reedSolomonMultiply(x, y) {
	if (x >>> 8 !== 0 || y >>> 8 !== 0) throw new RangeError("Byte out of range");
	let z = 0;
	for (let i = 7; i >= 0; i--) {
		z = z << 1 ^ (z >>> 7) * 285;
		z ^= (y >>> i & 1) * x;
	}
	return z;
}
function encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = false) {
	if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7) throw new RangeError("Invalid value");
	let version = minVersion;
	let dataUsedBits = 0;
	for (; version <= maxVersion; version++) {
		const capacityBits = getNumDataCodewords(version, ecl) * 8;
		const usedBits = getTotalBits(segs, version);
		if (usedBits <= capacityBits) {
			dataUsedBits = usedBits;
			break;
		}
	}
	if (version > maxVersion) throw new RangeError("Data too long");
	for (const newEcl of [
		MEDIUM,
		QUARTILE,
		HIGH
	]) if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
	const bb = [];
	for (const seg of segs) {
		appendBits(seg.mode[0], 4, bb);
		appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
		for (const b of seg.getData()) bb.push(b);
	}
	const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
	appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
	appendBits(0, (8 - bb.length % 8) % 8, bb);
	for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 253) appendBits(padByte, 8, bb);
	const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
	bb.forEach((b, i) => {
		dataCodewords[i >>> 3] |= b << 7 - (i & 7);
	});
	return new QrCode(version, ecl, dataCodewords, mask);
}
function renderLocalSvg(data, input) {
	const qr = encodeSegments(makeSegments(data), EccMap[input.errorCorrection ?? DEFAULT_QR_ERROR_CORRECTION], 1, 40, -1, false);
	const border = normalizeQuietZone(input.quietZoneModules);
	const pixelSize = normalizePixelSize(input.pixelSize);
	const whiteColor = input.backgroundColor ?? "#ffffff";
	const blackColor = input.foregroundColor ?? "#111111";
	const size = qr.size + border * 2;
	const width = size * pixelSize;
	const height = size * pixelSize;
	const paths = [];
	for (let row = 0; row < qr.size; row++) for (let col = 0; col < qr.size; col++) {
		if (!qr.modules[row][col]) continue;
		const x = (col + border) * pixelSize;
		const y = (row + border) * pixelSize;
		paths.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
	}
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
		`<rect fill="${whiteColor}" width="${width}" height="${height}"/>`,
		`<path fill="${blackColor}" d="${paths.join("")}"/>`,
		"</svg>"
	].join("");
}
function buildQrSvg(input) {
	return renderLocalSvg(normalizeContent(input.value), input);
}
function qrSvgToDataUri(svg) {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function buildQrDataUri(input) {
	return qrSvgToDataUri(buildQrSvg(input));
}
var We$1 = {
	as: {
		type: String,
		default: "button"
	},
	variant: {
		type: String,
		default: "primary"
	},
	size: {
		type: String,
		default: "md"
	},
	type: {
		type: String,
		default: "button"
	},
	disabled: {
		type: Boolean,
		default: !1
	},
	loading: {
		type: Boolean,
		default: !1
	}
}, je = "inline-flex items-center justify-center gap-2 border border-transparent font-medium select-none whitespace-nowrap align-middle rounded-[var(--ui-radius-md)] transition-[transform,box-shadow,background-color,opacity,border-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]", W = {
	interactive: "cursor-pointer shadow-[var(--ui-shadow-sm)] hover:shadow-[var(--ui-shadow-md)] hover:translate-y-[var(--ui-lift-hover)] active:translate-y-0 active:scale-[var(--ui-scale-active)]",
	disabled: "cursor-not-allowed pointer-events-none opacity-40 shadow-none",
	loading: "cursor-progress pointer-events-none opacity-75 shadow-[var(--ui-shadow-sm)]"
}, qe$2 = {
	primary: "bg-[var(--ui-primary)] text-[var(--ui-on-primary)] hover:bg-[var(--ui-primary-hover)] active:bg-[var(--ui-primary-active)] hover:shadow-[var(--ui-glow-primary)]",
	accent: "bg-[var(--ui-accent)] text-[var(--ui-on-accent)] hover:bg-[var(--ui-accent-hover)] active:bg-[var(--ui-accent-active)] hover:shadow-[var(--ui-glow-accent)]",
	secondary: "bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg)] hover:bg-[var(--ui-tonal-secondary-hover)]",
	tertiary: "bg-[var(--ui-tonal-tertiary)] text-[var(--ui-fg)] hover:bg-[var(--ui-tonal-tertiary-hover)]",
	critical: "bg-[var(--ui-critical)] text-[var(--ui-on-critical)] hover:bg-[var(--ui-critical-hover)] active:bg-[var(--ui-critical-active)] hover:shadow-[var(--ui-glow-critical)]",
	"plain-primary": "bg-transparent text-[var(--ui-primary)] shadow-none hover:bg-[var(--ui-primary-muted)] active:bg-[var(--ui-primary-hover)] hover:shadow-none",
	"plain-secondary": "bg-transparent text-[var(--ui-fg)] opacity-80 shadow-none hover:bg-[var(--ui-surface-hover)] hover:opacity-100 hover:shadow-none",
	"critical-secondary": "bg-transparent text-[var(--ui-critical)] border-[var(--ui-critical-muted)] shadow-none hover:bg-[var(--ui-critical-muted)] active:bg-[var(--ui-critical-hover)] hover:shadow-none"
}, He$1 = {
	micro: "h-7 px-2 text-xs",
	xs: "h-8 px-3 text-xs",
	sm: "h-9 px-4 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-5 text-base",
	xl: "h-12 px-6 text-base",
	hero: "h-16 px-8 text-base uppercase tracking-[0.14em]"
}, Xe = "inline-flex items-center gap-2", Y$1 = "inline-flex shrink-0 items-center justify-center", Ke$1 = "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", qt = /* @__PURE__ */ defineComponent({
	inheritAttrs: !1,
	__name: "Button",
	props: We$1,
	emits: ["click"],
	setup(e, { emit: t }) {
		const a = t, s = useAttrs(), r = e, o = computed(() => r.as === "button"), i = computed(() => r.disabled || r.loading), u = computed(() => r.loading ? W.loading : r.disabled ? W.disabled : W.interactive), v = computed(() => ir(je, u.value, qe$2[r.variant], He$1[r.size], normalizeClass(s.class))), w = computed(() => {
			const { class: b, disabled: n, type: g, ...h$1 } = s;
			return h$1;
		}), T = computed(() => ({
			...w.value,
			type: o.value ? r.type : void 0,
			disabled: o.value ? i.value : void 0,
			"aria-busy": r.loading ? "true" : void 0,
			"aria-disabled": !o.value && i.value ? "true" : void 0,
			tabindex: !o.value && i.value ? -1 : s.tabindex,
			"data-loading": r.loading ? "true" : "false",
			"data-disabled": i.value ? "true" : "false"
		}));
		function N(b) {
			if (i.value) {
				b.preventDefault(), b.stopPropagation();
				return;
			}
			a("click", b);
		}
		return (b, n) => (openBlock(), createBlock(resolveDynamicComponent(r.as), mergeProps({ class: v.value }, T.value, { onClick: N }), {
			default: withCtx(() => [
				r.loading ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: normalizeClass(unref(Ke$1)),
					"aria-hidden": "true"
				}, null, 2)) : b.$slots.leading ? (openBlock(), createElementBlock("span", {
					key: 1,
					class: normalizeClass(unref(Y$1))
				}, [renderSlot(b.$slots, "leading")], 2)) : createCommentVNode("", !0),
				createElementVNode("span", { class: normalizeClass(unref(Xe)) }, [renderSlot(b.$slots, "default")], 2),
				b.$slots.trailing ? (openBlock(), createElementBlock("span", {
					key: 2,
					class: normalizeClass(unref(Y$1))
				}, [renderSlot(b.$slots, "trailing")], 2)) : createCommentVNode("", !0)
			]),
			_: 3
		}, 16, ["class"]));
	}
}), Ye = {
	variant: {
		type: String,
		default: "default"
	},
	padding: {
		type: String,
		default: "md"
	},
	interactive: {
		type: Boolean,
		default: !1
	}
}, Ge$1 = "rounded-[var(--ui-radius-lg)] border text-[var(--ui-fg)] transition-[border-color,box-shadow,transform,background-color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]", Je = {
	default: "border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-sm)]",
	subtle: "border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] shadow-none",
	outline: "border-[var(--ui-border)] bg-transparent shadow-none",
	elevated: "border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-md)]",
	panel: "border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] shadow-[var(--ui-shadow-md)]",
	showcase: "border-[color-mix(in_srgb,var(--ui-border)_74%,var(--ui-primary-muted))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary)_12%,var(--ui-tonal-secondary))_0%,color-mix(in_srgb,var(--ui-bg)_84%,var(--ui-tonal-secondary))_100%)] shadow-[0_18px_48px_color-mix(in_srgb,var(--ui-primary)_14%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--ui-fg)_8%,transparent)] backdrop-blur-sm"
}, Qe = {
	sm: "p-4",
	md: "p-6",
	lg: "p-8"
}, Ze = "cursor-pointer hover:-translate-y-[var(--ui-lift-hover)] hover:border-[var(--ui-primary-muted)] hover:shadow-[var(--ui-shadow-md)] focus-within:ring-2 focus-within:ring-[var(--ui-ring)]", Ht = /* @__PURE__ */ defineComponent({
	inheritAttrs: !1,
	__name: "Card",
	props: Ye,
	setup(e) {
		const t = useAttrs(), a = e, s = computed(() => ir(Ge$1, Je[a.variant], Qe[a.padding], a.interactive ? Ze : "", normalizeClass(t.class))), r = computed(() => {
			const { class: o, ...i } = t;
			return i;
		});
		return (o, i) => (openBlock(), createElementBlock("div", mergeProps({ class: s.value }, r.value), [renderSlot(o.$slots, "default")], 16));
	}
});
String;
var [Q, k] = ce$1("TabsContext");
Boolean;
Boolean;
Boolean;
Boolean, Boolean;
Boolean, Boolean, Boolean;
ne("tabs").parts("root", "list", "trigger", "content", "indicator").build();
var $ = (e) => e.ids?.list ?? `tabs:${e.id}:list`, q = (e, t) => e.ids?.content?.(t) ?? `tabs:${e.id}:content-${t}`, A = (e, t) => e.ids?.trigger?.(t) ?? `tabs:${e.id}:trigger-${t}`, Z = (e) => e.ids?.indicator ?? `tabs:${e.id}:indicator`, vt$1 = (e) => e.getById($(e)), gt$1 = (e, t) => e.getById(q(e, t)), D = (e, t) => t != null ? e.getById(A(e, t)) : null, G$1 = (e) => e.getById(Z(e)), I = (e) => {
	const a = `[role=tab][data-ownedby='${CSS.escape($(e))}']:not([disabled])`;
	return os(vt$1(e), a);
}, pt$1 = (e) => go(I(e)), ft$1 = (e) => mo(I(e)), bt = (e, t) => ss(I(e), A(e, t.value), t.loopFocus), mt$1 = (e, t) => is(I(e), A(e, t.value), t.loopFocus), ee$1 = (e) => ({
	x: e?.offsetLeft ?? 0,
	y: e?.offsetTop ?? 0,
	width: e?.offsetWidth ?? 0,
	height: e?.offsetHeight ?? 0
}), ht$2 = (e, t) => {
	return ee$1(kn(I(e), A(e, t)));
}, { createMachine: _t$1 } = gs$1();
_t$1({
	props({ props: e }) {
		return {
			dir: "ltr",
			orientation: "horizontal",
			activationMode: "automatic",
			loopFocus: !0,
			composite: !0,
			navigate(t) {
				es(t.node);
			},
			defaultValue: null,
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
				onChange(a) {
					e("onValueChange")?.({ value: a });
				}
			})),
			focusedValue: t(() => ({
				defaultValue: e("value") || e("defaultValue"),
				sync: !0,
				onChange(a) {
					e("onFocusChange")?.({ focusedValue: a });
				}
			})),
			ssr: t(() => ({ defaultValue: !0 })),
			indicatorRect: t(() => ({ defaultValue: null }))
		};
	},
	watch({ context: e, prop: t, track: a, action: s }) {
		a([() => e.get("value")], () => {
			s([
				"syncIndicatorRect",
				"syncTabIndex",
				"navigateIfNeeded"
			]);
		}), a([() => t("dir"), () => t("orientation")], () => {
			s(["syncIndicatorRect"]);
		});
	},
	on: {
		SET_VALUE: { actions: ["setValue"] },
		CLEAR_VALUE: { actions: ["clearValue"] },
		SET_INDICATOR_RECT: { actions: ["setIndicatorRect"] },
		SYNC_TAB_INDEX: { actions: ["syncTabIndex"] }
	},
	entry: [
		"syncIndicatorRect",
		"syncTabIndex",
		"syncSsr"
	],
	exit: ["cleanupObserver"],
	states: {
		idle: { on: {
			TAB_FOCUS: {
				target: "focused",
				actions: ["setFocusedValue"]
			},
			TAB_CLICK: {
				target: "focused",
				actions: ["setFocusedValue", "setValue"]
			}
		} },
		focused: { on: {
			TAB_CLICK: { actions: ["setFocusedValue", "setValue"] },
			ARROW_PREV: [{
				guard: "selectOnFocus",
				actions: ["focusPrevTab", "selectFocusedTab"]
			}, { actions: ["focusPrevTab"] }],
			ARROW_NEXT: [{
				guard: "selectOnFocus",
				actions: ["focusNextTab", "selectFocusedTab"]
			}, { actions: ["focusNextTab"] }],
			HOME: [{
				guard: "selectOnFocus",
				actions: ["focusFirstTab", "selectFocusedTab"]
			}, { actions: ["focusFirstTab"] }],
			END: [{
				guard: "selectOnFocus",
				actions: ["focusLastTab", "selectFocusedTab"]
			}, { actions: ["focusLastTab"] }],
			TAB_FOCUS: { actions: ["setFocusedValue"] },
			TAB_BLUR: {
				target: "idle",
				actions: ["clearFocusedValue"]
			}
		} }
	},
	implementations: {
		guards: { selectOnFocus: ({ prop: e }) => e("activationMode") === "automatic" },
		actions: {
			selectFocusedTab({ context: e, prop: t }) {
				K(() => {
					const a = e.get("focusedValue");
					if (!a) return;
					const r = t("deselectable") && e.get("value") === a ? null : a;
					e.set("value", r);
				});
			},
			setFocusedValue({ context: e, event: t, flush: a }) {
				t.value != null && a(() => {
					e.set("focusedValue", t.value);
				});
			},
			clearFocusedValue({ context: e }) {
				e.set("focusedValue", null);
			},
			setValue({ context: e, event: t, prop: a }) {
				const s = a("deselectable") && e.get("value") === e.get("focusedValue");
				e.set("value", s ? null : t.value);
			},
			clearValue({ context: e }) {
				e.set("value", null);
			},
			focusFirstTab({ scope: e }) {
				K(() => {
					pt$1(e)?.focus();
				});
			},
			focusLastTab({ scope: e }) {
				K(() => {
					ft$1(e)?.focus();
				});
			},
			focusNextTab({ context: e, prop: t, scope: a, event: s }) {
				const r = s.value ?? e.get("focusedValue");
				if (!r) return;
				const o = bt(a, {
					value: r,
					loopFocus: t("loopFocus")
				});
				K(() => {
					t("composite") ? o?.focus() : o?.dataset.value != null && e.set("focusedValue", o.dataset.value);
				});
			},
			focusPrevTab({ context: e, prop: t, scope: a, event: s }) {
				const r = s.value ?? e.get("focusedValue");
				if (!r) return;
				const o = mt$1(a, {
					value: r,
					loopFocus: t("loopFocus")
				});
				K(() => {
					t("composite") ? o?.focus() : o?.dataset.value != null && e.set("focusedValue", o.dataset.value);
				});
			},
			syncTabIndex({ context: e, scope: t }) {
				K(() => {
					const a = e.get("value");
					if (!a) return;
					const s = gt$1(t, a);
					if (!s) return;
					bn(s).length > 0 ? s.removeAttribute("tabindex") : s.setAttribute("tabindex", "0");
				});
			},
			cleanupObserver({ refs: e }) {
				const t = e.get("indicatorCleanup");
				t && t();
			},
			setIndicatorRect({ context: e, event: t, scope: a }) {
				const s = t.id ?? e.get("value");
				!G$1(a) || !s || !D(a, s) || e.set("indicatorRect", ht$2(a, s));
			},
			syncSsr({ context: e }) {
				e.set("ssr", !1);
			},
			syncIndicatorRect({ context: e, refs: t, scope: a }) {
				const s = t.get("indicatorCleanup");
				if (s && s(), !G$1(a)) return;
				const o = () => {
					const v = D(a, e.get("value"));
					if (!v) return;
					const w = ee$1(v);
					e.set("indicatorRect", (T) => Te(T, w) ? T : w);
				};
				o();
				const u = xr(...I(a).map((v) => as$2.observe(v, o)));
				t.set("indicatorCleanup", u);
			},
			navigateIfNeeded({ context: e, prop: t, scope: a }) {
				const s = e.get("value");
				if (!s) return;
				const r = D(a, s);
				Mo(r) && t("navigate")?.({
					value: s,
					node: r,
					href: r.href
				});
			}
		}
	}
});
Wn()([
	"activationMode",
	"composite",
	"deselectable",
	"dir",
	"getRootNode",
	"id",
	"ids",
	"loopFocus",
	"navigate",
	"onFocusChange",
	"onValueChange",
	"orientation",
	"translations",
	"value",
	"defaultValue"
]);
Wn()(["disabled", "value"]);
Wn()(["value"]);
var [Vn$1, Ot] = ce$1("AccordionContext"), ts$1 = [
	"top",
	"right",
	"bottom",
	"left"
], ke = Math.min, Y = Math.max, Vt = Math.round, Et = Math.floor, ce$2 = (e) => ({
	x: e,
	y: e
}), os$1 = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
}, ns$1 = {
	start: "end",
	end: "start"
};
function lo(e, t, o) {
	return Y(e, ke(t, o));
}
function ve(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function ye(e) {
	return e.split("-")[0];
}
function st(e) {
	return e.split("-")[1];
}
function ko$1(e) {
	return e === "x" ? "y" : "x";
}
function Eo(e) {
	return e === "y" ? "height" : "width";
}
var rs$2 = /* @__PURE__ */ new Set(["top", "bottom"]);
function le(e) {
	return rs$2.has(ye(e)) ? "y" : "x";
}
function To$1(e) {
	return ko$1(le(e));
}
function ss$2(e, t, o) {
	o === void 0 && (o = !1);
	const n = st(e), r = To$1(e), s = Eo(r);
	let i = r === "x" ? n === (o ? "end" : "start") ? "right" : "left" : n === "start" ? "bottom" : "top";
	return t.reference[s] > t.floating[s] && (i = Lt(i)), [i, Lt(i)];
}
function is$1(e) {
	const t = Lt(e);
	return [
		co(e),
		t,
		co(t)
	];
}
function co(e) {
	return e.replace(/start|end/g, (t) => ns$1[t]);
}
var Go$1 = ["left", "right"], Wo$1 = ["right", "left"], as$1 = ["top", "bottom"], ls$1 = ["bottom", "top"];
function cs(e, t, o) {
	switch (e) {
		case "top":
		case "bottom": return o ? t ? Wo$1 : Go$1 : t ? Go$1 : Wo$1;
		case "left":
		case "right": return t ? as$1 : ls$1;
		default: return [];
	}
}
function ds$1(e, t, o, n) {
	const r = st(e);
	let s = cs(ye(e), o === "start", n);
	return r && (s = s.map((i) => i + "-" + r), t && (s = s.concat(s.map(co)))), s;
}
function Lt(e) {
	return e.replace(/left|right|bottom|top/g, (t) => os$1[t]);
}
function us(e) {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...e
	};
}
function Ln(e) {
	return typeof e != "number" ? us(e) : {
		top: e,
		right: e,
		bottom: e,
		left: e
	};
}
function Nt(e) {
	const { x: t, y: o, width: n, height: r } = e;
	return {
		width: n,
		height: r,
		top: o,
		left: t,
		right: t + n,
		bottom: o + r,
		x: t,
		y: o
	};
}
function Uo$1(e, t, o) {
	let { reference: n, floating: r } = e;
	const s = le(t), i = To$1(t), l = Eo(i), c = ye(t), u = s === "y", f = n.x + n.width / 2 - r.width / 2, g = n.y + n.height / 2 - r.height / 2, v = n[l] / 2 - r[l] / 2;
	let d;
	switch (c) {
		case "top":
			d = {
				x: f,
				y: n.y - r.height
			};
			break;
		case "bottom":
			d = {
				x: f,
				y: n.y + n.height
			};
			break;
		case "right":
			d = {
				x: n.x + n.width,
				y: g
			};
			break;
		case "left":
			d = {
				x: n.x - r.width,
				y: g
			};
			break;
		default: d = {
			x: n.x,
			y: n.y
		};
	}
	switch (st(t)) {
		case "start":
			d[i] -= v * (o && u ? -1 : 1);
			break;
		case "end":
			d[i] += v * (o && u ? -1 : 1);
			break;
	}
	return d;
}
var ps$1 = async (e, t, o) => {
	const { placement: n = "bottom", strategy: r = "absolute", middleware: s = [], platform: i } = o, l = s.filter(Boolean), c = await (i.isRTL == null ? void 0 : i.isRTL(t));
	let u = await i.getElementRects({
		reference: e,
		floating: t,
		strategy: r
	}), { x: f, y: g } = Uo$1(u, n, c), v = n, d = {}, h$1 = 0;
	for (let b = 0; b < l.length; b++) {
		const { name: E, fn: P } = l[b], { x: T, y: R, data: p, reset: k$1 } = await P({
			x: f,
			y: g,
			initialPlacement: n,
			placement: v,
			strategy: r,
			middlewareData: d,
			rects: u,
			platform: i,
			elements: {
				reference: e,
				floating: t
			}
		});
		f = T ?? f, g = R ?? g, d = {
			...d,
			[E]: {
				...d[E],
				...p
			}
		}, k$1 && h$1 <= 50 && (h$1++, typeof k$1 == "object" && (k$1.placement && (v = k$1.placement), k$1.rects && (u = k$1.rects === !0 ? await i.getElementRects({
			reference: e,
			floating: t,
			strategy: r
		}) : k$1.rects), {x: f, y: g} = Uo$1(u, v, c)), b = -1);
	}
	return {
		x: f,
		y: g,
		placement: v,
		strategy: r,
		middlewareData: d
	};
};
async function ht$1(e, t) {
	var o;
	t === void 0 && (t = {});
	const { x: n, y: r, platform: s, rects: i, elements: l, strategy: c } = e, { boundary: u = "clippingAncestors", rootBoundary: f = "viewport", elementContext: g = "floating", altBoundary: v = !1, padding: d = 0 } = ve(t, e), h$1 = Ln(d), E = l[v ? g === "floating" ? "reference" : "floating" : g], P = Nt(await s.getClippingRect({
		element: (o = await (s.isElement == null ? void 0 : s.isElement(E))) == null || o ? E : E.contextElement || await (s.getDocumentElement == null ? void 0 : s.getDocumentElement(l.floating)),
		boundary: u,
		rootBoundary: f,
		strategy: c
	})), T = g === "floating" ? {
		x: n,
		y: r,
		width: i.floating.width,
		height: i.floating.height
	} : i.reference, R = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(l.floating)), p = await (s.isElement == null ? void 0 : s.isElement(R)) ? await (s.getScale == null ? void 0 : s.getScale(R)) || {
		x: 1,
		y: 1
	} : {
		x: 1,
		y: 1
	}, k$1 = Nt(s.convertOffsetParentRelativeRectToViewportRelativeRect ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: l,
		rect: T,
		offsetParent: R,
		strategy: c
	}) : T);
	return {
		top: (P.top - k$1.top + h$1.top) / p.y,
		bottom: (k$1.bottom - P.bottom + h$1.bottom) / p.y,
		left: (P.left - k$1.left + h$1.left) / p.x,
		right: (k$1.right - P.right + h$1.right) / p.x
	};
}
var fs = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		const { x: o, y: n, placement: r, rects: s, platform: i, elements: l, middlewareData: c } = t, { element: u, padding: f = 0 } = ve(e, t) || {};
		if (u == null) return {};
		const g = Ln(f), v = {
			x: o,
			y: n
		}, d = To$1(r), h$1 = Eo(d), b = await i.getDimensions(u), E = d === "y", P = E ? "top" : "left", T = E ? "bottom" : "right", R = E ? "clientHeight" : "clientWidth", p = s.reference[h$1] + s.reference[d] - v[d] - s.floating[h$1], k$1 = v[d] - s.reference[d], M$1 = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(u));
		let V = M$1 ? M$1[R] : 0;
		(!V || !await (i.isElement == null ? void 0 : i.isElement(M$1))) && (V = l.floating[R] || s.floating[h$1]);
		const z = p / 2 - k$1 / 2, H = V / 2 - b[h$1] / 2 - 1, D$1 = ke(g[P], H), W$1 = ke(g[T], H), Q$1 = D$1, Ce = V - b[h$1] - W$1, j = V / 2 - b[h$1] / 2 + z, Re = lo(Q$1, j, Ce), fe = !c.arrow && st(r) != null && j !== Re && s.reference[h$1] / 2 - (j < Q$1 ? D$1 : W$1) - b[h$1] / 2 < 0, te = fe ? j < Q$1 ? j - Q$1 : j - Ce : 0;
		return {
			[d]: v[d] + te,
			data: {
				[d]: Re,
				centerOffset: j - Re - te,
				...fe && { alignmentOffset: te }
			},
			reset: fe
		};
	}
}), gs = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var o, n;
			const { placement: r, middlewareData: s, rects: i, initialPlacement: l, platform: c, elements: u } = t, { mainAxis: f = !0, crossAxis: g = !0, fallbackPlacements: v, fallbackStrategy: d = "bestFit", fallbackAxisSideDirection: h$1 = "none", flipAlignment: b = !0, ...E } = ve(e, t);
			if ((o = s.arrow) != null && o.alignmentOffset) return {};
			const P = ye(r), T = le(l), R = ye(l) === l, p = await (c.isRTL == null ? void 0 : c.isRTL(u.floating)), k$1 = v || (R || !b ? [Lt(l)] : is$1(l)), M$1 = h$1 !== "none";
			!v && M$1 && k$1.push(...ds$1(l, b, h$1, p));
			const V = [l, ...k$1], z = await ht$1(t, E), H = [];
			let D$1 = ((n = s.flip) == null ? void 0 : n.overflows) || [];
			if (f && H.push(z[P]), g) {
				const j = ss$2(r, i, p);
				H.push(z[j[0]], z[j[1]]);
			}
			if (D$1 = [...D$1, {
				placement: r,
				overflows: H
			}], !H.every((j) => j <= 0)) {
				var W$1, Q$1;
				const j = (((W$1 = s.flip) == null ? void 0 : W$1.index) || 0) + 1, Re = V[j];
				if (Re && (!(g === "alignment" ? T !== le(Re) : !1) || D$1.every((oe) => le(oe.placement) === T ? oe.overflows[0] > 0 : !0))) return {
					data: {
						index: j,
						overflows: D$1
					},
					reset: { placement: Re }
				};
				let fe = (Q$1 = D$1.filter((te) => te.overflows[0] <= 0).sort((te, oe) => te.overflows[1] - oe.overflows[1])[0]) == null ? void 0 : Q$1.placement;
				if (!fe) switch (d) {
					case "bestFit": {
						var Ce;
						const te = (Ce = D$1.filter((oe) => {
							if (M$1) {
								const Oe = le(oe.placement);
								return Oe === T || Oe === "y";
							}
							return !0;
						}).map((oe) => [oe.placement, oe.overflows.filter((Oe) => Oe > 0).reduce((Oe, vr) => Oe + vr, 0)]).sort((oe, Oe) => oe[1] - Oe[1])[0]) == null ? void 0 : Ce[0];
						te && (fe = te);
						break;
					}
					case "initialPlacement":
						fe = l;
						break;
				}
				if (r !== fe) return { reset: { placement: fe } };
			}
			return {};
		}
	};
};
function jo$1(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function Ko(e) {
	return ts$1.some((t) => e[t] >= 0);
}
var hs$1 = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			const { rects: o } = t, { strategy: n = "referenceHidden", ...r } = ve(e, t);
			switch (n) {
				case "referenceHidden": {
					const i = jo$1(await ht$1(t, {
						...r,
						elementContext: "reference"
					}), o.reference);
					return { data: {
						referenceHiddenOffsets: i,
						referenceHidden: Ko(i)
					} };
				}
				case "escaped": {
					const i = jo$1(await ht$1(t, {
						...r,
						altBoundary: !0
					}), o.floating);
					return { data: {
						escapedOffsets: i,
						escaped: Ko(i)
					} };
				}
				default: return {};
			}
		}
	};
}, Nn = /* @__PURE__ */ new Set(["left", "top"]);
async function ms$1(e, t) {
	const { placement: o, platform: n, elements: r } = e, s = await (n.isRTL == null ? void 0 : n.isRTL(r.floating)), i = ye(o), l = st(o), c = le(o) === "y", u = Nn.has(i) ? -1 : 1, f = s && c ? -1 : 1, g = ve(t, e);
	let { mainAxis: v, crossAxis: d, alignmentAxis: h$1 } = typeof g == "number" ? {
		mainAxis: g,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: g.mainAxis || 0,
		crossAxis: g.crossAxis || 0,
		alignmentAxis: g.alignmentAxis
	};
	return l && typeof h$1 == "number" && (d = l === "end" ? h$1 * -1 : h$1), c ? {
		x: d * f,
		y: v * u
	} : {
		x: v * u,
		y: d * f
	};
}
var vs$1 = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var o, n;
			const { x: r, y: s, placement: i, middlewareData: l } = t, c = await ms$1(t, e);
			return i === ((o = l.offset) == null ? void 0 : o.placement) && (n = l.arrow) != null && n.alignmentOffset ? {} : {
				x: r + c.x,
				y: s + c.y,
				data: {
					...c,
					placement: i
				}
			};
		}
	};
}, ys = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			const { x: o, y: n, placement: r } = t, { mainAxis: s = !0, crossAxis: i = !1, limiter: l = { fn: (E) => {
				let { x: P, y: T } = E;
				return {
					x: P,
					y: T
				};
			} }, ...c } = ve(e, t), u = {
				x: o,
				y: n
			}, f = await ht$1(t, c), g = le(ye(r)), v = ko$1(g);
			let d = u[v], h$1 = u[g];
			if (s) {
				const E = v === "y" ? "top" : "left", P = v === "y" ? "bottom" : "right", T = d + f[E], R = d - f[P];
				d = lo(T, d, R);
			}
			if (i) {
				const E = g === "y" ? "top" : "left", P = g === "y" ? "bottom" : "right", T = h$1 + f[E], R = h$1 - f[P];
				h$1 = lo(T, h$1, R);
			}
			const b = l.fn({
				...t,
				[v]: d,
				[g]: h$1
			});
			return {
				...b,
				data: {
					x: b.x - o,
					y: b.y - n,
					enabled: {
						[v]: s,
						[g]: i
					}
				}
			};
		}
	};
}, bs$1 = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			const { x: o, y: n, placement: r, rects: s, middlewareData: i } = t, { offset: l = 0, mainAxis: c = !0, crossAxis: u = !0 } = ve(e, t), f = {
				x: o,
				y: n
			}, g = le(r), v = ko$1(g);
			let d = f[v], h$1 = f[g];
			const b = ve(l, t), E = typeof b == "number" ? {
				mainAxis: b,
				crossAxis: 0
			} : {
				mainAxis: 0,
				crossAxis: 0,
				...b
			};
			if (c) {
				const R = v === "y" ? "height" : "width", p = s.reference[v] - s.floating[R] + E.mainAxis, k$1 = s.reference[v] + s.reference[R] - E.mainAxis;
				d < p ? d = p : d > k$1 && (d = k$1);
			}
			if (u) {
				var P, T;
				const R = v === "y" ? "width" : "height", p = Nn.has(ye(r)), k$1 = s.reference[g] - s.floating[R] + (p && ((P = i.offset) == null ? void 0 : P[g]) || 0) + (p ? 0 : E.crossAxis), M$1 = s.reference[g] + s.reference[R] + (p ? 0 : ((T = i.offset) == null ? void 0 : T[g]) || 0) - (p ? E.crossAxis : 0);
				h$1 < k$1 ? h$1 = k$1 : h$1 > M$1 && (h$1 = M$1);
			}
			return {
				[v]: d,
				[g]: h$1
			};
		}
	};
}, Cs$1 = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			var o, n;
			const { placement: r, rects: s, platform: i, elements: l } = t, { apply: c = () => {}, ...u } = ve(e, t), f = await ht$1(t, u), g = ye(r), v = st(r), d = le(r) === "y", { width: h$1, height: b } = s.floating;
			let E, P;
			g === "top" || g === "bottom" ? (E = g, P = v === (await (i.isRTL == null ? void 0 : i.isRTL(l.floating)) ? "start" : "end") ? "left" : "right") : (P = g, E = v === "end" ? "top" : "bottom");
			const T = b - f.top - f.bottom, R = h$1 - f.left - f.right, p = ke(b - f[E], T), k$1 = ke(h$1 - f[P], R), M$1 = !t.middlewareData.shift;
			let V = p, z = k$1;
			if ((o = t.middlewareData.shift) != null && o.enabled.x && (z = R), (n = t.middlewareData.shift) != null && n.enabled.y && (V = T), M$1 && !v) {
				const D$1 = Y(f.left, 0), W$1 = Y(f.right, 0), Q$1 = Y(f.top, 0), Ce = Y(f.bottom, 0);
				d ? z = h$1 - 2 * (D$1 !== 0 || W$1 !== 0 ? D$1 + W$1 : Y(f.left, f.right)) : V = b - 2 * (Q$1 !== 0 || Ce !== 0 ? Q$1 + Ce : Y(f.top, f.bottom));
			}
			await c({
				...t,
				availableWidth: z,
				availableHeight: V
			});
			const H = await i.getDimensions(l.floating);
			return h$1 !== H.width || b !== H.height ? { reset: { rects: !0 } } : {};
		}
	};
};
function Wt() {
	return typeof window < "u";
}
function it$1(e) {
	return Fn(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function J(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function pe(e) {
	var t;
	return (t = (Fn(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Fn(e) {
	return Wt() ? e instanceof Node || e instanceof J(e).Node : !1;
}
function ne$1(e) {
	return Wt() ? e instanceof Element || e instanceof J(e).Element : !1;
}
function de(e) {
	return Wt() ? e instanceof HTMLElement || e instanceof J(e).HTMLElement : !1;
}
function qo$1(e) {
	return !Wt() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof J(e).ShadowRoot;
}
var Os$1 = /* @__PURE__ */ new Set(["inline", "contents"]);
function _t(e) {
	const { overflow: t, overflowX: o, overflowY: n, display: r } = re(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + n + o) && !Os$1.has(r);
}
var _s = /* @__PURE__ */ new Set([
	"table",
	"td",
	"th"
]);
function xs$1(e) {
	return _s.has(it$1(e));
}
var ws$2 = [":popover-open", ":modal"];
function Ut(e) {
	return ws$2.some((t) => {
		try {
			return e.matches(t);
		} catch {
			return !1;
		}
	});
}
var Ps$1 = [
	"transform",
	"translate",
	"scale",
	"rotate",
	"perspective"
], ks = [
	"transform",
	"translate",
	"scale",
	"rotate",
	"perspective",
	"filter"
], Es$1 = [
	"paint",
	"layout",
	"strict",
	"content"
];
function Io(e) {
	const t = So(), o = ne$1(e) ? re(e) : e;
	return Ps$1.some((n) => o[n] ? o[n] !== "none" : !1) || (o.containerType ? o.containerType !== "normal" : !1) || !t && (o.backdropFilter ? o.backdropFilter !== "none" : !1) || !t && (o.filter ? o.filter !== "none" : !1) || ks.some((n) => (o.willChange || "").includes(n)) || Es$1.some((n) => (o.contain || "").includes(n));
}
function Ts$1(e) {
	let t = Ee(e);
	for (; de(t) && !Ke(t);) {
		if (Io(t)) return t;
		if (Ut(t)) return null;
		t = Ee(t);
	}
	return null;
}
function So() {
	return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
var Is$1 = /* @__PURE__ */ new Set([
	"html",
	"body",
	"#document"
]);
function Ke(e) {
	return Is$1.has(it$1(e));
}
function re(e) {
	return J(e).getComputedStyle(e);
}
function jt(e) {
	return ne$1(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Ee(e) {
	if (it$1(e) === "html") return e;
	const t = e.assignedSlot || e.parentNode || qo$1(e) && e.host || pe(e);
	return qo$1(t) ? t.host : t;
}
function zn(e) {
	const t = Ee(e);
	return Ke(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : de(t) && _t(t) ? t : zn(t);
}
function mt(e, t, o) {
	var n;
	t === void 0 && (t = []), o === void 0 && (o = !0);
	const r = zn(e), s = r === ((n = e.ownerDocument) == null ? void 0 : n.body), i = J(r);
	if (s) {
		const l = uo(i);
		return t.concat(i, i.visualViewport || [], _t(r) ? r : [], l && o ? mt(l) : []);
	}
	return t.concat(r, mt(r, [], o));
}
function uo(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function Hn(e) {
	const t = re(e);
	let o = parseFloat(t.width) || 0, n = parseFloat(t.height) || 0;
	const r = de(e), s = r ? e.offsetWidth : o, i = r ? e.offsetHeight : n, l = Vt(o) !== s || Vt(n) !== i;
	return l && (o = s, n = i), {
		width: o,
		height: n,
		$: l
	};
}
function $o$1(e) {
	return ne$1(e) ? e : e.contextElement;
}
function We(e) {
	const t = $o$1(e);
	if (!de(t)) return ce$2(1);
	const o = t.getBoundingClientRect(), { width: n, height: r, $: s } = Hn(t);
	let i = (s ? Vt(o.width) : o.width) / n, l = (s ? Vt(o.height) : o.height) / r;
	return (!i || !Number.isFinite(i)) && (i = 1), (!l || !Number.isFinite(l)) && (l = 1), {
		x: i,
		y: l
	};
}
var Ss$1 = /* @__PURE__ */ ce$2(0);
function Gn(e) {
	const t = J(e);
	return !So() || !t.visualViewport ? Ss$1 : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function $s(e, t, o) {
	return t === void 0 && (t = !1), !o || t && o !== J(e) ? !1 : t;
}
function De(e, t, o, n) {
	t === void 0 && (t = !1), o === void 0 && (o = !1);
	const r = e.getBoundingClientRect(), s = $o$1(e);
	let i = ce$2(1);
	t && (n ? ne$1(n) && (i = We(n)) : i = We(e));
	const l = $s(s, o, n) ? Gn(s) : ce$2(0);
	let c = (r.left + l.x) / i.x, u = (r.top + l.y) / i.y, f = r.width / i.x, g = r.height / i.y;
	if (s) {
		const v = J(s), d = n && ne$1(n) ? J(n) : n;
		let h$1 = v, b = uo(h$1);
		for (; b && n && d !== h$1;) {
			const E = We(b), P = b.getBoundingClientRect(), T = re(b), R = P.left + (b.clientLeft + parseFloat(T.paddingLeft)) * E.x, p = P.top + (b.clientTop + parseFloat(T.paddingTop)) * E.y;
			c *= E.x, u *= E.y, f *= E.x, g *= E.y, c += R, u += p, h$1 = J(b), b = uo(h$1);
		}
	}
	return Nt({
		width: f,
		height: g,
		x: c,
		y: u
	});
}
function Kt$1(e, t) {
	const o = jt(e).scrollLeft;
	return t ? t.left + o : De(pe(e)).left + o;
}
function Wn$1(e, t) {
	const o = e.getBoundingClientRect();
	return {
		x: o.left + t.scrollLeft - Kt$1(e, o),
		y: o.top + t.scrollTop
	};
}
function Rs(e) {
	let { elements: t, rect: o, offsetParent: n, strategy: r } = e;
	const s = r === "fixed", i = pe(n), l = t ? Ut(t.floating) : !1;
	if (n === i || l && s) return o;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, u = ce$2(1);
	const f = ce$2(0), g = de(n);
	if ((g || !g && !s) && ((it$1(n) !== "body" || _t(i)) && (c = jt(n)), de(n))) {
		const d = De(n);
		u = We(n), f.x = d.x + n.clientLeft, f.y = d.y + n.clientTop;
	}
	const v = i && !g && !s ? Wn$1(i, c) : ce$2(0);
	return {
		width: o.width * u.x,
		height: o.height * u.y,
		x: o.x * u.x - c.scrollLeft * u.x + f.x + v.x,
		y: o.y * u.y - c.scrollTop * u.y + f.y + v.y
	};
}
function As$1(e) {
	return Array.from(e.getClientRects());
}
function Bs(e) {
	const t = pe(e), o = jt(e), n = e.ownerDocument.body, r = Y(t.scrollWidth, t.clientWidth, n.scrollWidth, n.clientWidth), s = Y(t.scrollHeight, t.clientHeight, n.scrollHeight, n.clientHeight);
	let i = -o.scrollLeft + Kt$1(e);
	const l = -o.scrollTop;
	return re(n).direction === "rtl" && (i += Y(t.clientWidth, n.clientWidth) - r), {
		width: r,
		height: s,
		x: i,
		y: l
	};
}
var Xo = 25;
function Ds(e, t) {
	const o = J(e), n = pe(e), r = o.visualViewport;
	let s = n.clientWidth, i = n.clientHeight, l = 0, c = 0;
	if (r) {
		s = r.width, i = r.height;
		const f = So();
		(!f || f && t === "fixed") && (l = r.offsetLeft, c = r.offsetTop);
	}
	const u = Kt$1(n);
	if (u <= 0) {
		const f = n.ownerDocument, g = f.body, v = getComputedStyle(g), d = f.compatMode === "CSS1Compat" && parseFloat(v.marginLeft) + parseFloat(v.marginRight) || 0, h$1 = Math.abs(n.clientWidth - g.clientWidth - d);
		h$1 <= Xo && (s -= h$1);
	} else u <= Xo && (s += u);
	return {
		width: s,
		height: i,
		x: l,
		y: c
	};
}
var Ms$1 = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function Vs(e, t) {
	const o = De(e, !0, t === "fixed"), n = o.top + e.clientTop, r = o.left + e.clientLeft, s = de(e) ? We(e) : ce$2(1);
	return {
		width: e.clientWidth * s.x,
		height: e.clientHeight * s.y,
		x: r * s.x,
		y: n * s.y
	};
}
function Yo$2(e, t, o) {
	let n;
	if (t === "viewport") n = Ds(e, o);
	else if (t === "document") n = Bs(pe(e));
	else if (ne$1(t)) n = Vs(t, o);
	else {
		const r = Gn(e);
		n = {
			x: t.x - r.x,
			y: t.y - r.y,
			width: t.width,
			height: t.height
		};
	}
	return Nt(n);
}
function Un(e, t) {
	const o = Ee(e);
	return o === t || !ne$1(o) || Ke(o) ? !1 : re(o).position === "fixed" || Un(o, t);
}
function Ls(e, t) {
	const o = t.get(e);
	if (o) return o;
	let n = mt(e, [], !1).filter((l) => ne$1(l) && it$1(l) !== "body"), r = null;
	const s = re(e).position === "fixed";
	let i = s ? Ee(e) : e;
	for (; ne$1(i) && !Ke(i);) {
		const l = re(i), c = Io(i);
		!c && l.position === "fixed" && (r = null), (s ? !c && !r : !c && l.position === "static" && !!r && Ms$1.has(r.position) || _t(i) && !c && Un(e, i)) ? n = n.filter((f) => f !== i) : r = l, i = Ee(i);
	}
	return t.set(e, n), n;
}
function Ns$1(e) {
	let { element: t, boundary: o, rootBoundary: n, strategy: r } = e;
	const i = [...o === "clippingAncestors" ? Ut(t) ? [] : Ls(t, this._c) : [].concat(o), n], l = i[0], c = i.reduce((u, f) => {
		const g = Yo$2(t, f, r);
		return u.top = Y(g.top, u.top), u.right = ke(g.right, u.right), u.bottom = ke(g.bottom, u.bottom), u.left = Y(g.left, u.left), u;
	}, Yo$2(t, l, r));
	return {
		width: c.right - c.left,
		height: c.bottom - c.top,
		x: c.left,
		y: c.top
	};
}
function Fs(e) {
	const { width: t, height: o } = Hn(e);
	return {
		width: t,
		height: o
	};
}
function zs(e, t, o) {
	const n = de(t), r = pe(t), s = o === "fixed", i = De(e, !0, s, t);
	let l = {
		scrollLeft: 0,
		scrollTop: 0
	};
	const c = ce$2(0);
	function u() {
		c.x = Kt$1(r);
	}
	if (n || !n && !s) if ((it$1(t) !== "body" || _t(r)) && (l = jt(t)), n) {
		const d = De(t, !0, s, t);
		c.x = d.x + t.clientLeft, c.y = d.y + t.clientTop;
	} else r && u();
	s && !n && r && u();
	const f = r && !n && !s ? Wn$1(r, l) : ce$2(0);
	return {
		x: i.left + l.scrollLeft - c.x - f.x,
		y: i.top + l.scrollTop - c.y - f.y,
		width: i.width,
		height: i.height
	};
}
function Jt(e) {
	return re(e).position === "static";
}
function Zo$1(e, t) {
	if (!de(e) || re(e).position === "fixed") return null;
	if (t) return t(e);
	let o = e.offsetParent;
	return pe(e) === o && (o = o.ownerDocument.body), o;
}
function jn(e, t) {
	const o = J(e);
	if (Ut(e)) return o;
	if (!de(e)) {
		let r = Ee(e);
		for (; r && !Ke(r);) {
			if (ne$1(r) && !Jt(r)) return r;
			r = Ee(r);
		}
		return o;
	}
	let n = Zo$1(e, t);
	for (; n && xs$1(n) && Jt(n);) n = Zo$1(n, t);
	return n && Ke(n) && Jt(n) && !Io(n) ? o : n || Ts$1(e) || o;
}
var Hs = async function(e) {
	const t = this.getOffsetParent || jn, o = this.getDimensions, n = await o(e.floating);
	return {
		reference: zs(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: n.width,
			height: n.height
		}
	};
};
function Gs(e) {
	return re(e).direction === "rtl";
}
var Ws = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Rs,
	getDocumentElement: pe,
	getClippingRect: Ns$1,
	getOffsetParent: jn,
	getElementRects: Hs,
	getClientRects: As$1,
	getDimensions: Fs,
	getScale: We,
	isElement: ne$1,
	isRTL: Gs
};
function Kn(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Us(e, t) {
	let o = null, n;
	const r = pe(e);
	function s() {
		var l;
		clearTimeout(n), (l = o) == null || l.disconnect(), o = null;
	}
	function i(l, c) {
		l === void 0 && (l = !1), c === void 0 && (c = 1), s();
		const u = e.getBoundingClientRect(), { left: f, top: g, width: v, height: d } = u;
		if (l || t(), !v || !d) return;
		const h$1 = Et(g), b = Et(r.clientWidth - (f + v)), E = Et(r.clientHeight - (g + d)), P = Et(f), R = {
			rootMargin: -h$1 + "px " + -b + "px " + -E + "px " + -P + "px",
			threshold: Y(0, ke(1, c)) || 1
		};
		let p = !0;
		function k$1(M$1) {
			const V = M$1[0].intersectionRatio;
			if (V !== c) {
				if (!p) return i();
				V ? i(!1, V) : n = setTimeout(() => {
					i(!1, 1e-7);
				}, 1e3);
			}
			V === 1 && !Kn(u, e.getBoundingClientRect()) && i(), p = !1;
		}
		try {
			o = new IntersectionObserver(k$1, {
				...R,
				root: r.ownerDocument
			});
		} catch {
			o = new IntersectionObserver(k$1, R);
		}
		o.observe(e);
	}
	return i(!0), s;
}
function js(e, t, o, n) {
	n === void 0 && (n = {});
	const { ancestorScroll: r = !0, ancestorResize: s = !0, elementResize: i = typeof ResizeObserver == "function", layoutShift: l = typeof IntersectionObserver == "function", animationFrame: c = !1 } = n, u = $o$1(e), f = r || s ? [...u ? mt(u) : [], ...mt(t)] : [];
	f.forEach((P) => {
		r && P.addEventListener("scroll", o, { passive: !0 }), s && P.addEventListener("resize", o);
	});
	const g = u && l ? Us(u, o) : null;
	let v = -1, d = null;
	i && (d = new ResizeObserver((P) => {
		let [T] = P;
		T && T.target === u && d && (d.unobserve(t), cancelAnimationFrame(v), v = requestAnimationFrame(() => {
			var R;
			(R = d) == null || R.observe(t);
		})), o();
	}), u && !c && d.observe(u), d.observe(t));
	let h$1, b = c ? De(e) : null;
	c && E();
	function E() {
		const P = De(e);
		b && !Kn(b, P) && o(), b = P, h$1 = requestAnimationFrame(E);
	}
	return o(), () => {
		var P;
		f.forEach((T) => {
			r && T.removeEventListener("scroll", o), s && T.removeEventListener("resize", o);
		}), g?.(), (P = d) == null || P.disconnect(), d = null, c && cancelAnimationFrame(h$1);
	};
}
var Ks = vs$1, qs = ys, Xs = gs, Ys = Cs$1, Zs = hs$1, Js = fs, Qs = bs$1, ei = (e, t, o) => {
	const n = /* @__PURE__ */ new Map(), r = {
		platform: Ws,
		...o
	}, s = {
		...r.platform,
		_c: n
	};
	return ps$1(e, t, {
		...r,
		platform: s
	});
};
function Jo$2(e = 0, t = 0, o = 0, n = 0) {
	if (typeof DOMRect == "function") return new DOMRect(e, t, o, n);
	const r = {
		x: e,
		y: t,
		width: o,
		height: n,
		top: t,
		right: e + o,
		bottom: t + n,
		left: e
	};
	return {
		...r,
		toJSON: () => r
	};
}
function ti(e) {
	if (!e) return Jo$2();
	const { x: t, y: o, width: n, height: r } = e;
	return Jo$2(t, o, n, r);
}
function oi(e, t) {
	return {
		contextElement: M(e) ? e : e?.contextElement,
		getBoundingClientRect: () => {
			const o = e, n = t?.(o);
			return n || !o ? ti(n) : o.getBoundingClientRect();
		}
	};
}
var lt = (e) => ({
	variable: e,
	reference: `var(${e})`
}), he = {
	arrowSize: lt("--arrow-size"),
	arrowSizeHalf: lt("--arrow-size-half"),
	arrowBg: lt("--arrow-background"),
	transformOrigin: lt("--transform-origin"),
	arrowOffset: lt("--arrow-offset")
}, ni = (e) => e === "top" || e === "bottom" ? "y" : "x";
function ri(e, t) {
	return {
		name: "transformOrigin",
		fn(o) {
			const { elements: n, middlewareData: r, placement: s, rects: i, y: l } = o, c = s.split("-")[0], u = ni(c), f = r.arrow?.x || 0, g = r.arrow?.y || 0, v = t?.clientWidth || 0, d = t?.clientHeight || 0, h$1 = f + v / 2, b = g + d / 2, E = Math.abs(r.shift?.y || 0), P = i.reference.height / 2, T = d / 2, R = e.offset?.mainAxis ?? e.gutter, p = typeof R == "number" ? R + T : R ?? T, k$1 = E > p, M$1 = {
				top: `${h$1}px calc(100% + ${p}px)`,
				bottom: `${h$1}px ${-p}px`,
				left: `calc(100% + ${p}px) ${b}px`,
				right: `${-p}px ${b}px`
			}[c], V = `${h$1}px ${i.reference.y + P - l}px`, z = !!e.overlap && u === "y" && k$1;
			return n.floating.style.setProperty(he.transformOrigin.variable, z ? V : M$1), { data: { transformOrigin: z ? V : M$1 } };
		}
	};
}
var si = {
	name: "rects",
	fn({ rects: e }) {
		return { data: e };
	}
}, ii = (e) => {
	if (e) return {
		name: "shiftArrow",
		fn({ placement: t, middlewareData: o }) {
			if (!o.arrow) return {};
			const { x: n, y: r } = o.arrow, s = t.split("-")[0];
			return Object.assign(e.style, {
				left: n != null ? `${n}px` : "",
				top: r != null ? `${r}px` : "",
				[s]: `calc(100% + ${he.arrowOffset.reference})`
			}), {};
		}
	};
};
function ai(e) {
	const [t, o] = e.split("-");
	return {
		side: t,
		align: o,
		hasAlign: o != null
	};
}
function li(e) {
	return e.split("-")[0];
}
var ci = {
	strategy: "absolute",
	placement: "bottom",
	listeners: !0,
	gutter: 8,
	flip: !0,
	slide: !0,
	overlap: !1,
	sameWidth: !1,
	fitViewport: !1,
	overflowPadding: 8,
	arrowPadding: 4
};
function Qo(e, t) {
	const o = e.devicePixelRatio || 1;
	return Math.round(t * o) / o;
}
function Ro(e) {
	return typeof e == "function" ? e() : e === "clipping-ancestors" ? "clippingAncestors" : e;
}
function di(e, t, o) {
	return Js({
		element: e || t.createElement("div"),
		padding: o.arrowPadding
	});
}
function ui(e, t) {
	if (!Ao(t.offset ?? t.gutter)) return Ks(({ placement: o }) => {
		const n = (e?.clientHeight || 0) / 2, r = t.offset?.mainAxis ?? t.gutter, s = typeof r == "number" ? r + n : r ?? n, { hasAlign: i } = ai(o), l = i ? void 0 : t.shift;
		return it({
			crossAxis: t.offset?.crossAxis ?? l,
			mainAxis: s,
			alignmentAxis: t.shift
		});
	});
}
function pi(e) {
	if (!e.flip) return;
	const t = Ro(e.boundary);
	return Xs({
		...t ? { boundary: t } : void 0,
		padding: e.overflowPadding,
		fallbackPlacements: e.flip === !0 ? void 0 : e.flip
	});
}
function fi(e) {
	if (!e.slide && !e.overlap) return;
	const t = Ro(e.boundary);
	return qs({
		...t ? { boundary: t } : void 0,
		mainAxis: e.slide,
		crossAxis: e.overlap,
		padding: e.overflowPadding,
		limiter: Qs()
	});
}
function gi(e) {
	return Ys({
		padding: e.overflowPadding,
		apply({ elements: t, rects: o, availableHeight: n, availableWidth: r }) {
			const s = t.floating, i = Math.round(o.reference.width), l = Math.round(o.reference.height);
			r = Math.floor(r), n = Math.floor(n), s.style.setProperty("--reference-width", `${i}px`), s.style.setProperty("--reference-height", `${l}px`), s.style.setProperty("--available-width", `${r}px`), s.style.setProperty("--available-height", `${n}px`);
		}
	});
}
function hi(e) {
	if (e.hideWhenDetached) return Zs({
		strategy: "referenceHidden",
		boundary: Ro(e.boundary) ?? "clippingAncestors"
	});
}
function mi(e) {
	return e ? e === !0 ? {
		ancestorResize: !0,
		ancestorScroll: !0,
		elementResize: !0,
		layoutShift: !0
	} : e : {};
}
function vi(e, t, o = {}) {
	const r = oi(o.getAnchorElement?.() ?? e, o.getAnchorRect);
	if (!t || !r) return;
	const s = Object.assign({}, ci, o), i = t.querySelector("[data-part=arrow]"), l = [
		ui(i, s),
		pi(s),
		fi(s),
		di(i, t.ownerDocument, s),
		ii(i),
		ri({
			gutter: s.gutter,
			offset: s.offset,
			overlap: s.overlap
		}, i),
		gi(s),
		hi(s),
		si
	], { placement: c, strategy: u, onComplete: f, onPositioned: g } = s, v = async () => {
		if (!r || !t) return;
		const E = await ei(r, t, {
			placement: c,
			middleware: l,
			strategy: u
		});
		f?.(E), g?.({ placed: !0 });
		const P = O(t), T = Qo(P, E.x), R = Qo(P, E.y);
		t.style.setProperty("--x", `${T}px`), t.style.setProperty("--y", `${R}px`), s.hideWhenDetached && (E.middlewareData.hide?.referenceHidden ? (t.style.setProperty("visibility", "hidden"), t.style.setProperty("pointer-events", "none")) : (t.style.removeProperty("visibility"), t.style.removeProperty("pointer-events")));
		const p = t.firstElementChild;
		if (p) {
			const k$1 = Gr(p);
			t.style.setProperty("--z-index", k$1.zIndex);
		}
	}, d = async () => {
		o.updatePosition ? (await o.updatePosition({
			updatePosition: v,
			floatingElement: t
		}), g?.({ placed: !0 })) : await v();
	}, h$1 = mi(s.listeners), b = s.listeners ? js(r, t, d, h$1) : No;
	return d(), () => {
		b?.(), g?.({ placed: !1 });
	};
}
function qe$1(e, t, o = {}) {
	const { defer: n, ...r } = o, s = n ? K : (l) => l(), i = [];
	return i.push(s(() => {
		const l = typeof e == "function" ? e() : e, c = typeof t == "function" ? t() : t;
		i.push(vi(l, c, r));
	})), () => {
		i.forEach((l) => l?.());
	};
}
var [bi, Bo$1] = ce$1("AccordionItemPropsContext");
Boolean;
var [Oi, _i] = ce$1("AccordionItemContext");
Boolean;
Boolean;
Boolean, Boolean;
Boolean, Boolean, Boolean;
ne("accordion").parts("root", "item", "itemTrigger", "itemContent", "itemIndicator").build();
var Ft = (e) => e.ids?.root ?? `accordion:${e.id}`, zt = (e, t) => e.ids?.itemTrigger?.(t) ?? `accordion:${e.id}:trigger:${t}`, Si = (e) => e.getById(Ft(e)), qt$1 = (e) => {
	const o = `[data-controls][data-ownedby='${CSS.escape(Ft(e))}']:not([disabled])`;
	return os(Si(e), o);
}, $i = (e) => go(qt$1(e)), Ri = (e) => mo(qt$1(e)), Ai = (e, t) => ss(qt$1(e), zt(e, t)), Bi = (e, t) => is(qt$1(e), zt(e, t)), { and: Mi, not: Vi } = $n();
ps({
	props({ props: e }) {
		return {
			collapsible: !1,
			multiple: !1,
			orientation: "vertical",
			defaultValue: [],
			...e
		};
	},
	initialState() {
		return "idle";
	},
	context({ prop: e, bindable: t }) {
		return {
			focusedValue: t(() => ({
				defaultValue: null,
				sync: !0,
				onChange(o) {
					e("onFocusChange")?.({ value: o });
				}
			})),
			value: t(() => ({
				defaultValue: e("defaultValue"),
				value: e("value"),
				onChange(o) {
					e("onValueChange")?.({ value: o });
				}
			}))
		};
	},
	computed: { isHorizontal: ({ prop: e }) => e("orientation") === "horizontal" },
	on: { "VALUE.SET": { actions: ["setValue"] } },
	states: {
		idle: { on: { "TRIGGER.FOCUS": {
			target: "focused",
			actions: ["setFocusedValue"]
		} } },
		focused: { on: {
			"GOTO.NEXT": { actions: ["focusNextTrigger"] },
			"GOTO.PREV": { actions: ["focusPrevTrigger"] },
			"TRIGGER.CLICK": [{
				guard: Mi("isExpanded", "canToggle"),
				actions: ["collapse"]
			}, {
				guard: Vi("isExpanded"),
				actions: ["expand"]
			}],
			"GOTO.FIRST": { actions: ["focusFirstTrigger"] },
			"GOTO.LAST": { actions: ["focusLastTrigger"] },
			"TRIGGER.BLUR": {
				target: "idle",
				actions: ["clearFocusedValue"]
			}
		} }
	},
	implementations: {
		guards: {
			canToggle: ({ prop: e }) => !!e("collapsible") || !!e("multiple"),
			isExpanded: ({ context: e, event: t }) => e.get("value").includes(t.value)
		},
		actions: {
			collapse({ context: e, prop: t, event: o }) {
				const n = t("multiple") ? lr(e.get("value"), o.value) : [];
				e.set("value", n);
			},
			expand({ context: e, prop: t, event: o }) {
				const n = t("multiple") ? ur(e.get("value"), o.value) : [o.value];
				e.set("value", n);
			},
			focusFirstTrigger({ scope: e }) {
				$i(e)?.focus();
			},
			focusLastTrigger({ scope: e }) {
				Ri(e)?.focus();
			},
			focusNextTrigger({ context: e, scope: t }) {
				const o = e.get("focusedValue");
				if (!o) return;
				Ai(t, o)?.focus();
			},
			focusPrevTrigger({ context: e, scope: t }) {
				const o = e.get("focusedValue");
				if (!o) return;
				Bi(t, o)?.focus();
			},
			setFocusedValue({ context: e, event: t }) {
				e.set("focusedValue", t.value);
			},
			clearFocusedValue({ context: e }) {
				e.set("focusedValue", null);
			},
			setValue({ context: e, event: t }) {
				e.set("value", t.value);
			},
			coarseValue({ context: e, prop: t }) {
				!t("multiple") && e.get("value").length > 1 && (qe("The value of accordion should be a single value when multiple is false."), e.set("value", [e.get("value")[0]]));
			}
		}
	}
});
Wn()([
	"collapsible",
	"dir",
	"disabled",
	"getRootNode",
	"id",
	"ids",
	"multiple",
	"onFocusChange",
	"onValueChange",
	"orientation",
	"value",
	"defaultValue"
]);
Wn()(["value", "disabled"]);
Boolean, Boolean, Boolean, Boolean, Boolean, Boolean;
Symbol.toStringTag;
Boolean, Boolean, Boolean, String, Array;
String, String, Boolean;
var [qn, xt] = ce$1("CheckboxContext"), Ji = /* @__PURE__ */ defineComponent({
	__name: "checkbox-context",
	setup(e) {
		const t = xt();
		return (o, n) => renderSlot(o.$slots, "default", normalizeProps(guardReactiveProps(unref(t))));
	}
}), Qi = /* @__PURE__ */ defineComponent({
	__name: "checkbox-control",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = xt();
		return vs(), (o, n) => (openBlock(), createBlock(unref(bs).div, mergeProps(unref(t).getControlProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
});
var Xn = ne("checkbox").parts("root", "label", "control", "indicator"), Tt = Xn.build(), Yn = (e) => e.ids?.root ?? `checkbox:${e.id}`, en = (e) => e.ids?.label ?? `checkbox:${e.id}:label`, ea = (e) => e.ids?.control ?? `checkbox:${e.id}:control`, po = (e) => e.ids?.hiddenInput ?? `checkbox:${e.id}:input`, ta = (e) => e.getById(Yn(e)), ft = (e) => e.getById(po(e));
function oa(e, t) {
	const { send: o, context: n, prop: r, computed: s, scope: i } = e, l = !!r("disabled"), c = !!r("readOnly"), u = !!r("required"), f = !!r("invalid"), g = !l && n.get("focused"), v = !l && n.get("focusVisible"), d = s("checked"), h$1 = s("indeterminate"), b = n.get("checked"), E = {
		"data-active": ko(n.get("active")),
		"data-focus": ko(g),
		"data-focus-visible": ko(v),
		"data-readonly": ko(c),
		"data-hover": ko(n.get("hovered")),
		"data-disabled": ko(l),
		"data-state": h$1 ? "indeterminate" : d ? "checked" : "unchecked",
		"data-invalid": ko(f),
		"data-required": ko(u)
	};
	return {
		checked: d,
		disabled: l,
		indeterminate: h$1,
		focused: g,
		checkedState: b,
		setChecked(P) {
			o({
				type: "CHECKED.SET",
				checked: P,
				isTrusted: !1
			});
		},
		toggleChecked() {
			o({
				type: "CHECKED.TOGGLE",
				checked: d,
				isTrusted: !1
			});
		},
		getRootProps() {
			return t.label({
				...Tt.root.attrs,
				...E,
				dir: r("dir"),
				id: Yn(i),
				htmlFor: po(i),
				onPointerMove() {
					l || o({
						type: "CONTEXT.SET",
						context: { hovered: !0 }
					});
				},
				onPointerLeave() {
					l || o({
						type: "CONTEXT.SET",
						context: { hovered: !1 }
					});
				},
				onClick(P) {
					Se(P) === ft(i) && P.stopPropagation();
				}
			});
		},
		getLabelProps() {
			return t.element({
				...Tt.label.attrs,
				...E,
				dir: r("dir"),
				id: en(i)
			});
		},
		getControlProps() {
			return t.element({
				...Tt.control.attrs,
				...E,
				dir: r("dir"),
				id: ea(i),
				"aria-hidden": !0
			});
		},
		getIndicatorProps() {
			return t.element({
				...Tt.indicator.attrs,
				...E,
				dir: r("dir"),
				hidden: !h$1 && !d
			});
		},
		getHiddenInputProps() {
			return t.input({
				id: po(i),
				type: "checkbox",
				required: r("required"),
				defaultChecked: d,
				disabled: l,
				"aria-labelledby": en(i),
				"aria-invalid": f,
				name: r("name"),
				form: r("form"),
				value: r("value"),
				style: ds,
				onFocus() {
					o({
						type: "CONTEXT.SET",
						context: {
							focused: !0,
							focusVisible: wt()
						}
					});
				},
				onBlur() {
					o({
						type: "CONTEXT.SET",
						context: {
							focused: !1,
							focusVisible: !1
						}
					});
				},
				onClick(P) {
					if (c) {
						P.preventDefault();
						return;
					}
					const T = P.currentTarget.checked;
					o({
						type: "CHECKED.SET",
						checked: T,
						isTrusted: !0
					});
				}
			});
		}
	};
}
var { not: tn } = $n(), na = ps({
	props({ props: e }) {
		return {
			value: "on",
			...e,
			defaultChecked: e.defaultChecked ?? !1
		};
	},
	initialState() {
		return "ready";
	},
	context({ prop: e, bindable: t }) {
		return {
			checked: t(() => ({
				defaultValue: e("defaultChecked"),
				value: e("checked"),
				onChange(o) {
					e("onCheckedChange")?.({ checked: o });
				}
			})),
			fieldsetDisabled: t(() => ({ defaultValue: !1 })),
			focusVisible: t(() => ({ defaultValue: !1 })),
			active: t(() => ({ defaultValue: !1 })),
			focused: t(() => ({ defaultValue: !1 })),
			hovered: t(() => ({ defaultValue: !1 }))
		};
	},
	watch({ track: e, context: t, prop: o, action: n }) {
		e([() => o("disabled")], () => {
			n(["removeFocusIfNeeded"]);
		}), e([() => t.get("checked")], () => {
			n(["syncInputElement"]);
		});
	},
	effects: [
		"trackFormControlState",
		"trackPressEvent",
		"trackFocusVisible"
	],
	on: {
		"CHECKED.TOGGLE": [{
			guard: tn("isTrusted"),
			actions: ["toggleChecked", "dispatchChangeEvent"]
		}, { actions: ["toggleChecked"] }],
		"CHECKED.SET": [{
			guard: tn("isTrusted"),
			actions: ["setChecked", "dispatchChangeEvent"]
		}, { actions: ["setChecked"] }],
		"CONTEXT.SET": { actions: ["setContext"] }
	},
	computed: {
		indeterminate: ({ context: e }) => Dt(e.get("checked")),
		checked: ({ context: e }) => ra(e.get("checked")),
		disabled: ({ context: e, prop: t }) => !!t("disabled") || e.get("fieldsetDisabled")
	},
	states: { ready: {} },
	implementations: {
		guards: { isTrusted: ({ event: e }) => !!e.isTrusted },
		effects: {
			trackPressEvent({ context: e, computed: t, scope: o }) {
				if (!t("disabled")) return rs({
					pointerNode: ta(o),
					keyboardNode: ft(o),
					isValidKey: (n) => n.key === " ",
					onPress: () => e.set("active", !1),
					onPressStart: () => e.set("active", !0),
					onPressEnd: () => e.set("active", !1)
				});
			},
			trackFocusVisible({ computed: e, scope: t }) {
				if (!e("disabled")) return ss$1({ root: t.getRootNode?.() });
			},
			trackFormControlState({ context: e, scope: t }) {
				return Ho(ft(t), {
					onFieldsetDisabledChange(o) {
						e.set("fieldsetDisabled", o);
					},
					onFormReset() {
						e.set("checked", e.initial("checked"));
					}
				});
			}
		},
		actions: {
			setContext({ context: e, event: t }) {
				for (const o in t.context) e.set(o, t.context[o]);
			},
			syncInputElement({ context: e, computed: t, scope: o }) {
				const n = ft(o);
				n && (an(n, t("checked")), n.indeterminate = Dt(e.get("checked")));
			},
			removeFocusIfNeeded({ context: e, prop: t }) {
				t("disabled") && e.get("focused") && (e.set("focused", !1), e.set("focusVisible", !1));
			},
			setChecked({ context: e, event: t }) {
				e.set("checked", t.checked);
			},
			toggleChecked({ context: e, computed: t }) {
				const o = Dt(t("checked")) ? !0 : !t("checked");
				e.set("checked", o);
			},
			dispatchChangeEvent({ computed: e, scope: t }) {
				queueMicrotask(() => {
					qo(ft(t), { checked: e("checked") });
				});
			}
		}
	}
});
function Dt(e) {
	return e === "indeterminate";
}
function ra(e) {
	return Dt(e) ? !1 : !!e;
}
Wn()([
	"defaultChecked",
	"checked",
	"dir",
	"disabled",
	"form",
	"getRootNode",
	"id",
	"ids",
	"invalid",
	"name",
	"onCheckedChange",
	"readOnly",
	"required",
	"value"
]);
var Zn = Xn.extendWith("group");
function sa(e, t, o, n = {}) {
	const { passive: r = !1, eventName: s, defaultValue: i } = n, l = getCurrentInstance(), c = o || l?.emit || l?.$emit?.bind(l) || l?.proxy?.$emit?.bind(l?.proxy), u = t, f = () => e[u] ?? i, g = (v) => {
		if (!s) c(s || `update:${u.toString()}`, v);
		else for (const d of s) c(d, v);
	};
	if (r) {
		const d = ref(f());
		let h$1 = !1;
		return watch(() => e[u], (b) => {
			h$1 || (h$1 = !0, d.value = b, nextTick(() => {
				h$1 = !1;
			}));
		}), watch(d, (b) => {
			!h$1 && b !== e[u] && g(b);
		}), d;
	}
	return computed({
		get() {
			return f();
		},
		set(v) {
			g(v);
		}
	});
}
function ia(e, t) {
	const o = rs$1(), n = computed(() => e.disabled ?? o?.value?.disabled), r = computed(() => e.invalid ?? o?.value?.invalid), s = computed(() => !(n.value || e.readOnly)), { defaultValue: i } = toRefs(e), l = sa(e, "modelValue", t, {
		defaultValue: i?.value ?? [],
		passive: e.modelValue === void 0,
		eventName: ["valueChange", "update:modelValue"]
	}), c = (h$1) => l.value.some((b) => String(b) === String(h$1)), u = (h$1) => {
		c(h$1) ? g(h$1) : f(h$1);
	}, f = (h$1) => {
		s.value && (c(h$1) || (l.value = l.value.concat(h$1)));
	}, g = (h$1) => {
		s.value && (l.value = l.value.filter((b) => String(b) !== String(h$1)));
	}, v = (h$1) => ({
		checked: h$1.value != null ? c(h$1.value) : void 0,
		onCheckedChange() {
			h$1.value != null && u(h$1.value);
		},
		name: e.name,
		disabled: as(n.value),
		readOnly: e.readOnly,
		invalid: r.value
	}), d = (h$1) => {
		l.value = h$1;
	};
	return computed(() => ({
		isChecked: c,
		value: l.value,
		name: e.name,
		disabled: as(n.value),
		readOnly: e.readOnly,
		invalid: r.value,
		addValue: f,
		setValue: d,
		toggleValue: u,
		getItemProps: v
	}));
}
var [Jn$1, aa] = ce$1("CheckboxGroupContext"), la = /* @__PURE__ */ defineComponent({
	__name: "checkbox-group",
	props: /* @__PURE__ */ mergeDefaults({
		defaultValue: {},
		modelValue: {},
		disabled: { type: Boolean },
		readOnly: { type: Boolean },
		name: {},
		invalid: { type: Boolean },
		asChild: { type: Boolean }
	}, {
		disabled: void 0,
		readOnly: void 0,
		invalid: void 0
	}),
	emits: ["valueChange", "update:modelValue"],
	setup(e, { emit: t }) {
		return Jn$1(ia(e, t)), vs(), (s, i) => (openBlock(), createBlock(unref(bs).div, mergeProps({ role: "group" }, { ...unref(Zn).build().group.attrs }, { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(s.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ca = /* @__PURE__ */ defineComponent({
	__name: "checkbox-group-provider",
	props: {
		value: {},
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e;
		return Jn$1(computed(() => t.value)), vs(), (n, r) => (openBlock(), createBlock(unref(bs).div, mergeProps({ role: "group" }, unref(Zn).build().group.attrs, { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), [Iu, Xt$1] = ce$1("FieldContext"), da = /* @__PURE__ */ defineComponent({
	__name: "checkbox-hidden-input",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = xt(), o = Xt$1();
		return vs(), (n, r) => (openBlock(), createBlock(unref(bs).input, mergeProps({ "aria-describedby": unref(o)?.ariaDescribedby }, unref(t).getHiddenInputProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n.$slots, "default")]),
			_: 3
		}, 16, ["aria-describedby", "as-child"]));
	}
}), ua = /* @__PURE__ */ defineComponent({
	__name: "checkbox-indicator",
	props: {
		indeterminate: { type: Boolean },
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e, o = xt(), n = computed(() => t.indeterminate ? o.value.indeterminate : o.value.checked);
		return vs(), (r, s) => (openBlock(), createBlock(unref(bs).div, mergeProps(unref(o).getIndicatorProps(), {
			hidden: !n.value,
			"as-child": e.asChild
		}), {
			default: withCtx(() => [renderSlot(r.$slots, "default")]),
			_: 3
		}, 16, ["hidden", "as-child"]));
	}
}), pa = /* @__PURE__ */ defineComponent({
	__name: "checkbox-label",
	props: { asChild: { type: Boolean } },
	setup(e) {
		const t = xt();
		return vs(), (o, n) => (openBlock(), createBlock(unref(bs).span, mergeProps(unref(t).getLabelProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(o.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), fa = /* @__PURE__ */ defineComponent({
	__name: "checkbox-root-provider",
	props: {
		value: {},
		asChild: { type: Boolean }
	},
	setup(e) {
		const t = e, o = computed(() => t.value);
		return qn(o), vs(), (n, r) => (openBlock(), createBlock(unref(bs).label, mergeProps(o.value.getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(n.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), ga = (e = {}, t) => {
	const o = useId(), n = hs(ws), r = As(xs), s = Xt$1(), i = aa(), l = computed(() => {
		const f = toValue(e);
		return Vn(f, i?.value.getItemProps({ value: f.value }) ?? {});
	}), u = Jn(na, computed(() => {
		const f = toValue(l);
		return {
			id: o,
			ids: {
				label: s?.value.ids.label,
				hiddenInput: s?.value.ids.control
			},
			disabled: s?.value.disabled,
			readOnly: s?.value.readOnly,
			invalid: s?.value.invalid,
			required: s?.value.required,
			dir: r.value.dir,
			getRootNode: n?.value.getRootNode,
			...Cs(f),
			onCheckedChange(g) {
				t?.("checkedChange", g), t?.("update:checked", g.checked), f.onCheckedChange?.(g);
			}
		};
	}));
	return computed(() => oa(u, ms));
}, ha = /* @__PURE__ */ defineComponent({
	__name: "checkbox-root",
	props: /* @__PURE__ */ mergeDefaults({
		checked: {},
		defaultChecked: {},
		disabled: { type: Boolean },
		form: {},
		id: {},
		ids: {},
		invalid: { type: Boolean },
		name: {},
		readOnly: { type: Boolean },
		required: { type: Boolean },
		value: {},
		asChild: { type: Boolean }
	}, {
		checked: void 0,
		defaultChecked: void 0,
		disabled: void 0,
		invalid: void 0,
		readOnly: void 0,
		required: void 0
	}),
	emits: ["checkedChange", "update:checked"],
	setup(e, { emit: t }) {
		const r = ga(e, t);
		return qn(r), vs(), (s, i) => (openBlock(), createBlock(unref(bs).label, mergeProps(unref(r).getRootProps(), { "as-child": e.asChild }), {
			default: withCtx(() => [renderSlot(s.$slots, "default")]),
			_: 3
		}, 16, ["as-child"]));
	}
}), Ve = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
	__proto__: null,
	Context: Ji,
	Control: Qi,
	Group: la,
	GroupProvider: ca,
	HiddenInput: da,
	Indicator: ua,
	Label: pa,
	Root: ha,
	RootProvider: fa
}, Symbol.toStringTag, { value: "Module" })), ma = {
	modelValue: {
		type: [Boolean, String],
		default: !1
	},
	size: {
		type: String,
		default: "md"
	},
	disabled: {
		type: Boolean,
		default: !1
	},
	invalid: {
		type: Boolean,
		default: !1
	}
}, va = "group inline-flex w-fit items-start gap-3 rounded-[var(--ui-radius-md)] focus-within:ring-2 focus-within:ring-[var(--ui-ring)]", ya = "inline-flex shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-on-primary)] transition-[background-color,border-color,box-shadow,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] group-hover:border-[var(--ui-primary-muted)] data-[state=checked]:border-[var(--ui-primary)] data-[state=checked]:bg-[var(--ui-primary)] data-[state=indeterminate]:border-[var(--ui-primary)] data-[state=indeterminate]:bg-[var(--ui-primary)]", eo = {
	default: "",
	invalid: "border-[var(--ui-critical)] data-[state=checked]:border-[var(--ui-critical)] data-[state=checked]:bg-[var(--ui-critical)] data-[state=indeterminate]:border-[var(--ui-critical)] data-[state=indeterminate]:bg-[var(--ui-critical)]",
	disabled: "opacity-50"
}, ba = {
	sm: "mt-0.5 size-4",
	md: "mt-0.5 size-5"
}, Ca = {
	sm: "size-3",
	md: "size-3.5"
}, Oa = "text-[var(--ui-fg)]", _a = "text-sm text-[var(--ui-fg-muted)]", xa = {
	key: 0,
	viewBox: "0 0 16 16",
	fill: "none",
	class: "size-full",
	"aria-hidden": "true"
}, Pa = [/* @__PURE__ */ createElementVNode("path", {
	d: "M3.5 8h9",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, null, -1)], ka = {
	key: 1,
	viewBox: "0 0 16 16",
	fill: "none",
	class: "size-full",
	"aria-hidden": "true"
}, Ta = [/* @__PURE__ */ createElementVNode("path", {
	d: "M3.5 8.5 6.5 11.5 12.5 4.5",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
}, null, -1)], Ia = {
	key: 0,
	class: "flex flex-col gap-1"
}, Su = /* @__PURE__ */ defineComponent({
	inheritAttrs: !1,
	__name: "Checkbox",
	props: ma,
	emits: ["update:modelValue"],
	setup(e, { emit: t }) {
		const o = t, n = useAttrs(), r = useSlots(), s = e, i = computed(() => ir(va, normalizeClass(n.class))), l = computed(() => ir(ya, ba[s.size], s.invalid ? eo.invalid : eo.default, s.disabled ? eo.disabled : "")), c = computed(() => {
			const { class: f, ...g } = n;
			return g;
		});
		function u(f) {
			o("update:modelValue", f);
		}
		return (f, g) => (openBlock(), createBlock(unref(Ve).Root, mergeProps({
			checked: s.modelValue,
			disabled: s.disabled,
			invalid: s.invalid,
			class: i.value
		}, c.value, { "onUpdate:checked": u }), {
			default: withCtx(() => [
				createVNode(unref(Ve).HiddenInput),
				createVNode(unref(Ve).Control, { class: normalizeClass(l.value) }, {
					default: withCtx(() => [createVNode(unref(Ve).Context, null, {
						default: withCtx((v) => [createVNode(unref(Ve).Indicator, { class: normalizeClass(unref(Ca)[s.size]) }, {
							default: withCtx(() => [v.checked === "indeterminate" ? (openBlock(), createElementBlock("svg", xa, Pa)) : (openBlock(), createElementBlock("svg", ka, Ta))]),
							_: 2
						}, 1032, ["class"])]),
						_: 1
					})]),
					_: 1
				}, 8, ["class"]),
				unref(r).default || unref(r).description ? (openBlock(), createElementBlock("div", Ia, [unref(r).default ? (openBlock(), createBlock(unref(Ve).Label, {
					key: 0,
					class: normalizeClass(unref(Oa))
				}, {
					default: withCtx(() => [renderSlot(f.$slots, "default")]),
					_: 3
				}, 8, ["class"])) : createCommentVNode("", !0), unref(r).description ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass(unref(_a))
				}, [renderSlot(f.$slots, "description")], 2)) : createCommentVNode("", !0)])) : createCommentVNode("", !0)
			]),
			_: 3
		}, 16, [
			"checked",
			"disabled",
			"invalid",
			"class"
		]));
	}
}), Sa = {
	title: {
		type: String,
		default: void 0
	},
	description: {
		type: String,
		default: void 0
	},
	size: {
		type: String,
		default: "md"
	},
	showClose: {
		type: Boolean,
		default: !0
	},
	closeOnEscape: {
		type: Boolean,
		default: !0
	},
	closeOnInteractOutside: {
		type: Boolean,
		default: !0
	}
}, $a = "fixed inset-0 z-40 bg-[var(--ui-fg)]/40 backdrop-blur-sm", Ra = "fixed inset-0 z-50 grid place-items-center p-4", Aa = "w-full overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-md)]", Ba = {
	sm: "max-w-md",
	md: "max-w-lg",
	lg: "max-w-2xl",
	xl: "max-w-4xl"
}, Da = "flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-4 py-3", Ma = "text-base font-semibold text-[var(--ui-fg)]", Va = "mt-1 text-sm text-[var(--ui-fg-muted)]", La = "px-4 py-4", Na = "flex items-center justify-end gap-3 border-t border-[var(--ui-border)] px-4 py-3", Fa = "inline-flex size-9 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] text-[var(--ui-fg-muted)] transition-[border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:border-[var(--ui-primary-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]", za = { class: "min-w-0 flex-1" }, Ha = /* @__PURE__ */ createElementVNode("svg", {
	viewBox: "0 0 24 24",
	fill: "none",
	class: "size-4",
	"aria-hidden": "true"
}, [/* @__PURE__ */ createElementVNode("path", {
	d: "M6 6l12 12M18 6 6 18",
	stroke: "currentColor",
	"stroke-width": "1.75",
	"stroke-linecap": "round"
})], -1), $u = /* @__PURE__ */ defineComponent({
	__name: "Dialog",
	props: /* @__PURE__ */ mergeModels(Sa, {
		open: {
			type: Boolean,
			default: !1
		},
		openModifiers: {}
	}),
	emits: ["update:open"],
	setup(e) {
		const t = useModel(e, "open"), o = e, n = useSlots(), r = computed(() => !!(o.title || o.description || n.header || o.showClose));
		return (s, i) => (openBlock(), createBlock(unref(br).Root, {
			open: t.value,
			"onUpdate:open": i[0] || (i[0] = (l) => t.value = l),
			"close-on-escape": o.closeOnEscape,
			"close-on-interact-outside": o.closeOnInteractOutside,
			"lazy-mount": "",
			"unmount-on-exit": ""
		}, {
			default: withCtx(() => [
				s.$slots.trigger ? (openBlock(), createBlock(unref(br).Trigger, {
					key: 0,
					"as-child": ""
				}, {
					default: withCtx(() => [renderSlot(s.$slots, "trigger")]),
					_: 3
				})) : createCommentVNode("", !0),
				createVNode(unref(br).Backdrop, { class: normalizeClass(unref($a)) }, null, 8, ["class"]),
				createVNode(unref(br).Positioner, { class: normalizeClass(unref(Ra)) }, {
					default: withCtx(() => [createVNode(unref(br).Content, { class: normalizeClass([unref(Aa), unref(Ba)[o.size]]) }, {
						default: withCtx(() => [
							r.value ? (openBlock(), createElementBlock("div", {
								key: 0,
								class: normalizeClass(unref(Da))
							}, [renderSlot(s.$slots, "header", {}, () => [createElementVNode("div", za, [o.title ? (openBlock(), createBlock(unref(br).Title, {
								key: 0,
								class: normalizeClass(unref(Ma))
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(o.title), 1)]),
								_: 1
							}, 8, ["class"])) : createCommentVNode("", !0), o.description ? (openBlock(), createBlock(unref(br).Description, {
								key: 1,
								class: normalizeClass(unref(Va))
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(o.description), 1)]),
								_: 1
							}, 8, ["class"])) : createCommentVNode("", !0)])]), o.showClose ? (openBlock(), createBlock(unref(br).CloseTrigger, {
								key: 0,
								class: normalizeClass(unref(Fa)),
								"aria-label": "Close dialog"
							}, {
								default: withCtx(() => [Ha]),
								_: 1
							}, 8, ["class"])) : createCommentVNode("", !0)], 2)) : createCommentVNode("", !0),
							createElementVNode("div", { class: normalizeClass(unref(La)) }, [renderSlot(s.$slots, "default")], 2),
							s.$slots.footer ? (openBlock(), createElementBlock("div", {
								key: 1,
								class: normalizeClass(unref(Na))
							}, [renderSlot(s.$slots, "footer")], 2)) : createCommentVNode("", !0)
						]),
						_: 3
					}, 8, ["class"])]),
					_: 3
				}, 8, ["class"])
			]),
			_: 3
		}, 8, [
			"open",
			"close-on-escape",
			"close-on-interact-outside"
		]));
	}
});
String, String, String, String, Boolean, Boolean, Boolean;
Boolean;
var [Qn, G] = ce$1("MenuContext");
Boolean;
Boolean;
var [Do$1, il] = ce$1("MenuItemContext"), [Yt$1, er] = ce$1("MenuItemPropsContext");
Boolean, Boolean, Boolean, Boolean;
Boolean;
Boolean;
Boolean;
var [tr, or] = ce$1("MenuItemGroupContext");
Boolean;
Boolean;
Boolean;
Boolean;
Boolean, Boolean, Boolean;
Boolean;
Boolean;
Boolean, Boolean, Boolean;
var [nr, rr] = ce$1("MenuMachineContext"), [sr, Ol] = ce$1("MenuTriggerItemContext");
Boolean, Boolean, Boolean;
var gt = (e, t) => ({
	x: e,
	y: t
});
function xl(e) {
	const { x: t, y: o, width: n, height: r } = e, s = t + n / 2, i = o + r / 2;
	return {
		x: t,
		y: o,
		width: n,
		height: r,
		minX: t,
		minY: o,
		maxX: t + n,
		maxY: o + r,
		midX: s,
		midY: i,
		center: gt(s, i)
	};
}
function wl(e) {
	return {
		top: gt(e.minX, e.minY),
		right: gt(e.maxX, e.minY),
		bottom: gt(e.maxX, e.maxY),
		left: gt(e.minX, e.maxY)
	};
}
function Pl(e, t) {
	const { top: n, right: r, left: s, bottom: i } = wl(xl(e)), [l] = t.split("-");
	return {
		top: [
			s,
			n,
			r,
			i
		],
		right: [
			n,
			r,
			i,
			s
		],
		bottom: [
			n,
			s,
			i,
			r
		],
		left: [
			r,
			n,
			s,
			i
		]
	}[l];
}
function kl(e, t) {
	const { x: o, y: n } = t;
	let r = !1;
	for (let s = 0, i = e.length - 1; s < e.length; i = s++) {
		const l = e[s].x, c = e[s].y, u = e[i].x, f = e[i].y;
		c > n != f > n && o < (u - l) * (n - c) / (f - c) + l && (r = !r);
	}
	return r;
}
ne("menu").parts("arrow", "arrowTip", "content", "contextTrigger", "indicator", "item", "itemGroup", "itemGroupLabel", "itemIndicator", "itemText", "positioner", "separator", "trigger", "triggerItem").build();
var Ht$1 = (e) => e.ids?.trigger ?? `menu:${e.id}:trigger`, ir$1 = (e) => e.ids?.contextTrigger ?? `menu:${e.id}:ctx-trigger`, He = (e) => e.ids?.content ?? `menu:${e.id}:content`, ar = (e) => e.ids?.positioner ?? `menu:${e.id}:popper`, vt = (e, t) => `${e.id}/${t}`, Ae = (e) => e?.dataset.value ?? null, xe = (e) => e.getById(He(e)), nn = (e) => e.getById(ar(e)), It = (e) => e.getById(Ht$1(e)), Sl = (e, t) => t ? e.getById(vt(e, t)) : null, to = (e) => e.getById(ir$1(e)), wt$1 = (e) => {
	const o = `[role^="menuitem"][data-ownedby=${CSS.escape(He(e))}]:not([data-disabled])`;
	return os(xe(e), o);
}, $l = (e) => go(wt$1(e)), Rl = (e) => mo(wt$1(e)), Mo$1 = (e, t) => t ? e.id === t || e.dataset.value === t : !1, Al = (e, t) => {
	const o = wt$1(e);
	return ho(o, o.findIndex((r) => Mo$1(r, t.value)), { loop: t.loop ?? t.loopFocus });
}, Bl = (e, t) => {
	const o = wt$1(e);
	return wo(o, o.findIndex((r) => Mo$1(r, t.value)), { loop: t.loop ?? t.loopFocus });
}, Dl = (e, t) => {
	const o = wt$1(e), n = o.find((r) => Mo$1(r, t.value));
	return ls(o, {
		state: t.typeaheadState,
		key: t.key,
		activeId: n?.id ?? null
	});
}, Ml = (e) => !!e?.getAttribute("role")?.startsWith("menuitem") && !!e?.hasAttribute("data-controls"), fo = "menu:select";
function Vl(e, t) {
	if (!e) return;
	const n = new (O(e)).CustomEvent(fo, { detail: { value: t } });
	e.dispatchEvent(n);
}
var { not: ee, and: Le, or: Nl } = $n();
ps({
	props({ props: e }) {
		return {
			closeOnSelect: !0,
			typeahead: !0,
			composite: !0,
			loopFocus: !1,
			navigate(t) {
				es(t.node);
			},
			...e,
			positioning: {
				placement: "bottom-start",
				gutter: 8,
				...e.positioning
			}
		};
	},
	initialState({ prop: e }) {
		return e("open") || e("defaultOpen") ? "open" : "idle";
	},
	context({ bindable: e, prop: t }) {
		return {
			suspendPointer: e(() => ({ defaultValue: !1 })),
			highlightedValue: e(() => ({
				defaultValue: t("defaultHighlightedValue") || null,
				value: t("highlightedValue"),
				onChange(o) {
					t("onHighlightChange")?.({ highlightedValue: o });
				}
			})),
			lastHighlightedValue: e(() => ({ defaultValue: null })),
			currentPlacement: e(() => ({ defaultValue: void 0 })),
			intentPolygon: e(() => ({ defaultValue: null })),
			anchorPoint: e(() => ({
				defaultValue: null,
				hash(o) {
					return `x: ${o?.x}, y: ${o?.y}`;
				}
			})),
			isSubmenu: e(() => ({ defaultValue: !1 }))
		};
	},
	refs() {
		return {
			parent: null,
			children: {},
			typeaheadState: { ...ls.defaultOptions },
			positioningOverride: {}
		};
	},
	computed: {
		isRtl: ({ prop: e }) => e("dir") === "rtl",
		isTypingAhead: ({ refs: e }) => e.get("typeaheadState").keysSoFar !== "",
		highlightedId: ({ context: e, scope: t, refs: o }) => Hl(o.get("children"), e.get("highlightedValue"), t)
	},
	watch({ track: e, action: t, context: o, prop: n }) {
		e([() => o.get("isSubmenu")], () => {
			t(["setSubmenuPlacement"]);
		}), e([() => o.hash("anchorPoint")], () => {
			o.get("anchorPoint") && t(["reposition"]);
		}), e([() => n("open")], () => {
			t(["toggleVisibility"]);
		});
	},
	on: {
		"PARENT.SET": { actions: ["setParentMenu"] },
		"CHILD.SET": { actions: ["setChildMenu"] },
		OPEN: [{
			guard: "isOpenControlled",
			actions: ["invokeOnOpen"]
		}, {
			target: "open",
			actions: ["invokeOnOpen"]
		}],
		OPEN_AUTOFOCUS: [{
			guard: "isOpenControlled",
			actions: ["invokeOnOpen"]
		}, {
			target: "open",
			actions: ["highlightFirstItem", "invokeOnOpen"]
		}],
		CLOSE: [{
			guard: "isOpenControlled",
			actions: ["invokeOnClose"]
		}, {
			target: "closed",
			actions: ["invokeOnClose"]
		}],
		"HIGHLIGHTED.RESTORE": { actions: ["restoreHighlightedItem"] },
		"HIGHLIGHTED.SET": { actions: ["setHighlightedItem"] }
	},
	states: {
		idle: {
			tags: ["closed"],
			on: {
				"CONTROLLED.OPEN": { target: "open" },
				"CONTROLLED.CLOSE": { target: "closed" },
				CONTEXT_MENU_START: {
					target: "opening:contextmenu",
					actions: ["setAnchorPoint"]
				},
				CONTEXT_MENU: [{
					guard: "isOpenControlled",
					actions: ["setAnchorPoint", "invokeOnOpen"]
				}, {
					target: "open",
					actions: ["setAnchorPoint", "invokeOnOpen"]
				}],
				TRIGGER_CLICK: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}],
				TRIGGER_FOCUS: {
					guard: ee("isSubmenu"),
					target: "closed"
				},
				TRIGGER_POINTERMOVE: {
					guard: "isSubmenu",
					target: "opening"
				}
			}
		},
		"opening:contextmenu": {
			tags: ["closed"],
			effects: ["waitForLongPress"],
			on: {
				"CONTROLLED.OPEN": { target: "open" },
				"CONTROLLED.CLOSE": { target: "closed" },
				CONTEXT_MENU_CANCEL: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"LONG_PRESS.OPEN": [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}]
			}
		},
		opening: {
			tags: ["closed"],
			effects: ["waitForOpenDelay"],
			on: {
				"CONTROLLED.OPEN": { target: "open" },
				"CONTROLLED.CLOSE": { target: "closed" },
				BLUR: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				TRIGGER_POINTERLEAVE: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"DELAY.OPEN": [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}]
			}
		},
		closing: {
			tags: ["open"],
			effects: [
				"trackPointerMove",
				"trackInteractOutside",
				"waitForCloseDelay"
			],
			on: {
				"CONTROLLED.OPEN": { target: "open" },
				"CONTROLLED.CLOSE": {
					target: "closed",
					actions: ["focusParentMenu", "restoreParentHighlightedItem"]
				},
				MENU_POINTERENTER: {
					target: "open",
					actions: ["clearIntentPolygon"]
				},
				POINTER_MOVED_AWAY_FROM_SUBMENU: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["focusParentMenu", "restoreParentHighlightedItem"]
				}],
				"DELAY.CLOSE": [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: [
						"focusParentMenu",
						"restoreParentHighlightedItem",
						"invokeOnClose"
					]
				}]
			}
		},
		closed: {
			tags: ["closed"],
			entry: [
				"clearHighlightedItem",
				"focusTrigger",
				"resumePointer",
				"clearAnchorPoint"
			],
			on: {
				"CONTROLLED.OPEN": [
					{
						guard: Nl("isOpenAutoFocusEvent", "isArrowDownEvent"),
						target: "open",
						actions: ["highlightFirstItem"]
					},
					{
						guard: "isArrowUpEvent",
						target: "open",
						actions: ["highlightLastItem"]
					},
					{ target: "open" }
				],
				CONTEXT_MENU_START: {
					target: "opening:contextmenu",
					actions: ["setAnchorPoint"]
				},
				CONTEXT_MENU: [{
					guard: "isOpenControlled",
					actions: ["setAnchorPoint", "invokeOnOpen"]
				}, {
					target: "open",
					actions: ["setAnchorPoint", "invokeOnOpen"]
				}],
				TRIGGER_CLICK: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}],
				TRIGGER_POINTERMOVE: {
					guard: "isTriggerItem",
					target: "opening"
				},
				TRIGGER_BLUR: { target: "idle" },
				ARROW_DOWN: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["highlightFirstItem", "invokeOnOpen"]
				}],
				ARROW_UP: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["highlightLastItem", "invokeOnOpen"]
				}]
			}
		},
		open: {
			tags: ["open"],
			effects: [
				"trackInteractOutside",
				"trackPositioning",
				"scrollToHighlightedItem"
			],
			entry: ["focusMenu", "resumePointer"],
			on: {
				"CONTROLLED.CLOSE": [{
					target: "closed",
					guard: "isArrowLeftEvent",
					actions: ["focusParentMenu"]
				}, { target: "closed" }],
				TRIGGER_CLICK: [{
					guard: Le(ee("isTriggerItem"), "isOpenControlled"),
					actions: ["invokeOnClose"]
				}, {
					guard: ee("isTriggerItem"),
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				CONTEXT_MENU: { actions: ["setAnchorPoint", "focusMenu"] },
				ARROW_UP: { actions: ["highlightPrevItem", "focusMenu"] },
				ARROW_DOWN: { actions: ["highlightNextItem", "focusMenu"] },
				ARROW_LEFT: [{
					guard: Le("isSubmenu", "isOpenControlled"),
					actions: ["invokeOnClose"]
				}, {
					guard: "isSubmenu",
					target: "closed",
					actions: ["focusParentMenu", "invokeOnClose"]
				}],
				HOME: { actions: ["highlightFirstItem", "focusMenu"] },
				END: { actions: ["highlightLastItem", "focusMenu"] },
				ARROW_RIGHT: {
					guard: "isTriggerItemHighlighted",
					actions: ["openSubmenu"]
				},
				ENTER: [{
					guard: "isTriggerItemHighlighted",
					actions: ["openSubmenu"]
				}, { actions: ["clickHighlightedItem"] }],
				ITEM_POINTERMOVE: [{
					guard: ee("isPointerSuspended"),
					actions: ["setHighlightedItem", "focusMenu"]
				}, { actions: ["setLastHighlightedItem"] }],
				ITEM_POINTERLEAVE: {
					guard: Le(ee("isPointerSuspended"), ee("isTriggerItem")),
					actions: ["clearHighlightedItem"]
				},
				ITEM_CLICK: [
					{
						guard: Le(ee("isTriggerItemHighlighted"), ee("isHighlightedItemEditable"), "closeOnSelect", "isOpenControlled"),
						actions: [
							"invokeOnSelect",
							"setOptionState",
							"closeRootMenu",
							"invokeOnClose"
						]
					},
					{
						guard: Le(ee("isTriggerItemHighlighted"), ee("isHighlightedItemEditable"), "closeOnSelect"),
						target: "closed",
						actions: [
							"invokeOnSelect",
							"setOptionState",
							"closeRootMenu",
							"invokeOnClose"
						]
					},
					{
						guard: Le(ee("isTriggerItemHighlighted"), ee("isHighlightedItemEditable")),
						actions: ["invokeOnSelect", "setOptionState"]
					},
					{ actions: ["setHighlightedItem"] }
				],
				TRIGGER_POINTERMOVE: {
					guard: "isTriggerItem",
					actions: ["setIntentPolygon"]
				},
				TRIGGER_POINTERLEAVE: { target: "closing" },
				ITEM_POINTERDOWN: { actions: ["setHighlightedItem"] },
				TYPEAHEAD: { actions: ["highlightMatchedItem"] },
				FOCUS_MENU: { actions: ["focusMenu"] },
				"POSITIONING.SET": { actions: ["reposition"] }
			}
		}
	},
	implementations: {
		guards: {
			closeOnSelect: ({ prop: e, event: t }) => !!(t?.closeOnSelect ?? e("closeOnSelect")),
			isTriggerItem: ({ event: e }) => Ml(e.target),
			isTriggerItemHighlighted: ({ event: e, scope: t, computed: o }) => !!(e.target ?? t.getById(o("highlightedId")))?.hasAttribute("data-controls"),
			isSubmenu: ({ context: e }) => e.get("isSubmenu"),
			isPointerSuspended: ({ context: e }) => e.get("suspendPointer"),
			isHighlightedItemEditable: ({ scope: e, computed: t }) => zr(e.getById(t("highlightedId"))),
			isOpenControlled: ({ prop: e }) => e("open") !== void 0,
			isArrowLeftEvent: ({ event: e }) => e.previousEvent?.type === "ARROW_LEFT",
			isArrowUpEvent: ({ event: e }) => e.previousEvent?.type === "ARROW_UP",
			isArrowDownEvent: ({ event: e }) => e.previousEvent?.type === "ARROW_DOWN",
			isOpenAutoFocusEvent: ({ event: e }) => e.previousEvent?.type === "OPEN_AUTOFOCUS"
		},
		effects: {
			waitForOpenDelay({ send: e }) {
				const t = setTimeout(() => {
					e({ type: "DELAY.OPEN" });
				}, 100);
				return () => clearTimeout(t);
			},
			waitForCloseDelay({ send: e }) {
				const t = setTimeout(() => {
					e({ type: "DELAY.CLOSE" });
				}, 300);
				return () => clearTimeout(t);
			},
			waitForLongPress({ send: e }) {
				const t = setTimeout(() => {
					e({ type: "LONG_PRESS.OPEN" });
				}, 700);
				return () => clearTimeout(t);
			},
			trackPositioning({ context: e, prop: t, scope: o, refs: n }) {
				if (to(o)) return;
				const r = {
					...t("positioning"),
					...n.get("positioningOverride")
				};
				e.set("currentPlacement", r.placement);
				const s = () => nn(o);
				return qe$1(It(o), s, {
					...r,
					defer: !0,
					onComplete(i) {
						e.set("currentPlacement", i.placement);
					}
				});
			},
			trackInteractOutside({ refs: e, scope: t, prop: o, context: n, send: r }) {
				const s = () => xe(t);
				let i = !0;
				return Yo$1(s, {
					type: "menu",
					defer: !0,
					exclude: [It(t)],
					onInteractOutside: o("onInteractOutside"),
					onRequestDismiss: o("onRequestDismiss"),
					onFocusOutside(l) {
						o("onFocusOutside")?.(l);
						const c = Se(l.detail.originalEvent);
						if (jr(to(t), c)) {
							l.preventDefault();
							return;
						}
					},
					onEscapeKeyDown(l) {
						o("onEscapeKeyDown")?.(l), n.get("isSubmenu") && l.preventDefault(), rn({ parent: e.get("parent") });
					},
					onPointerDownOutside(l) {
						o("onPointerDownOutside")?.(l);
						const c = Se(l.detail.originalEvent);
						if (jr(to(t), c) && l.detail.contextmenu) {
							l.preventDefault();
							return;
						}
						i = !l.detail.focusable;
					},
					onDismiss() {
						r({
							type: "CLOSE",
							src: "interact-outside",
							restoreFocus: i
						});
					}
				});
			},
			trackPointerMove({ context: e, scope: t, send: o, refs: n, flush: r }) {
				const s = n.get("parent");
				r(() => {
					s.context.set("suspendPointer", !0);
				});
				return _(t.getDoc(), "pointermove", (l) => {
					zl(e.get("intentPolygon"), {
						x: l.clientX,
						y: l.clientY
					}) || (o({ type: "POINTER_MOVED_AWAY_FROM_SUBMENU" }), s.context.set("suspendPointer", !1));
				});
			},
			scrollToHighlightedItem({ event: e, scope: t, computed: o }) {
				const n = () => {
					if (e.current().type.startsWith("ITEM_POINTER")) return;
					ts(t.getById(o("highlightedId")), {
						rootEl: xe(t),
						block: "nearest"
					});
				};
				return K(() => n()), Yo(() => xe(t), {
					attributes: ["aria-activedescendant"],
					callback: n
				});
			}
		},
		actions: {
			setAnchorPoint({ context: e, event: t }) {
				e.set("anchorPoint", (o) => Te(o, t.point) ? o : t.point);
			},
			setSubmenuPlacement({ context: e, computed: t, refs: o }) {
				if (!e.get("isSubmenu")) return;
				const n = t("isRtl") ? "left-start" : "right-start";
				o.set("positioningOverride", {
					placement: n,
					gutter: 0
				});
			},
			reposition({ context: e, scope: t, prop: o, event: n, refs: r }) {
				const s = () => nn(t), i = e.get("anchorPoint"), l = i ? () => ({
					width: 0,
					height: 0,
					...i
				}) : void 0, c = {
					...o("positioning"),
					...r.get("positioningOverride")
				};
				qe$1(It(t), s, {
					...c,
					defer: !0,
					getAnchorRect: l,
					...n.options ?? {},
					listeners: !1,
					onComplete(u) {
						e.set("currentPlacement", u.placement);
					}
				});
			},
			setOptionState({ event: e }) {
				if (!e.option) return;
				const { checked: t, onCheckedChange: o, type: n } = e.option;
				n === "radio" ? o?.(!0) : n === "checkbox" && o?.(!t);
			},
			clickHighlightedItem({ scope: e, computed: t, prop: o, context: n }) {
				const r = e.getById(t("highlightedId"));
				if (!r || r.dataset.disabled) return;
				const s = n.get("highlightedValue");
				Mo(r) ? o("navigate")?.({
					value: s,
					node: r,
					href: r.href
				}) : queueMicrotask(() => r.click());
			},
			setIntentPolygon({ context: e, scope: t, event: o }) {
				const n = xe(t), r = e.get("currentPlacement");
				if (!n || !r) return;
				const i = Pl(n.getBoundingClientRect(), r);
				if (!i) return;
				const c = li(r) === "right" ? -5 : 5;
				e.set("intentPolygon", [{
					...o.point,
					x: o.point.x + c
				}, ...i]);
			},
			clearIntentPolygon({ context: e }) {
				e.set("intentPolygon", null);
			},
			clearAnchorPoint({ context: e }) {
				e.set("anchorPoint", null);
			},
			resumePointer({ refs: e, flush: t }) {
				const o = e.get("parent");
				o && t(() => {
					o.context.set("suspendPointer", !1);
				});
			},
			setHighlightedItem({ context: e, event: t }) {
				const o = t.value || Ae(t.target);
				e.set("highlightedValue", o);
			},
			clearHighlightedItem({ context: e }) {
				e.set("highlightedValue", null);
			},
			focusMenu({ scope: e }) {
				K(() => {
					const t = xe(e);
					Zo({
						root: t,
						enabled: !jr(t, e.getActiveElement()),
						filter(n) {
							return !n.role?.startsWith("menuitem");
						}
					})?.focus({ preventScroll: !0 });
				});
			},
			highlightFirstItem({ context: e, scope: t }) {
				(xe(t) ? queueMicrotask : K)(() => {
					const n = $l(t);
					n && e.set("highlightedValue", Ae(n));
				});
			},
			highlightLastItem({ context: e, scope: t }) {
				(xe(t) ? queueMicrotask : K)(() => {
					const n = Rl(t);
					n && e.set("highlightedValue", Ae(n));
				});
			},
			highlightNextItem({ context: e, scope: t, event: o, prop: n }) {
				const r = Al(t, {
					loop: o.loop,
					value: e.get("highlightedValue"),
					loopFocus: n("loopFocus")
				});
				e.set("highlightedValue", Ae(r));
			},
			highlightPrevItem({ context: e, scope: t, event: o, prop: n }) {
				const r = Bl(t, {
					loop: o.loop,
					value: e.get("highlightedValue"),
					loopFocus: n("loopFocus")
				});
				e.set("highlightedValue", Ae(r));
			},
			invokeOnSelect({ context: e, prop: t, scope: o }) {
				const n = e.get("highlightedValue");
				if (n == null) return;
				Vl(Sl(o, n), n), t("onSelect")?.({ value: n });
			},
			focusTrigger({ scope: e, context: t, event: o }) {
				t.get("isSubmenu") || t.get("anchorPoint") || o.restoreFocus === !1 || queueMicrotask(() => It(e)?.focus({ preventScroll: !0 }));
			},
			highlightMatchedItem({ scope: e, context: t, event: o, refs: n }) {
				const r = Dl(e, {
					key: o.key,
					value: t.get("highlightedValue"),
					typeaheadState: n.get("typeaheadState")
				});
				r && t.set("highlightedValue", Ae(r));
			},
			setParentMenu({ refs: e, event: t, context: o }) {
				e.set("parent", t.value), o.set("isSubmenu", !0);
			},
			setChildMenu({ refs: e, event: t }) {
				const o = e.get("children");
				o[t.id] = t.value, e.set("children", o);
			},
			closeRootMenu({ refs: e }) {
				rn({ parent: e.get("parent") });
			},
			openSubmenu({ refs: e, scope: t, computed: o }) {
				const r = t.getById(o("highlightedId"))?.getAttribute("data-uid"), s = e.get("children");
				(r ? s[r] : null)?.send({ type: "OPEN_AUTOFOCUS" });
			},
			focusParentMenu({ refs: e }) {
				e.get("parent")?.send({ type: "FOCUS_MENU" });
			},
			setLastHighlightedItem({ context: e, event: t }) {
				e.set("lastHighlightedValue", Ae(t.target));
			},
			restoreHighlightedItem({ context: e }) {
				e.get("lastHighlightedValue") && (e.set("highlightedValue", e.get("lastHighlightedValue")), e.set("lastHighlightedValue", null));
			},
			restoreParentHighlightedItem({ refs: e }) {
				e.get("parent")?.send({ type: "HIGHLIGHTED.RESTORE" });
			},
			invokeOnOpen({ prop: e }) {
				e("onOpenChange")?.({ open: !0 });
			},
			invokeOnClose({ prop: e }) {
				e("onOpenChange")?.({ open: !1 });
			},
			toggleVisibility({ prop: e, event: t, send: o }) {
				o({
					type: e("open") ? "CONTROLLED.OPEN" : "CONTROLLED.CLOSE",
					previousEvent: t
				});
			}
		}
	}
});
function rn(e) {
	let t = e.parent;
	for (; t && t.context.get("isSubmenu");) t = t.refs.get("parent");
	t?.send({ type: "CLOSE" });
}
function zl(e, t) {
	return e ? kl(e, t) : !1;
}
function Hl(e, t, o) {
	const n = Object.keys(e).length > 0;
	if (!t) return null;
	if (!n) return vt(o, t);
	for (const r in e) {
		const s = e[r], i = Ht$1(s.scope);
		if (i === t) return i;
	}
	return vt(o, t);
}
Wn()([
	"anchorPoint",
	"aria-label",
	"closeOnSelect",
	"composite",
	"defaultHighlightedValue",
	"defaultOpen",
	"dir",
	"getRootNode",
	"highlightedValue",
	"id",
	"ids",
	"loopFocus",
	"navigate",
	"onEscapeKeyDown",
	"onFocusOutside",
	"onHighlightChange",
	"onInteractOutside",
	"onOpenChange",
	"onPointerDownOutside",
	"onRequestDismiss",
	"onSelect",
	"open",
	"positioning",
	"typeahead"
]);
Wn()([
	"closeOnSelect",
	"disabled",
	"value",
	"valueText"
]);
Wn()(["htmlFor"]);
Wn()(["id"]);
Wn()([
	"checked",
	"closeOnSelect",
	"disabled",
	"onCheckedChange",
	"type",
	"value",
	"valueText"
]);
Boolean, Boolean, Boolean, Boolean, Function, Boolean, Boolean, Boolean, Boolean, Boolean;
Boolean;
Boolean;
Boolean;
Symbol.toStringTag;
Array, String, Boolean;
Boolean;
var [lr$1, ie] = ce$1("PopoverContext");
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean;
Boolean, Boolean;
ne("popover").parts("arrow", "arrowTip", "anchor", "trigger", "indicator", "positioner", "content", "title", "description", "closeTrigger").build();
var cr = (e) => e.ids?.anchor ?? `popover:${e.id}:anchor`, dr = (e) => e.ids?.trigger ?? `popover:${e.id}:trigger`, go$1 = (e) => e.ids?.content ?? `popover:${e.id}:content`, ur$1 = (e) => e.ids?.positioner ?? `popover:${e.id}:popper`, ho$1 = (e) => e.ids?.title ?? `popover:${e.id}:title`, mo$1 = (e) => e.ids?.description ?? `popover:${e.id}:desc`, sn = (e) => e.getById(cr(e)), Ne = (e) => e.getById(dr(e)), Fe = (e) => e.getById(go$1(e)), an$1 = (e) => e.getById(ur$1(e)), fc = (e) => e.getById(ho$1(e)), gc = (e) => e.getById(mo$1(e));
ps({
	props({ props: e }) {
		return {
			closeOnInteractOutside: !0,
			closeOnEscape: !0,
			autoFocus: !0,
			modal: !1,
			portalled: !0,
			...e,
			positioning: {
				placement: "bottom",
				...e.positioning
			}
		};
	},
	initialState({ prop: e }) {
		return e("open") || e("defaultOpen") ? "open" : "closed";
	},
	context({ bindable: e }) {
		return {
			currentPlacement: e(() => ({ defaultValue: void 0 })),
			renderedElements: e(() => ({ defaultValue: {
				title: !0,
				description: !0
			} }))
		};
	},
	computed: { currentPortalled: ({ prop: e }) => !!e("modal") || !!e("portalled") },
	watch({ track: e, prop: t, action: o }) {
		e([() => t("open")], () => {
			o(["toggleVisibility"]);
		});
	},
	entry: ["checkRenderedElements"],
	states: {
		closed: { on: {
			"CONTROLLED.OPEN": {
				target: "open",
				actions: ["setInitialFocus"]
			},
			TOGGLE: [{
				guard: "isOpenControlled",
				actions: ["invokeOnOpen"]
			}, {
				target: "open",
				actions: ["invokeOnOpen", "setInitialFocus"]
			}],
			OPEN: [{
				guard: "isOpenControlled",
				actions: ["invokeOnOpen"]
			}, {
				target: "open",
				actions: ["invokeOnOpen", "setInitialFocus"]
			}]
		} },
		open: {
			effects: [
				"trapFocus",
				"preventScroll",
				"hideContentBelow",
				"trackPositioning",
				"trackDismissableElement",
				"proxyTabFocus"
			],
			on: {
				"CONTROLLED.CLOSE": {
					target: "closed",
					actions: ["setFinalFocus"]
				},
				CLOSE: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose", "setFinalFocus"]
				}],
				TOGGLE: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"POSITIONING.SET": { actions: ["reposition"] }
			}
		}
	},
	implementations: {
		guards: { isOpenControlled: ({ prop: e }) => e("open") != null },
		effects: {
			trackPositioning({ context: e, prop: t, scope: o }) {
				e.set("currentPlacement", t("positioning").placement);
				return qe$1(sn(o) ?? Ne(o), () => an$1(o), {
					...t("positioning"),
					defer: !0,
					onComplete(s) {
						e.set("currentPlacement", s.placement);
					}
				});
			},
			trackDismissableElement({ send: e, prop: t, scope: o }) {
				const n = () => Fe(o);
				let r = !0;
				return Yo$1(n, {
					type: "popover",
					pointerBlocking: t("modal"),
					exclude: Ne(o),
					defer: !0,
					onEscapeKeyDown(s) {
						t("onEscapeKeyDown")?.(s), !t("closeOnEscape") && s.preventDefault();
					},
					onInteractOutside(s) {
						t("onInteractOutside")?.(s), !s.defaultPrevented && (r = !(s.detail.focusable || s.detail.contextmenu), t("closeOnInteractOutside") || s.preventDefault());
					},
					onPointerDownOutside: t("onPointerDownOutside"),
					onFocusOutside: t("onFocusOutside"),
					persistentElements: t("persistentElements"),
					onRequestDismiss: t("onRequestDismiss"),
					onDismiss() {
						e({
							type: "CLOSE",
							src: "interact-outside",
							restoreFocus: r
						});
					}
				});
			},
			proxyTabFocus({ prop: e, scope: t }) {
				return e("modal") || !e("portalled") ? void 0 : ns(() => Fe(t), {
					triggerElement: Ne(t),
					defer: !0,
					getShadowRoot: !0,
					onFocus(n) {
						n.focus({ preventScroll: !0 });
					}
				});
			},
			hideContentBelow({ prop: e, scope: t }) {
				return e("modal") ? Es(() => [Fe(t), Ne(t)], { defer: !0 }) : void 0;
			},
			preventScroll({ prop: e, scope: t }) {
				if (e("modal")) return Is(t.getDoc());
			},
			trapFocus({ prop: e, scope: t }) {
				return e("modal") ? ws$1(() => Fe(t), {
					initialFocus: () => Zo({
						root: Fe(t),
						getInitialEl: e("initialFocusEl"),
						enabled: e("autoFocus")
					}),
					getShadowRoot: !0
				}) : void 0;
			}
		},
		actions: {
			reposition({ event: e, prop: t, scope: o, context: n }) {
				qe$1(sn(o) ?? Ne(o), () => an$1(o), {
					...t("positioning"),
					...e.options,
					defer: !0,
					listeners: !1,
					onComplete(i) {
						n.set("currentPlacement", i.placement);
					}
				});
			},
			checkRenderedElements({ context: e, scope: t }) {
				K(() => {
					Object.assign(e.get("renderedElements"), {
						title: !!fc(t),
						description: !!gc(t)
					});
				});
			},
			setInitialFocus({ prop: e, scope: t }) {
				e("modal") || K(() => {
					Zo({
						root: Fe(t),
						getInitialEl: e("initialFocusEl"),
						enabled: e("autoFocus")
					})?.focus({ preventScroll: !0 });
				});
			},
			setFinalFocus({ event: e, scope: t }) {
				const o = e.restoreFocus ?? e.previousEvent?.restoreFocus;
				o != null && !o || K(() => {
					Ne(t)?.focus({ preventScroll: !0 });
				});
			},
			invokeOnOpen({ prop: e, flush: t }) {
				t(() => {
					e("onOpenChange")?.({ open: !0 });
				});
			},
			invokeOnClose({ prop: e, flush: t }) {
				t(() => {
					e("onOpenChange")?.({ open: !1 });
				});
			},
			toggleVisibility({ event: e, send: t, prop: o }) {
				t({
					type: o("open") ? "CONTROLLED.OPEN" : "CONTROLLED.CLOSE",
					previousEvent: e
				});
			}
		}
	}
});
Wn()([
	"autoFocus",
	"closeOnEscape",
	"closeOnInteractOutside",
	"dir",
	"getRootNode",
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
	"portalled",
	"positioning"
]);
Boolean, Boolean, Boolean, Boolean, Function, Boolean, Boolean, Boolean, Boolean, Boolean;
Boolean;
Boolean;
Symbol.toStringTag;
String, String, String, Boolean, Boolean;
Boolean;
String, Array, String, String, Boolean, Boolean;
String, String, Number, Boolean;
String, String;
var [pr, Pt] = ce$1("SwitchContext");
Boolean;
Boolean;
Boolean;
Boolean;
ne("switch").parts("root", "label", "control", "thumb").build();
var fr = (e) => e.ids?.root ?? `switch:${e.id}`, vo = (e) => e.ids?.hiddenInput ?? `switch:${e.id}:input`, fd = (e) => e.getById(fr(e)), Ge = (e) => e.getById(vo(e)), { not: cn } = $n();
ps({
	props({ props: e }) {
		return {
			defaultChecked: !1,
			label: "switch",
			value: "on",
			...e
		};
	},
	initialState() {
		return "ready";
	},
	context({ prop: e, bindable: t }) {
		return {
			checked: t(() => ({
				defaultValue: e("defaultChecked"),
				value: e("checked"),
				onChange(o) {
					e("onCheckedChange")?.({ checked: o });
				}
			})),
			fieldsetDisabled: t(() => ({ defaultValue: !1 })),
			focusVisible: t(() => ({ defaultValue: !1 })),
			active: t(() => ({ defaultValue: !1 })),
			focused: t(() => ({ defaultValue: !1 })),
			hovered: t(() => ({ defaultValue: !1 }))
		};
	},
	computed: { isDisabled: ({ context: e, prop: t }) => t("disabled") || e.get("fieldsetDisabled") },
	watch({ track: e, prop: t, context: o, action: n }) {
		e([() => t("disabled")], () => {
			n(["removeFocusIfNeeded"]);
		}), e([() => o.get("checked")], () => {
			n(["syncInputElement"]);
		});
	},
	effects: [
		"trackFormControlState",
		"trackPressEvent",
		"trackFocusVisible"
	],
	on: {
		"CHECKED.TOGGLE": [{
			guard: cn("isTrusted"),
			actions: ["toggleChecked", "dispatchChangeEvent"]
		}, { actions: ["toggleChecked"] }],
		"CHECKED.SET": [{
			guard: cn("isTrusted"),
			actions: ["setChecked", "dispatchChangeEvent"]
		}, { actions: ["setChecked"] }],
		"CONTEXT.SET": { actions: ["setContext"] }
	},
	states: { ready: {} },
	implementations: {
		guards: { isTrusted: ({ event: e }) => !!e.isTrusted },
		effects: {
			trackPressEvent({ computed: e, scope: t, context: o }) {
				if (!e("isDisabled")) return rs({
					pointerNode: fd(t),
					keyboardNode: Ge(t),
					isValidKey: (n) => n.key === " ",
					onPress: () => o.set("active", !1),
					onPressStart: () => o.set("active", !0),
					onPressEnd: () => o.set("active", !1)
				});
			},
			trackFocusVisible({ computed: e, scope: t }) {
				if (!e("isDisabled")) return ss$1({ root: t.getRootNode() });
			},
			trackFormControlState({ context: e, send: t, scope: o }) {
				return Ho(Ge(o), {
					onFieldsetDisabledChange(n) {
						e.set("fieldsetDisabled", n);
					},
					onFormReset() {
						t({
							type: "CHECKED.SET",
							checked: !!e.initial("checked"),
							src: "form-reset"
						});
					}
				});
			}
		},
		actions: {
			setContext({ context: e, event: t }) {
				for (const o in t.context) e.set(o, t.context[o]);
			},
			syncInputElement({ context: e, scope: t }) {
				const o = Ge(t);
				o && an(o, !!e.get("checked"));
			},
			removeFocusIfNeeded({ context: e, prop: t }) {
				t("disabled") && e.set("focused", !1);
			},
			setChecked({ context: e, event: t }) {
				e.set("checked", t.checked);
			},
			toggleChecked({ context: e }) {
				e.set("checked", !e.get("checked"));
			},
			dispatchChangeEvent({ context: e, scope: t }) {
				qo(Ge(t), { checked: e.get("checked") });
			}
		}
	}
});
Wn()([
	"checked",
	"defaultChecked",
	"dir",
	"disabled",
	"form",
	"getRootNode",
	"id",
	"ids",
	"invalid",
	"label",
	"name",
	"onCheckedChange",
	"readOnly",
	"required",
	"value"
]);
Boolean, Boolean, Boolean, Boolean, Boolean, Boolean, Boolean;
Boolean;
Symbol.toStringTag;
Boolean, String, Boolean, Boolean;
var [gr$1, at] = ce$1("TooltipContext");
Boolean;
Boolean;
Boolean;
Boolean;
Boolean, Boolean;
ne("tooltip").parts("trigger", "arrow", "arrowTip", "positioner", "content").build();
var hr = (e) => e.ids?.trigger ?? `tooltip:${e.id}:trigger`, mr = (e) => e.ids?.positioner ?? `tooltip:${e.id}:popper`, ro = (e) => e.getById(hr(e)), dn = (e) => e.getById(mr(e)), me = Po({ id: null }), { and: Ld, not: un } = $n();
ps({
	initialState: ({ prop: e }) => e("open") || e("defaultOpen") ? "open" : "closed",
	props({ props: e }) {
		const t = e.closeOnClick ?? !0, o = e.closeOnPointerDown ?? t;
		return {
			id: "x",
			openDelay: 400,
			closeDelay: 150,
			closeOnEscape: !0,
			interactive: !1,
			closeOnScroll: !0,
			disabled: !1,
			...e,
			closeOnPointerDown: o,
			closeOnClick: t,
			positioning: {
				placement: "bottom",
				...e.positioning
			}
		};
	},
	effects: ["trackFocusVisible", "trackStore"],
	context: ({ bindable: e }) => ({
		currentPlacement: e(() => ({ defaultValue: void 0 })),
		hasPointerMoveOpened: e(() => ({ defaultValue: !1 }))
	}),
	watch({ track: e, action: t, prop: o }) {
		e([() => o("disabled")], () => {
			t(["closeIfDisabled"]);
		}), e([() => o("open")], () => {
			t(["toggleVisibility"]);
		});
	},
	states: {
		closed: {
			entry: ["clearGlobalId"],
			on: {
				"controlled.open": { target: "open" },
				open: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}],
				"pointer.leave": { actions: ["clearPointerMoveOpened"] },
				"pointer.move": [{
					guard: Ld("noVisibleTooltip", un("hasPointerMoveOpened")),
					target: "opening"
				}, {
					guard: un("hasPointerMoveOpened"),
					target: "open",
					actions: ["setPointerMoveOpened", "invokeOnOpen"]
				}]
			}
		},
		opening: {
			effects: [
				"trackScroll",
				"trackPointerlockChange",
				"waitForOpenDelay"
			],
			on: {
				"after.openDelay": [{
					guard: "isOpenControlled",
					actions: ["setPointerMoveOpened", "invokeOnOpen"]
				}, {
					target: "open",
					actions: ["setPointerMoveOpened", "invokeOnOpen"]
				}],
				"controlled.open": { target: "open" },
				"controlled.close": { target: "closed" },
				open: [{
					guard: "isOpenControlled",
					actions: ["invokeOnOpen"]
				}, {
					target: "open",
					actions: ["invokeOnOpen"]
				}],
				"pointer.leave": [{
					guard: "isOpenControlled",
					actions: [
						"clearPointerMoveOpened",
						"invokeOnClose",
						"toggleVisibility"
					]
				}, {
					target: "closed",
					actions: ["clearPointerMoveOpened", "invokeOnClose"]
				}],
				close: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose", "toggleVisibility"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}]
			}
		},
		open: {
			effects: [
				"trackEscapeKey",
				"trackScroll",
				"trackPointerlockChange",
				"trackPositioning"
			],
			entry: ["setGlobalId"],
			on: {
				"controlled.close": { target: "closed" },
				close: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"pointer.leave": [
					{
						guard: "isVisible",
						target: "closing",
						actions: ["clearPointerMoveOpened"]
					},
					{
						guard: "isOpenControlled",
						actions: ["clearPointerMoveOpened", "invokeOnClose"]
					},
					{
						target: "closed",
						actions: ["clearPointerMoveOpened", "invokeOnClose"]
					}
				],
				"content.pointer.leave": {
					guard: "isInteractive",
					target: "closing"
				},
				"positioning.set": { actions: ["reposition"] }
			}
		},
		closing: {
			effects: ["trackPositioning", "waitForCloseDelay"],
			on: {
				"after.closeDelay": [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"controlled.close": { target: "closed" },
				"controlled.open": { target: "open" },
				close: [{
					guard: "isOpenControlled",
					actions: ["invokeOnClose"]
				}, {
					target: "closed",
					actions: ["invokeOnClose"]
				}],
				"pointer.move": [{
					guard: "isOpenControlled",
					actions: [
						"setPointerMoveOpened",
						"invokeOnOpen",
						"toggleVisibility"
					]
				}, {
					target: "open",
					actions: ["setPointerMoveOpened", "invokeOnOpen"]
				}],
				"content.pointer.move": {
					guard: "isInteractive",
					target: "open"
				},
				"positioning.set": { actions: ["reposition"] }
			}
		}
	},
	implementations: {
		guards: {
			noVisibleTooltip: () => me.get("id") === null,
			isVisible: ({ prop: e }) => e("id") === me.get("id"),
			isInteractive: ({ prop: e }) => !!e("interactive"),
			hasPointerMoveOpened: ({ context: e }) => e.get("hasPointerMoveOpened"),
			isOpenControlled: ({ prop: e }) => e("open") !== void 0
		},
		actions: {
			setGlobalId: ({ prop: e }) => {
				me.set("id", e("id"));
			},
			clearGlobalId: ({ prop: e }) => {
				e("id") === me.get("id") && me.set("id", null);
			},
			invokeOnOpen: ({ prop: e }) => {
				e("onOpenChange")?.({ open: !0 });
			},
			invokeOnClose: ({ prop: e }) => {
				e("onOpenChange")?.({ open: !1 });
			},
			closeIfDisabled: ({ prop: e, send: t }) => {
				e("disabled") && t({
					type: "close",
					src: "disabled.change"
				});
			},
			reposition: ({ context: e, event: t, prop: o, scope: n }) => {
				if (t.type !== "positioning.set") return;
				const r = () => dn(n);
				return qe$1(ro(n), r, {
					...o("positioning"),
					...t.options,
					defer: !0,
					listeners: !1,
					onComplete(s) {
						e.set("currentPlacement", s.placement);
					}
				});
			},
			toggleVisibility: ({ prop: e, event: t, send: o }) => {
				queueMicrotask(() => {
					o({
						type: e("open") ? "controlled.open" : "controlled.close",
						previousEvent: t
					});
				});
			},
			setPointerMoveOpened: ({ context: e }) => {
				e.set("hasPointerMoveOpened", !0);
			},
			clearPointerMoveOpened: ({ context: e }) => {
				e.set("hasPointerMoveOpened", !1);
			}
		},
		effects: {
			trackFocusVisible: ({ scope: e }) => ss$1({ root: e.getRootNode?.() }),
			trackPositioning: ({ context: e, prop: t, scope: o }) => {
				e.get("currentPlacement") || e.set("currentPlacement", t("positioning").placement);
				const n = () => dn(o);
				return qe$1(ro(o), n, {
					...t("positioning"),
					defer: !0,
					onComplete(r) {
						e.set("currentPlacement", r.placement);
					}
				});
			},
			trackPointerlockChange: ({ send: e, scope: t }) => {
				return _(t.getDoc(), "pointerlockchange", () => e({
					type: "close",
					src: "pointerlock:change"
				}), !1);
			},
			trackScroll: ({ send: e, prop: t, scope: o }) => {
				if (!t("closeOnScroll")) return;
				const n = ro(o);
				if (!n) return;
				const s = An(n).map((i) => _(i, "scroll", () => {
					e({
						type: "close",
						src: "scroll"
					});
				}, {
					passive: !0,
					capture: !0
				}));
				return () => {
					s.forEach((i) => i?.());
				};
			},
			trackStore: ({ prop: e, send: t }) => {
				let o;
				return queueMicrotask(() => {
					o = me.subscribe(() => {
						me.get("id") !== e("id") && t({
							type: "close",
							src: "id.change"
						});
					});
				}), () => o?.();
			},
			trackEscapeKey: ({ send: e, prop: t }) => t("closeOnEscape") ? _(document, "keydown", (n) => {
				Go(n) || n.key === "Escape" && (n.stopPropagation(), e({
					type: "close",
					src: "keydown.escape"
				}));
			}, !0) : void 0,
			waitForOpenDelay: ({ send: e, prop: t }) => {
				const o = setTimeout(() => {
					e({ type: "after.openDelay" });
				}, t("openDelay"));
				return () => clearTimeout(o);
			},
			waitForCloseDelay: ({ send: e, prop: t }) => {
				const o = setTimeout(() => {
					e({ type: "after.closeDelay" });
				}, t("closeDelay"));
				return () => clearTimeout(o);
			}
		}
	}
});
Wn()([
	"aria-label",
	"closeDelay",
	"closeOnEscape",
	"closeOnPointerDown",
	"closeOnScroll",
	"closeOnClick",
	"dir",
	"disabled",
	"getRootNode",
	"id",
	"ids",
	"interactive",
	"onOpenChange",
	"defaultOpen",
	"open",
	"openDelay",
	"positioning"
]);
Boolean, Boolean, Boolean, Boolean, Boolean, Boolean, Boolean, Boolean, Boolean, Boolean;
Boolean;
Symbol.toStringTag;
String, Number, Number, Boolean;
Boolean;
var Kd = {
	modelValue: {
		type: [String, Number],
		default: ""
	},
	type: {
		type: String,
		default: "text"
	},
	size: {
		type: String,
		default: "md"
	},
	disabled: {
		type: Boolean,
		default: !1
	},
	invalid: {
		type: Boolean,
		default: !1
	},
	readonly: {
		type: Boolean,
		default: !1
	}
}, qd = "relative w-full", Xd = "flex w-full appearance-none items-center border bg-[var(--ui-surface)] text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)] transition-[box-shadow,border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] rounded-[var(--ui-radius-md)] border-[var(--ui-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default read-only:bg-[var(--ui-tonal-tertiary)]", pn = {
	default: "hover:border-[var(--ui-primary-muted)]",
	invalid: "border-[var(--ui-critical)] text-[var(--ui-fg)] focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]"
}, Yd = {
	sm: "h-9 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-4 text-base"
}, Zd = {
	sm: "pl-9",
	md: "pl-10",
	lg: "pl-11"
}, Jd = {
	sm: "pr-9",
	md: "pr-10",
	lg: "pr-11"
}, fn = "pointer-events-none absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[var(--ui-fg-muted)]", gn = {
	leading: {
		sm: "left-3 size-4",
		md: "left-3 size-4",
		lg: "left-4 size-5"
	},
	trailing: {
		sm: "right-3 size-4",
		md: "right-3 size-4",
		lg: "right-4 size-5"
	}
}, Qd = [
	"value",
	"type",
	"disabled",
	"readonly",
	"aria-invalid",
	"data-invalid"
], Fu = /* @__PURE__ */ defineComponent({
	inheritAttrs: !1,
	__name: "Input",
	props: Kd,
	emits: [
		"update:modelValue",
		"blur",
		"focus"
	],
	setup(e, { emit: t }) {
		const o = t, n = useAttrs(), r = e, s = useSlots(), i = computed(() => !!s.leading), l = computed(() => !!s.trailing), c = computed(() => ir(Xd, Yd[r.size], r.invalid ? pn.invalid : pn.default, i.value ? Zd[r.size] : "", l.value ? Jd[r.size] : "", normalizeClass(n.class))), u = computed(() => {
			const { class: d, value: h$1, modelValue: b, type: E, disabled: P, readonly: T, ...R } = n;
			return R;
		});
		function f(d) {
			o("update:modelValue", d.target.value);
		}
		function g(d) {
			o("focus", d);
		}
		function v(d) {
			o("blur", d);
		}
		return (d, h$1) => (openBlock(), createElementBlock("div", { class: normalizeClass(unref(qd)) }, [
			d.$slots.leading ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: normalizeClass([unref(fn), unref(gn).leading[r.size]]),
				"aria-hidden": "true"
			}, [renderSlot(d.$slots, "leading")], 2)) : createCommentVNode("", !0),
			createElementVNode("input", mergeProps({
				value: r.modelValue,
				type: r.type,
				class: c.value,
				disabled: r.disabled,
				readonly: r.readonly,
				"aria-invalid": r.invalid ? "true" : void 0,
				"data-invalid": r.invalid ? "true" : "false"
			}, u.value, {
				onInput: f,
				onFocus: g,
				onBlur: v
			}), null, 16, Qd),
			d.$slots.trailing ? (openBlock(), createElementBlock("span", {
				key: 1,
				class: normalizeClass([unref(fn), unref(gn).trailing[r.size]]),
				"aria-hidden": "true"
			}, [renderSlot(d.$slots, "trailing")], 2)) : createCommentVNode("", !0)
		], 2));
	}
}), eu = {
	modelValue: {
		type: String,
		default: ""
	},
	size: {
		type: String,
		default: "md"
	},
	rows: {
		type: Number,
		default: 4
	},
	disabled: {
		type: Boolean,
		default: !1
	},
	invalid: {
		type: Boolean,
		default: !1
	},
	readonly: {
		type: Boolean,
		default: !1
	},
	resize: {
		type: String,
		default: "vertical"
	}
}, tu = "flex w-full appearance-none border bg-[var(--ui-surface)] text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)] rounded-[var(--ui-radius-md)] border-[var(--ui-border)] transition-[box-shadow,border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default read-only:bg-[var(--ui-tonal-tertiary)]", hn = {
	default: "hover:border-[var(--ui-primary-muted)]",
	invalid: "border-[var(--ui-critical)] text-[var(--ui-fg)] focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]"
}, ou = {
	sm: "px-3 py-2 text-sm",
	md: "px-4 py-3 text-sm",
	lg: "px-4 py-3 text-base"
}, nu = {
	vertical: "resize-y",
	none: "resize-none"
}, ru = [
	"value",
	"rows",
	"disabled",
	"readonly",
	"aria-invalid",
	"data-invalid"
], zu = /* @__PURE__ */ defineComponent({
	inheritAttrs: !1,
	__name: "Textarea",
	props: eu,
	emits: [
		"update:modelValue",
		"blur",
		"focus"
	],
	setup(e, { emit: t }) {
		const o = t, n = useAttrs(), r = e, s = computed(() => ir(tu, ou[r.size], nu[r.resize], r.invalid ? hn.invalid : hn.default, normalizeClass(n.class))), i = computed(() => {
			const { class: f, value: g, modelValue: v, disabled: d, readonly: h$1, rows: b, ...E } = n;
			return E;
		});
		function l(f) {
			o("update:modelValue", f.target.value);
		}
		function c(f) {
			o("focus", f);
		}
		function u(f) {
			o("blur", f);
		}
		return (f, g) => (openBlock(), createElementBlock("textarea", mergeProps({
			value: r.modelValue,
			rows: r.rows,
			class: s.value,
			disabled: r.disabled,
			readonly: r.readonly,
			"aria-invalid": r.invalid ? "true" : void 0,
			"data-invalid": r.invalid ? "true" : "false"
		}, i.value, {
			onInput: l,
			onFocus: c,
			onBlur: u
		}), null, 16, ru));
	}
});
Object, Array, String, Boolean, Boolean, Boolean, String, String, String, String;
Boolean, String, String, String, String, String, String;
var SideNav_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "SideNav",
	__ssrInlineRender: true,
	setup(__props) {
		const breakpoints = useBreakpoints(breakpointsTailwind);
		const route = useRoute();
		const router = useRouter();
		const appApi = useAppApi();
		const mdAndLarger = breakpoints.greaterOrEqual("md");
		const smallerThanMd = breakpoints.smaller("md");
		watch(route, () => {
			openSideBar.value = false;
		});
		const openSideBar = useLocalStorage("ternentdotdev/openSideBar", true);
		const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);
		const topItems = computed(() => [
			{
				name: "Launch",
				to: "/launch"
			},
			{
				name: "Users",
				to: "/users"
			},
			{
				name: "Permissions",
				to: "/permissions"
			}
		]);
		const middleItems = computed(() => []);
		const bottomItems = computed(() => []);
		const appVersion = shallowRef(typeof document !== "undefined" ? document.querySelector("html")?.dataset.appVersion : void 0);
		const showThemeToggle = ref(false);
		const AppThemeToggle = defineAsyncComponent(async () => {
			return (await import("./components-yLve1H0a.js")).SThemeToggle;
		});
		onMounted(() => {
			showThemeToggle.value = true;
		});
		async function relaunchOnboarding() {
			await appApi.identity.lock();
			await router.push("/");
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_RouterLink = resolveComponent("RouterLink");
			_push(`<!--[-->`);
			if (showSidebar.value) {
				_push(`<div class="${ssrRenderClass([{
					"w-64": unref(mdAndLarger),
					"w-64 absolute z-30 h-full": unref(smallerThanMd) && unref(openSideBar)
				}, "sticky top-0 flex flex-col border-r border-[var(--ui-border)] font-thin"])}">`);
				if (unref(smallerThanMd)) _push(`<div class="p-4 border-b border-base-300/30 z-40 left-0 w-full flex items-center justify-between"><div class="flex items-center justify-end"><button class="btn btn-sm btn-circle btn-ghost hover:bg-base-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div>`);
				else _push(`<!---->`);
				_push(`<div class="flex-1 flex flex-col justify-between p-2 overflow-hidden font-mono"><nav class="space-y-1 text-xs"><!--[-->`);
				ssrRenderList(topItems.value, (item) => {
					_push(`<div class="group">`);
					_push(ssrRenderComponent(_component_RouterLink, {
						to: item.to,
						class: ["flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200", { "font-medium text-[var(--ui-primary)]": _ctx.$route.path.startsWith(item.to) }]
					}, {
						default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
							if (_push$1) _push$1(`<div class="flex-1 min-w-0"${_scopeId}>${ssrInterpolate(item.name)}</div>`);
							else return [createVNode("div", { class: "flex-1 min-w-0" }, toDisplayString(item.name), 1)];
						}),
						_: 2
					}, _parent));
					_push(`</div>`);
				});
				_push(`<!--]--><hr class="m-4 border-t border-[var(--ui-border)]"><!--[-->`);
				ssrRenderList(middleItems.value, (item) => {
					_push(`<div class="group text-xs">`);
					_push(ssrRenderComponent(_component_RouterLink, {
						to: item.to,
						class: ["flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200", { "font-medium text-[var(--ui-primary)]": _ctx.$route.path.startsWith(item.to) }]
					}, {
						default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
							if (_push$1) _push$1(`<div class="flex-1 min-w-0"${_scopeId}>${ssrInterpolate(item.name)}</div>`);
							else return [createVNode("div", { class: "flex-1 min-w-0" }, toDisplayString(item.name), 1)];
						}),
						_: 2
					}, _parent));
					_push(`</div>`);
				});
				_push(`<!--]--></nav><nav class="space-y-2 pt-4"><div class="py-2 flex flex-col w-auto gap-2 font-mono"></div><div class="flex flex-col w-auto gap-1 font-sans"><!--[-->`);
				ssrRenderList(bottomItems.value, (item) => {
					_push(ssrRenderComponent(_component_RouterLink, {
						key: item.to,
						to: item.to,
						class: "flex items-center gap-3 rounded-lg transition-all duration-200 hover:bg-base-300/50 text-xs px-4 hover:text-[var(--ui-secondary)]"
					}, {
						default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
							if (_push$1) _push$1(`${ssrInterpolate(item.name)}`);
							else return [createTextVNode(toDisplayString(item.name), 1)];
						}),
						_: 2
					}, _parent));
				});
				_push(`<!--]--><a${ssrRenderAttr("href", `https://github.com/samternent/home/releases/tag/concord-demo-${appVersion.value}`)} target="_blank" class="text-xs font-mono px-2 hover:text-[var(--ui-accent)] transition-colors px-4 py-2"> v${ssrInterpolate(appVersion.value)}</a><div class="flex items-center gap-2">`);
				_push(ssrRenderComponent(unref(qt), {
					class: "flex-1",
					variant: "secondary",
					onClick: relaunchOnboarding
				}, {
					default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
						if (_push$1) _push$1(` Lock `);
						else return [createTextVNode(" Lock ")];
					}),
					_: 1
				}, _parent));
				if (showThemeToggle.value) _push(ssrRenderComponent(unref(AppThemeToggle), { size: "sm" }, null, _parent));
				else _push(`<!---->`);
				_push(`</div></div></nav></div></div>`);
			} else _push(`<!---->`);
			if (unref(smallerThanMd) && !unref(openSideBar)) {
				_push(`<div class="fixed top-0 left-0 z-40">`);
				_push(ssrRenderComponent(unref(qt), {
					onClick: ($event) => openSideBar.value = !unref(openSideBar),
					variant: "ghost",
					size: "sm"
				}, {
					default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
						if (_push$1) _push$1(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"${_scopeId}></path></svg>`);
						else return [(openBlock(), createBlock("svg", {
							xmlns: "http://www.w3.org/2000/svg",
							fill: "none",
							viewBox: "0 0 24 24",
							"stroke-width": "1.5",
							stroke: "currentColor",
							class: "size-6"
						}, [createVNode("path", {
							"stroke-linecap": "round",
							"stroke-linejoin": "round",
							d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						})]))];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
var _sfc_setup$4 = SideNav_vue_vue_type_script_setup_true_lang_default.setup;
SideNav_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/modules/appShell/SideNav.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var SideNav_default = SideNav_vue_vue_type_script_setup_true_lang_default;
var _sfc_main = {
	__name: "Console",
	__ssrInlineRender: true,
	props: { container: {
		type: HTMLElement,
		default: document.body
	} },
	setup(__props) {
		const { width } = useWindowSize();
		const dragPosition = useLocalStorage("routes/RouteLedger/dragPosition", 600);
		const isDragging = shallowRef(false);
		const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
		const bottomPanelHeight = useLocalStorage("bottomPanelHeight", width.value < 500 ? 620 : 320);
		watch(dragPosition, (value) => {
			if (value > 200) bottomPanelHeight.value = value;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({
				class: ["flex flex-col z-40 relative", {
					"h-8": !unref(isBottomPanelExpanded),
					"transition-all": !isDragging.value
				}],
				style: `${unref(isBottomPanelExpanded) && `height: ${unref(bottomPanelHeight)}px`}`
			}, _attrs))}>`);
			if (unref(isBottomPanelExpanded)) _push(ssrRenderComponent(unref(ue), {
				direction: "horizontal",
				position: unref(dragPosition),
				"onUpdate:position": ($event) => isRef(dragPosition) ? dragPosition.value = $event : null,
				dragging: isDragging.value,
				"onUpdate:dragging": ($event) => isDragging.value = $event,
				container: __props.container,
				type: "primary"
			}, null, _parent));
			else _push(`<!---->`);
			_push(`<div class="flex justify-between px-2 h-8 border-y border-[var(--ui-border)] bg-base-200 relative z-50 py-1"><div class="flex-1 items-center flex justify-between">`);
			ssrRenderSlot(_ctx.$slots, "panel-control", {}, null, _push, _parent);
			_push(`</div><div class="flex items-center justify-center">`);
			_push(ssrRenderComponent(unref(ce), {
				"aria-label": "Toggle Bottom Panel",
				"aria-pressed": unref(isBottomPanelExpanded),
				onClick: ($event) => isBottomPanelExpanded.value = !unref(isBottomPanelExpanded),
				type: "ghost",
				class: "mr-2 btn-xs",
				size: "micro"
			}, {
				default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
					if (_push$1) _push$1(`<svg xmlns="http://www.w3.org/2000/svg" class="${ssrRenderClass([unref(isBottomPanelExpanded) ? "rotate-0" : "rotate-180", "h-5 w-5 transition-transform duration-300 transform-gpu"])}" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg>`);
					else return [(openBlock(), createBlock("svg", {
						xmlns: "http://www.w3.org/2000/svg",
						class: ["h-5 w-5 transition-transform duration-300 transform-gpu", unref(isBottomPanelExpanded) ? "rotate-0" : "rotate-180"],
						fill: "none",
						viewBox: "0 0 24 24",
						stroke: "currentColor"
					}, [createVNode("path", {
						"stroke-linecap": "round",
						"stroke-linejoin": "round",
						"stroke-width": "2",
						d: "M19 9l-7 7-7-7"
					})], 2))];
				}),
				_: 1
			}, _parent));
			_push(`</div></div><div class="flex-1 flex overflow-auto">`);
			ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div></section>`);
		};
	}
};
var _sfc_setup$3 = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/modules/appShell/Console.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var Console_default = _sfc_main;
var IdentityOnboardingDialog_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "IdentityOnboardingDialog",
	__ssrInlineRender: true,
	setup(__props) {
		const appApi = useAppApi();
		const isBrowser = typeof window !== "undefined";
		const dialogOpen = ref(false);
		const summary = ref(null);
		const draft = ref(null);
		const creatingDraft = ref(false);
		const submitting = ref(false);
		const error = ref(null);
		const mode = ref("unlock");
		const step = ref(1);
		const mnemonicConfirmed = ref(false);
		const password = ref("");
		const confirmPassword = ref("");
		const mfaEnabled = ref(true);
		const totpCode = ref("");
		const unlockPassword = ref("");
		const unlockTotpCode = ref("");
		const recoverMnemonic = ref("");
		const recoverPassword = ref("");
		const recoverConfirmPassword = ref("");
		const recoverMfaEnabled = ref(false);
		const recoverTotpSecretBase32 = ref("");
		const recoverTotpCode = ref("");
		const isUnlocked = computed(() => appApi.status.value === "ready" && appApi.identity.activeIdentity.value !== null);
		const hasStoredIdentity = computed(() => summary.value !== null);
		const showUnlockMfaField = computed(() => Boolean(summary.value?.mfaEnabled));
		const createTotpQrDataUri = computed(() => {
			if (!mfaEnabled.value || !draft.value) return null;
			try {
				return buildQrDataUri({
					value: draft.value.mfa.totpAuthUri,
					errorCorrection: "M",
					quietZoneModules: 4,
					pixelSize: 6
				});
			} catch {
				return null;
			}
		});
		const recoverTotpQrDataUri = computed(() => {
			if (!recoverMfaEnabled.value) return null;
			const secret = String(recoverTotpSecretBase32.value || "").trim();
			if (!secret) return null;
			try {
				return buildQrDataUri({
					value: createOtpAuthUri({
						secretBase32: secret,
						policy: {
							issuer: "Concord",
							accountName: "Recovered Identity@local",
							digits: 6,
							period: 30
						}
					}),
					errorCorrection: "M",
					quietZoneModules: 4,
					pixelSize: 6
				});
			} catch {
				return null;
			}
		});
		const canCreate = computed(() => {
			if (!draft.value) return false;
			if (!mnemonicConfirmed.value) return false;
			if (!password.value || !confirmPassword.value) return false;
			if (mfaEnabled.value && !totpCode.value) return false;
			return true;
		});
		function refreshSummary() {
			summary.value = appApi.identity.getStoredIdentitySummary();
		}
		function hasPendingDevSessionResume() {
			return false;
		}
		function resetCreateFields() {
			step.value = 1;
			mnemonicConfirmed.value = false;
			password.value = "";
			confirmPassword.value = "";
			mfaEnabled.value = true;
			totpCode.value = "";
		}
		function resetRecoveryFields() {
			recoverMnemonic.value = "";
			recoverPassword.value = "";
			recoverConfirmPassword.value = "";
			recoverMfaEnabled.value = false;
			recoverTotpSecretBase32.value = "";
			recoverTotpCode.value = "";
		}
		async function ensureDraft(force = false) {
			if (!force && draft.value) return;
			creatingDraft.value = true;
			error.value = null;
			try {
				draft.value = await appApi.identity.createOnboardingDraft();
				resetCreateFields();
			} catch (nextError) {
				error.value = nextError instanceof Error ? nextError.message : String(nextError);
			} finally {
				creatingDraft.value = false;
			}
		}
		async function regenerateDraft() {
			await ensureDraft(true);
		}
		async function copyMnemonic() {
			if (!draft.value) return;
			if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
			try {
				await navigator.clipboard.writeText(draft.value.mnemonic);
			} catch {}
		}
		async function unlockIdentity() {
			if (submitting.value) return;
			submitting.value = true;
			error.value = null;
			try {
				await appApi.identity.unlockWithPassword({
					password: unlockPassword.value,
					totpCode: unlockTotpCode.value || void 0
				});
				unlockPassword.value = "";
				unlockTotpCode.value = "";
				refreshSummary();
			} catch (nextError) {
				error.value = nextError instanceof Error ? nextError.message : String(nextError);
			} finally {
				submitting.value = false;
			}
		}
		async function createIdentity() {
			if (!draft.value || submitting.value) return;
			submitting.value = true;
			error.value = null;
			try {
				await appApi.identity.completeOnboarding({
					draft: draft.value,
					password: password.value,
					confirmPassword: confirmPassword.value,
					mnemonicConfirmed: mnemonicConfirmed.value,
					mfaEnabled: mfaEnabled.value,
					totpCode: mfaEnabled.value ? totpCode.value : void 0
				});
				refreshSummary();
			} catch (nextError) {
				error.value = nextError instanceof Error ? nextError.message : String(nextError);
			} finally {
				submitting.value = false;
			}
		}
		async function recoverIdentity() {
			if (submitting.value) return;
			submitting.value = true;
			error.value = null;
			try {
				await appApi.identity.recoverFromMnemonic({
					mnemonic: recoverMnemonic.value,
					password: recoverPassword.value,
					confirmPassword: recoverConfirmPassword.value,
					mfaEnabled: recoverMfaEnabled.value,
					totpSecretBase32: recoverMfaEnabled.value ? recoverTotpSecretBase32.value : void 0,
					totpCode: recoverMfaEnabled.value ? recoverTotpCode.value : void 0
				});
				refreshSummary();
			} catch (nextError) {
				error.value = nextError instanceof Error ? nextError.message : String(nextError);
			} finally {
				submitting.value = false;
			}
		}
		async function startCreateMode() {
			mode.value = "create";
			error.value = null;
			await ensureDraft();
		}
		function startRecoverMode() {
			mode.value = "recover";
			error.value = null;
			resetRecoveryFields();
		}
		function startUnlockMode() {
			mode.value = "unlock";
			error.value = null;
		}
		watch(isUnlocked, async (nextUnlocked) => {
			dialogOpen.value = !nextUnlocked && !hasPendingDevSessionResume();
			if (!nextUnlocked) {
				refreshSummary();
				error.value = null;
				mode.value = summary.value ? "unlock" : "create";
				if (isBrowser && !summary.value) await ensureDraft();
			}
		}, { immediate: true });
		onMounted(async () => {
			refreshSummary();
			mode.value = summary.value ? "unlock" : "create";
			dialogOpen.value = !isUnlocked.value && !hasPendingDevSessionResume();
			if (!summary.value && !isUnlocked.value) await ensureDraft();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(unref($u), mergeProps({
				open: dialogOpen.value,
				"onUpdate:open": ($event) => dialogOpen.value = $event,
				"show-close": false,
				"close-on-escape": false,
				"close-on-interact-outside": false,
				size: "lg",
				title: "Identity Required",
				description: "Unlock an existing identity or create one locally to continue."
			}, _attrs), {
				default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
					if (_push$1) {
						_push$1(`<div class="space-y-5" data-test="identity-global-dialog"${_scopeId}>`);
						if (hasStoredIdentity.value && summary.value && mode.value === "unlock") {
							_push$1(`<!--[-->`);
							_push$1(ssrRenderComponent(unref(Ht), {
								padding: "md",
								variant: "subtle"
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(`<dl class="m-0 grid gap-2 text-sm"${_scopeId$1}><div class="flex items-center justify-between gap-4"${_scopeId$1}><dt class="text-[var(--ui-fg-muted)]"${_scopeId$1}> Identity </dt><dd class="m-0 text-[var(--ui-fg)]"${_scopeId$1}>${ssrInterpolate(summary.value.label)}</dd></div><div class="flex items-center justify-between gap-4"${_scopeId$1}><dt class="text-[var(--ui-fg-muted)]"${_scopeId$1}> Created </dt><dd class="m-0 text-[var(--ui-fg)]"${_scopeId$1}>${ssrInterpolate(summary.value.createdAt)}</dd></div><div class="flex items-center justify-between gap-4"${_scopeId$1}><dt class="text-[var(--ui-fg-muted)]"${_scopeId$1}> MFA </dt><dd class="m-0 text-[var(--ui-fg)]"${_scopeId$1}>${ssrInterpolate(summary.value.mfaEnabled ? "enabled" : "disabled")}</dd></div></dl>`);
									else return [createVNode("dl", { class: "m-0 grid gap-2 text-sm" }, [
										createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " Identity "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.label), 1)]),
										createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " Created "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.createdAt), 1)]),
										createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " MFA "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.mfaEnabled ? "enabled" : "disabled"), 1)])
									])];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(`<form class="space-y-4"${_scopeId}><input type="text" name="username" autocomplete="username"${ssrRenderAttr("value", summary.value.label)} readonly class="sr-only" tabindex="-1"${_scopeId}><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Password</span>`);
							_push$1(ssrRenderComponent(unref(Fu), {
								modelValue: unlockPassword.value,
								"onUpdate:modelValue": ($event) => unlockPassword.value = $event,
								id: "identity-unlock-password",
								name: "password",
								type: "password",
								autocomplete: "current-password",
								placeholder: "Enter identity password",
								"data-test": "identity-dialog-unlock-password"
							}, null, _parent$1, _scopeId));
							_push$1(`</label>`);
							if (showUnlockMfaField.value) {
								_push$1(`<label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Authenticator code (if enabled)</span>`);
								_push$1(ssrRenderComponent(unref(Fu), {
									modelValue: unlockTotpCode.value,
									"onUpdate:modelValue": ($event) => unlockTotpCode.value = $event,
									id: "identity-unlock-totp",
									name: "otp",
									type: "text",
									inputmode: "numeric",
									maxlength: "6",
									autocomplete: "one-time-code",
									placeholder: "123456",
									"data-test": "identity-dialog-unlock-totp"
								}, null, _parent$1, _scopeId));
								_push$1(`</label>`);
							} else _push$1(`<!---->`);
							_push$1(`<div class="flex justify-end"${_scopeId}>`);
							_push$1(ssrRenderComponent(unref(qt), {
								type: "submit",
								variant: "primary",
								loading: submitting.value,
								"data-test": "identity-dialog-unlock-submit"
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(` Unlock `);
									else return [createTextVNode(" Unlock ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(`</div></form><div class="flex flex-wrap items-center gap-2"${_scopeId}>`);
							_push$1(ssrRenderComponent(unref(qt), {
								variant: "tertiary",
								onClick: startRecoverMode
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(` Recover From Mnemonic `);
									else return [createTextVNode(" Recover From Mnemonic ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(ssrRenderComponent(unref(qt), {
								variant: "tertiary",
								onClick: startCreateMode
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(` Create New Identity `);
									else return [createTextVNode(" Create New Identity ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(`</div><!--]-->`);
						} else if (mode.value === "recover") {
							_push$1(`<form class="space-y-4"${_scopeId}><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Recovery mnemonic</span>`);
							_push$1(ssrRenderComponent(unref(zu), {
								modelValue: recoverMnemonic.value,
								"onUpdate:modelValue": ($event) => recoverMnemonic.value = $event,
								name: "recovery-mnemonic",
								rows: "3",
								autocomplete: "off",
								placeholder: "Enter your 12 or 24 word recovery phrase",
								"data-test": "identity-dialog-recover-mnemonic"
							}, null, _parent$1, _scopeId));
							_push$1(`</label><input type="text" name="username" autocomplete="username" value="local-identity-recovery" readonly class="sr-only" tabindex="-1"${_scopeId}><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>New password</span>`);
							_push$1(ssrRenderComponent(unref(Fu), {
								modelValue: recoverPassword.value,
								"onUpdate:modelValue": ($event) => recoverPassword.value = $event,
								id: "identity-recover-password",
								name: "new-password",
								type: "password",
								autocomplete: "new-password",
								placeholder: "At least 8 characters",
								"data-test": "identity-dialog-recover-password"
							}, null, _parent$1, _scopeId));
							_push$1(`</label><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Confirm password</span>`);
							_push$1(ssrRenderComponent(unref(Fu), {
								modelValue: recoverConfirmPassword.value,
								"onUpdate:modelValue": ($event) => recoverConfirmPassword.value = $event,
								id: "identity-recover-password-confirm",
								name: "new-password-confirm",
								type: "password",
								autocomplete: "new-password",
								placeholder: "Re-enter password",
								"data-test": "identity-dialog-recover-password-confirm"
							}, null, _parent$1, _scopeId));
							_push$1(`</label>`);
							_push$1(ssrRenderComponent(unref(Ht), {
								padding: "md",
								variant: "subtle"
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) {
										_push$2(`<div class="space-y-3"${_scopeId$1}>`);
										_push$2(ssrRenderComponent(unref(Su), {
											modelValue: recoverMfaEnabled.value,
											"onUpdate:modelValue": ($event) => recoverMfaEnabled.value = $event,
											"data-test": "identity-dialog-recover-mfa-enabled"
										}, {
											default: withCtx((_$3, _push$3, _parent$3, _scopeId$2) => {
												if (_push$3) _push$3(` Enable authenticator verification `);
												else return [createTextVNode(" Enable authenticator verification ")];
											}),
											_: 1
										}, _parent$2, _scopeId$1));
										if (recoverMfaEnabled.value) {
											_push$2(`<!--[--><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId$1}><span${_scopeId$1}>Authenticator secret (Base32)</span>`);
											_push$2(ssrRenderComponent(unref(Fu), {
												modelValue: recoverTotpSecretBase32.value,
												"onUpdate:modelValue": ($event) => recoverTotpSecretBase32.value = $event,
												name: "recover-totp-secret",
												autocomplete: "off",
												placeholder: "JBSWY3DPEHPK3PXP",
												"data-test": "identity-dialog-recover-totp-secret"
											}, null, _parent$2, _scopeId$1));
											_push$2(`</label>`);
											if (recoverTotpQrDataUri.value) _push$2(`<div class="space-y-2"${_scopeId$1}><p class="m-0 text-xs text-[var(--ui-fg-muted)]"${_scopeId$1}> Scan in your authenticator app </p><img${ssrRenderAttr("src", recoverTotpQrDataUri.value)} alt="Recovery authenticator QR code" class="h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2" data-test="identity-dialog-recover-totp-qr"${_scopeId$1}></div>`);
											else _push$2(`<!---->`);
											_push$2(`<label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId$1}><span${_scopeId$1}>Verify authenticator code</span>`);
											_push$2(ssrRenderComponent(unref(Fu), {
												modelValue: recoverTotpCode.value,
												"onUpdate:modelValue": ($event) => recoverTotpCode.value = $event,
												type: "text",
												name: "otp",
												inputmode: "numeric",
												maxlength: "6",
												autocomplete: "one-time-code",
												placeholder: "123456",
												"data-test": "identity-dialog-recover-totp-code"
											}, null, _parent$2, _scopeId$1));
											_push$2(`</label><!--]-->`);
										} else _push$2(`<!---->`);
										_push$2(`</div>`);
									} else return [createVNode("div", { class: "space-y-3" }, [createVNode(unref(Su), {
										modelValue: recoverMfaEnabled.value,
										"onUpdate:modelValue": ($event) => recoverMfaEnabled.value = $event,
										"data-test": "identity-dialog-recover-mfa-enabled"
									}, {
										default: withCtx(() => [createTextVNode(" Enable authenticator verification ")]),
										_: 1
									}, 8, ["modelValue", "onUpdate:modelValue"]), recoverMfaEnabled.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
										createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Authenticator secret (Base32)"), createVNode(unref(Fu), {
											modelValue: recoverTotpSecretBase32.value,
											"onUpdate:modelValue": ($event) => recoverTotpSecretBase32.value = $event,
											name: "recover-totp-secret",
											autocomplete: "off",
											placeholder: "JBSWY3DPEHPK3PXP",
											"data-test": "identity-dialog-recover-totp-secret"
										}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
										recoverTotpQrDataUri.value ? (openBlock(), createBlock("div", {
											key: 0,
											class: "space-y-2"
										}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Scan in your authenticator app "), createVNode("img", {
											src: recoverTotpQrDataUri.value,
											alt: "Recovery authenticator QR code",
											class: "h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2",
											"data-test": "identity-dialog-recover-totp-qr"
										}, null, 8, ["src"])])) : createCommentVNode("", true),
										createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Verify authenticator code"), createVNode(unref(Fu), {
											modelValue: recoverTotpCode.value,
											"onUpdate:modelValue": ($event) => recoverTotpCode.value = $event,
											type: "text",
											name: "otp",
											inputmode: "numeric",
											maxlength: "6",
											autocomplete: "one-time-code",
											placeholder: "123456",
											"data-test": "identity-dialog-recover-totp-code"
										}, null, 8, ["modelValue", "onUpdate:modelValue"])])
									], 64)) : createCommentVNode("", true)])];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(`<div class="flex items-center justify-between gap-2"${_scopeId}>`);
							_push$1(ssrRenderComponent(unref(qt), {
								variant: "tertiary",
								onClick: startUnlockMode
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(` Back To Unlock `);
									else return [createTextVNode(" Back To Unlock ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(ssrRenderComponent(unref(qt), {
								type: "submit",
								variant: "primary",
								loading: submitting.value,
								"data-test": "identity-dialog-recover-submit"
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(` Recover Identity `);
									else return [createTextVNode(" Recover Identity ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							_push$1(`</div></form>`);
						} else {
							_push$1(`<!--[-->`);
							if (creatingDraft.value || !draft.value) _push$1(ssrRenderComponent(unref(Ht), {
								padding: "md",
								variant: "subtle"
							}, {
								default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
									if (_push$2) _push$2(`<p class="m-0 text-sm text-[var(--ui-fg-muted)]"${_scopeId$1}> Preparing identity draft... </p>`);
									else return [createVNode("p", { class: "m-0 text-sm text-[var(--ui-fg-muted)]" }, " Preparing identity draft... ")];
								}),
								_: 1
							}, _parent$1, _scopeId));
							else {
								_push$1(`<!--[-->`);
								if (step.value === 1) {
									_push$1(`<div class="space-y-4"${_scopeId}><p class="m-0 text-sm text-[var(--ui-fg-muted)]"${_scopeId}> Save this recovery phrase offline before continuing. </p>`);
									_push$1(ssrRenderComponent(unref(Ht), {
										padding: "md",
										variant: "subtle"
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) {
												_push$2(`<div class="grid grid-cols-2 gap-2 sm:grid-cols-3"${_scopeId$1}><!--[-->`);
												ssrRenderList(draft.value.mnemonic.split(" "), (word, index) => {
													_push$2(`<div class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1"${_scopeId$1}><p class="m-0 text-xs text-[var(--ui-fg-muted)]"${_scopeId$1}>${ssrInterpolate(index + 1)}</p><p class="m-0 text-sm text-[var(--ui-fg)]"${_scopeId$1}>${ssrInterpolate(word)}</p></div>`);
												});
												_push$2(`<!--]--></div>`);
											} else return [createVNode("div", { class: "grid grid-cols-2 gap-2 sm:grid-cols-3" }, [(openBlock(true), createBlock(Fragment, null, renderList(draft.value.mnemonic.split(" "), (word, index) => {
												return openBlock(), createBlock("div", {
													key: `${index}-${word}`,
													class: "rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1"
												}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, toDisplayString(index + 1), 1), createVNode("p", { class: "m-0 text-sm text-[var(--ui-fg)]" }, toDisplayString(word), 1)]);
											}), 128))])];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`<div class="flex flex-wrap gap-2"${_scopeId}>`);
									_push$1(ssrRenderComponent(unref(qt), {
										variant: "secondary",
										onClick: copyMnemonic
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Copy phrase `);
											else return [createTextVNode(" Copy phrase ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(ssrRenderComponent(unref(qt), {
										variant: "tertiary",
										disabled: submitting.value,
										onClick: regenerateDraft
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Regenerate `);
											else return [createTextVNode(" Regenerate ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`</div>`);
									_push$1(ssrRenderComponent(unref(Su), {
										modelValue: mnemonicConfirmed.value,
										"onUpdate:modelValue": ($event) => mnemonicConfirmed.value = $event,
										"data-test": "identity-dialog-mnemonic-confirmed"
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` I have saved this phrase offline. `);
											else return [createTextVNode(" I have saved this phrase offline. ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`<div class="flex justify-end"${_scopeId}><div class="flex gap-2"${_scopeId}>`);
									_push$1(ssrRenderComponent(unref(qt), {
										variant: "tertiary",
										onClick: startRecoverMode
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Recover Instead `);
											else return [createTextVNode(" Recover Instead ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(ssrRenderComponent(unref(qt), {
										variant: "primary",
										disabled: !mnemonicConfirmed.value,
										onClick: ($event) => step.value = 2
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Continue `);
											else return [createTextVNode(" Continue ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`</div></div></div>`);
								} else {
									_push$1(`<form class="space-y-4"${_scopeId}><input type="text" name="username" autocomplete="username" value="local-identity-onboarding" readonly class="sr-only" tabindex="-1"${_scopeId}><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Password</span>`);
									_push$1(ssrRenderComponent(unref(Fu), {
										modelValue: password.value,
										"onUpdate:modelValue": ($event) => password.value = $event,
										id: "identity-create-password",
										name: "new-password",
										type: "password",
										autocomplete: "new-password",
										placeholder: "At least 8 characters",
										"data-test": "identity-dialog-password"
									}, null, _parent$1, _scopeId));
									_push$1(`</label><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId}><span${_scopeId}>Confirm password</span>`);
									_push$1(ssrRenderComponent(unref(Fu), {
										modelValue: confirmPassword.value,
										"onUpdate:modelValue": ($event) => confirmPassword.value = $event,
										id: "identity-create-password-confirm",
										name: "new-password-confirm",
										type: "password",
										autocomplete: "new-password",
										placeholder: "Re-enter password",
										"data-test": "identity-dialog-password-confirm"
									}, null, _parent$1, _scopeId));
									_push$1(`</label>`);
									_push$1(ssrRenderComponent(unref(Ht), {
										padding: "md",
										variant: "subtle"
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) {
												_push$2(`<div class="space-y-3"${_scopeId$1}>`);
												_push$2(ssrRenderComponent(unref(Su), {
													modelValue: mfaEnabled.value,
													"onUpdate:modelValue": ($event) => mfaEnabled.value = $event,
													"data-test": "identity-dialog-mfa-enabled"
												}, {
													default: withCtx((_$3, _push$3, _parent$3, _scopeId$2) => {
														if (_push$3) _push$3(` Enable authenticator verification `);
														else return [createTextVNode(" Enable authenticator verification ")];
													}),
													_: 1
												}, _parent$2, _scopeId$1));
												if (mfaEnabled.value) {
													_push$2(`<!--[-->`);
													if (createTotpQrDataUri.value) _push$2(`<div class="space-y-2"${_scopeId$1}><p class="m-0 text-xs text-[var(--ui-fg-muted)]"${_scopeId$1}> Scan in your authenticator app </p><img${ssrRenderAttr("src", createTotpQrDataUri.value)} alt="Authenticator QR code" class="h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2" data-test="identity-dialog-totp-qr"${_scopeId$1}></div>`);
													else _push$2(`<!---->`);
													_push$2(`<p class="m-0 text-xs text-[var(--ui-fg-muted)]"${_scopeId$1}> Manual secret (fallback) </p><code class="block break-all text-xs text-[var(--ui-fg)]" data-test="identity-dialog-totp-secret"${_scopeId$1}>${ssrInterpolate(draft.value.mfa.totpSecretBase32)}</code><label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"${_scopeId$1}><span${_scopeId$1}>Verify authenticator code</span>`);
													_push$2(ssrRenderComponent(unref(Fu), {
														modelValue: totpCode.value,
														"onUpdate:modelValue": ($event) => totpCode.value = $event,
														type: "text",
														name: "otp",
														inputmode: "numeric",
														maxlength: "6",
														autocomplete: "one-time-code",
														placeholder: "123456",
														"data-test": "identity-dialog-totp-code"
													}, null, _parent$2, _scopeId$1));
													_push$2(`</label><!--]-->`);
												} else _push$2(`<!---->`);
												_push$2(`</div>`);
											} else return [createVNode("div", { class: "space-y-3" }, [createVNode(unref(Su), {
												modelValue: mfaEnabled.value,
												"onUpdate:modelValue": ($event) => mfaEnabled.value = $event,
												"data-test": "identity-dialog-mfa-enabled"
											}, {
												default: withCtx(() => [createTextVNode(" Enable authenticator verification ")]),
												_: 1
											}, 8, ["modelValue", "onUpdate:modelValue"]), mfaEnabled.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
												createTotpQrDataUri.value ? (openBlock(), createBlock("div", {
													key: 0,
													class: "space-y-2"
												}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Scan in your authenticator app "), createVNode("img", {
													src: createTotpQrDataUri.value,
													alt: "Authenticator QR code",
													class: "h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2",
													"data-test": "identity-dialog-totp-qr"
												}, null, 8, ["src"])])) : createCommentVNode("", true),
												createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Manual secret (fallback) "),
												createVNode("code", {
													class: "block break-all text-xs text-[var(--ui-fg)]",
													"data-test": "identity-dialog-totp-secret"
												}, toDisplayString(draft.value.mfa.totpSecretBase32), 1),
												createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Verify authenticator code"), createVNode(unref(Fu), {
													modelValue: totpCode.value,
													"onUpdate:modelValue": ($event) => totpCode.value = $event,
													type: "text",
													name: "otp",
													inputmode: "numeric",
													maxlength: "6",
													autocomplete: "one-time-code",
													placeholder: "123456",
													"data-test": "identity-dialog-totp-code"
												}, null, 8, ["modelValue", "onUpdate:modelValue"])])
											], 64)) : createCommentVNode("", true)])];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`<div class="flex items-center justify-between gap-2"${_scopeId}>`);
									_push$1(ssrRenderComponent(unref(qt), {
										variant: "tertiary",
										onClick: ($event) => step.value = 1
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Back `);
											else return [createTextVNode(" Back ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`<div class="flex gap-2"${_scopeId}>`);
									if (hasStoredIdentity.value) _push$1(ssrRenderComponent(unref(qt), {
										variant: "tertiary",
										onClick: startUnlockMode
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Back To Unlock `);
											else return [createTextVNode(" Back To Unlock ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									else _push$1(`<!---->`);
									_push$1(ssrRenderComponent(unref(qt), {
										type: "submit",
										variant: "primary",
										loading: submitting.value,
										disabled: !canCreate.value,
										"data-test": "identity-dialog-create-submit"
									}, {
										default: withCtx((_$2, _push$2, _parent$2, _scopeId$1) => {
											if (_push$2) _push$2(` Create identity `);
											else return [createTextVNode(" Create identity ")];
										}),
										_: 1
									}, _parent$1, _scopeId));
									_push$1(`</div></div></form>`);
								}
								_push$1(`<!--]-->`);
							}
							_push$1(`<!--]-->`);
						}
						if (error.value) _push$1(`<p class="m-0 text-sm text-[var(--ui-critical)]" data-test="identity-dialog-error"${_scopeId}>${ssrInterpolate(error.value)}</p>`);
						else _push$1(`<!---->`);
						_push$1(`</div>`);
					} else return [createVNode("div", {
						class: "space-y-5",
						"data-test": "identity-global-dialog"
					}, [hasStoredIdentity.value && summary.value && mode.value === "unlock" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
						createVNode(unref(Ht), {
							padding: "md",
							variant: "subtle"
						}, {
							default: withCtx(() => [createVNode("dl", { class: "m-0 grid gap-2 text-sm" }, [
								createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " Identity "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.label), 1)]),
								createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " Created "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.createdAt), 1)]),
								createVNode("div", { class: "flex items-center justify-between gap-4" }, [createVNode("dt", { class: "text-[var(--ui-fg-muted)]" }, " MFA "), createVNode("dd", { class: "m-0 text-[var(--ui-fg)]" }, toDisplayString(summary.value.mfaEnabled ? "enabled" : "disabled"), 1)])
							])]),
							_: 1
						}),
						createVNode("form", {
							class: "space-y-4",
							onSubmit: withModifiers(unlockIdentity, ["prevent"])
						}, [
							createVNode("input", {
								type: "text",
								name: "username",
								autocomplete: "username",
								value: summary.value.label,
								readonly: "",
								class: "sr-only",
								tabindex: "-1"
							}, null, 8, ["value"]),
							createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Password"), createVNode(unref(Fu), {
								modelValue: unlockPassword.value,
								"onUpdate:modelValue": ($event) => unlockPassword.value = $event,
								id: "identity-unlock-password",
								name: "password",
								type: "password",
								autocomplete: "current-password",
								placeholder: "Enter identity password",
								"data-test": "identity-dialog-unlock-password"
							}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
							showUnlockMfaField.value ? (openBlock(), createBlock("label", {
								key: 0,
								class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]"
							}, [createVNode("span", null, "Authenticator code (if enabled)"), createVNode(unref(Fu), {
								modelValue: unlockTotpCode.value,
								"onUpdate:modelValue": ($event) => unlockTotpCode.value = $event,
								id: "identity-unlock-totp",
								name: "otp",
								type: "text",
								inputmode: "numeric",
								maxlength: "6",
								autocomplete: "one-time-code",
								placeholder: "123456",
								"data-test": "identity-dialog-unlock-totp"
							}, null, 8, ["modelValue", "onUpdate:modelValue"])])) : createCommentVNode("", true),
							createVNode("div", { class: "flex justify-end" }, [createVNode(unref(qt), {
								type: "submit",
								variant: "primary",
								loading: submitting.value,
								"data-test": "identity-dialog-unlock-submit"
							}, {
								default: withCtx(() => [createTextVNode(" Unlock ")]),
								_: 1
							}, 8, ["loading"])])
						], 32),
						createVNode("div", { class: "flex flex-wrap items-center gap-2" }, [createVNode(unref(qt), {
							variant: "tertiary",
							onClick: startRecoverMode
						}, {
							default: withCtx(() => [createTextVNode(" Recover From Mnemonic ")]),
							_: 1
						}), createVNode(unref(qt), {
							variant: "tertiary",
							onClick: startCreateMode
						}, {
							default: withCtx(() => [createTextVNode(" Create New Identity ")]),
							_: 1
						})])
					], 64)) : mode.value === "recover" ? (openBlock(), createBlock("form", {
						key: 1,
						class: "space-y-4",
						onSubmit: withModifiers(recoverIdentity, ["prevent"])
					}, [
						createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Recovery mnemonic"), createVNode(unref(zu), {
							modelValue: recoverMnemonic.value,
							"onUpdate:modelValue": ($event) => recoverMnemonic.value = $event,
							name: "recovery-mnemonic",
							rows: "3",
							autocomplete: "off",
							placeholder: "Enter your 12 or 24 word recovery phrase",
							"data-test": "identity-dialog-recover-mnemonic"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						createVNode("input", {
							type: "text",
							name: "username",
							autocomplete: "username",
							value: "local-identity-recovery",
							readonly: "",
							class: "sr-only",
							tabindex: "-1"
						}),
						createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "New password"), createVNode(unref(Fu), {
							modelValue: recoverPassword.value,
							"onUpdate:modelValue": ($event) => recoverPassword.value = $event,
							id: "identity-recover-password",
							name: "new-password",
							type: "password",
							autocomplete: "new-password",
							placeholder: "At least 8 characters",
							"data-test": "identity-dialog-recover-password"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Confirm password"), createVNode(unref(Fu), {
							modelValue: recoverConfirmPassword.value,
							"onUpdate:modelValue": ($event) => recoverConfirmPassword.value = $event,
							id: "identity-recover-password-confirm",
							name: "new-password-confirm",
							type: "password",
							autocomplete: "new-password",
							placeholder: "Re-enter password",
							"data-test": "identity-dialog-recover-password-confirm"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						createVNode(unref(Ht), {
							padding: "md",
							variant: "subtle"
						}, {
							default: withCtx(() => [createVNode("div", { class: "space-y-3" }, [createVNode(unref(Su), {
								modelValue: recoverMfaEnabled.value,
								"onUpdate:modelValue": ($event) => recoverMfaEnabled.value = $event,
								"data-test": "identity-dialog-recover-mfa-enabled"
							}, {
								default: withCtx(() => [createTextVNode(" Enable authenticator verification ")]),
								_: 1
							}, 8, ["modelValue", "onUpdate:modelValue"]), recoverMfaEnabled.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
								createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Authenticator secret (Base32)"), createVNode(unref(Fu), {
									modelValue: recoverTotpSecretBase32.value,
									"onUpdate:modelValue": ($event) => recoverTotpSecretBase32.value = $event,
									name: "recover-totp-secret",
									autocomplete: "off",
									placeholder: "JBSWY3DPEHPK3PXP",
									"data-test": "identity-dialog-recover-totp-secret"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
								recoverTotpQrDataUri.value ? (openBlock(), createBlock("div", {
									key: 0,
									class: "space-y-2"
								}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Scan in your authenticator app "), createVNode("img", {
									src: recoverTotpQrDataUri.value,
									alt: "Recovery authenticator QR code",
									class: "h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2",
									"data-test": "identity-dialog-recover-totp-qr"
								}, null, 8, ["src"])])) : createCommentVNode("", true),
								createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Verify authenticator code"), createVNode(unref(Fu), {
									modelValue: recoverTotpCode.value,
									"onUpdate:modelValue": ($event) => recoverTotpCode.value = $event,
									type: "text",
									name: "otp",
									inputmode: "numeric",
									maxlength: "6",
									autocomplete: "one-time-code",
									placeholder: "123456",
									"data-test": "identity-dialog-recover-totp-code"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])])
							], 64)) : createCommentVNode("", true)])]),
							_: 1
						}),
						createVNode("div", { class: "flex items-center justify-between gap-2" }, [createVNode(unref(qt), {
							variant: "tertiary",
							onClick: startUnlockMode
						}, {
							default: withCtx(() => [createTextVNode(" Back To Unlock ")]),
							_: 1
						}), createVNode(unref(qt), {
							type: "submit",
							variant: "primary",
							loading: submitting.value,
							"data-test": "identity-dialog-recover-submit"
						}, {
							default: withCtx(() => [createTextVNode(" Recover Identity ")]),
							_: 1
						}, 8, ["loading"])])
					], 32)) : (openBlock(), createBlock(Fragment, { key: 2 }, [creatingDraft.value || !draft.value ? (openBlock(), createBlock(unref(Ht), {
						key: 0,
						padding: "md",
						variant: "subtle"
					}, {
						default: withCtx(() => [createVNode("p", { class: "m-0 text-sm text-[var(--ui-fg-muted)]" }, " Preparing identity draft... ")]),
						_: 1
					})) : (openBlock(), createBlock(Fragment, { key: 1 }, [step.value === 1 ? (openBlock(), createBlock("div", {
						key: 0,
						class: "space-y-4"
					}, [
						createVNode("p", { class: "m-0 text-sm text-[var(--ui-fg-muted)]" }, " Save this recovery phrase offline before continuing. "),
						createVNode(unref(Ht), {
							padding: "md",
							variant: "subtle"
						}, {
							default: withCtx(() => [createVNode("div", { class: "grid grid-cols-2 gap-2 sm:grid-cols-3" }, [(openBlock(true), createBlock(Fragment, null, renderList(draft.value.mnemonic.split(" "), (word, index) => {
								return openBlock(), createBlock("div", {
									key: `${index}-${word}`,
									class: "rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1"
								}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, toDisplayString(index + 1), 1), createVNode("p", { class: "m-0 text-sm text-[var(--ui-fg)]" }, toDisplayString(word), 1)]);
							}), 128))])]),
							_: 1
						}),
						createVNode("div", { class: "flex flex-wrap gap-2" }, [createVNode(unref(qt), {
							variant: "secondary",
							onClick: copyMnemonic
						}, {
							default: withCtx(() => [createTextVNode(" Copy phrase ")]),
							_: 1
						}), createVNode(unref(qt), {
							variant: "tertiary",
							disabled: submitting.value,
							onClick: regenerateDraft
						}, {
							default: withCtx(() => [createTextVNode(" Regenerate ")]),
							_: 1
						}, 8, ["disabled"])]),
						createVNode(unref(Su), {
							modelValue: mnemonicConfirmed.value,
							"onUpdate:modelValue": ($event) => mnemonicConfirmed.value = $event,
							"data-test": "identity-dialog-mnemonic-confirmed"
						}, {
							default: withCtx(() => [createTextVNode(" I have saved this phrase offline. ")]),
							_: 1
						}, 8, ["modelValue", "onUpdate:modelValue"]),
						createVNode("div", { class: "flex justify-end" }, [createVNode("div", { class: "flex gap-2" }, [createVNode(unref(qt), {
							variant: "tertiary",
							onClick: startRecoverMode
						}, {
							default: withCtx(() => [createTextVNode(" Recover Instead ")]),
							_: 1
						}), createVNode(unref(qt), {
							variant: "primary",
							disabled: !mnemonicConfirmed.value,
							onClick: ($event) => step.value = 2
						}, {
							default: withCtx(() => [createTextVNode(" Continue ")]),
							_: 1
						}, 8, ["disabled", "onClick"])])])
					])) : (openBlock(), createBlock("form", {
						key: 1,
						class: "space-y-4",
						onSubmit: withModifiers(createIdentity, ["prevent"])
					}, [
						createVNode("input", {
							type: "text",
							name: "username",
							autocomplete: "username",
							value: "local-identity-onboarding",
							readonly: "",
							class: "sr-only",
							tabindex: "-1"
						}),
						createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Password"), createVNode(unref(Fu), {
							modelValue: password.value,
							"onUpdate:modelValue": ($event) => password.value = $event,
							id: "identity-create-password",
							name: "new-password",
							type: "password",
							autocomplete: "new-password",
							placeholder: "At least 8 characters",
							"data-test": "identity-dialog-password"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Confirm password"), createVNode(unref(Fu), {
							modelValue: confirmPassword.value,
							"onUpdate:modelValue": ($event) => confirmPassword.value = $event,
							id: "identity-create-password-confirm",
							name: "new-password-confirm",
							type: "password",
							autocomplete: "new-password",
							placeholder: "Re-enter password",
							"data-test": "identity-dialog-password-confirm"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						createVNode(unref(Ht), {
							padding: "md",
							variant: "subtle"
						}, {
							default: withCtx(() => [createVNode("div", { class: "space-y-3" }, [createVNode(unref(Su), {
								modelValue: mfaEnabled.value,
								"onUpdate:modelValue": ($event) => mfaEnabled.value = $event,
								"data-test": "identity-dialog-mfa-enabled"
							}, {
								default: withCtx(() => [createTextVNode(" Enable authenticator verification ")]),
								_: 1
							}, 8, ["modelValue", "onUpdate:modelValue"]), mfaEnabled.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
								createTotpQrDataUri.value ? (openBlock(), createBlock("div", {
									key: 0,
									class: "space-y-2"
								}, [createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Scan in your authenticator app "), createVNode("img", {
									src: createTotpQrDataUri.value,
									alt: "Authenticator QR code",
									class: "h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2",
									"data-test": "identity-dialog-totp-qr"
								}, null, 8, ["src"])])) : createCommentVNode("", true),
								createVNode("p", { class: "m-0 text-xs text-[var(--ui-fg-muted)]" }, " Manual secret (fallback) "),
								createVNode("code", {
									class: "block break-all text-xs text-[var(--ui-fg)]",
									"data-test": "identity-dialog-totp-secret"
								}, toDisplayString(draft.value.mfa.totpSecretBase32), 1),
								createVNode("label", { class: "block space-y-2 text-sm text-[var(--ui-fg-muted)]" }, [createVNode("span", null, "Verify authenticator code"), createVNode(unref(Fu), {
									modelValue: totpCode.value,
									"onUpdate:modelValue": ($event) => totpCode.value = $event,
									type: "text",
									name: "otp",
									inputmode: "numeric",
									maxlength: "6",
									autocomplete: "one-time-code",
									placeholder: "123456",
									"data-test": "identity-dialog-totp-code"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])])
							], 64)) : createCommentVNode("", true)])]),
							_: 1
						}),
						createVNode("div", { class: "flex items-center justify-between gap-2" }, [createVNode(unref(qt), {
							variant: "tertiary",
							onClick: ($event) => step.value = 1
						}, {
							default: withCtx(() => [createTextVNode(" Back ")]),
							_: 1
						}, 8, ["onClick"]), createVNode("div", { class: "flex gap-2" }, [hasStoredIdentity.value ? (openBlock(), createBlock(unref(qt), {
							key: 0,
							variant: "tertiary",
							onClick: startUnlockMode
						}, {
							default: withCtx(() => [createTextVNode(" Back To Unlock ")]),
							_: 1
						})) : createCommentVNode("", true), createVNode(unref(qt), {
							type: "submit",
							variant: "primary",
							loading: submitting.value,
							disabled: !canCreate.value,
							"data-test": "identity-dialog-create-submit"
						}, {
							default: withCtx(() => [createTextVNode(" Create identity ")]),
							_: 1
						}, 8, ["loading", "disabled"])])])
					], 32))], 64))], 64)), error.value ? (openBlock(), createBlock("p", {
						key: 3,
						class: "m-0 text-sm text-[var(--ui-critical)]",
						"data-test": "identity-dialog-error"
					}, toDisplayString(error.value), 1)) : createCommentVNode("", true)])];
				}),
				_: 1
			}, _parent));
		};
	}
});
var _sfc_setup$2 = IdentityOnboardingDialog_vue_vue_type_script_setup_true_lang_default.setup;
IdentityOnboardingDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/modules/appShell/IdentityOnboardingDialog.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var IdentityOnboardingDialog_default = IdentityOnboardingDialog_vue_vue_type_script_setup_true_lang_default;
var AppShell_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "AppShell",
	__ssrInlineRender: true,
	setup(__props) {
		const breakpoints = useBreakpoints(breakpointsTailwind);
		shallowRef();
		const smallerThanMd = breakpoints.smaller("md");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "max-h-screen max-w-screen w-screen h-screen overflow-hidden flex flex-col" }, _attrs))}><div class="flex-1 h-full relative flex z-10 overflow-hidden font-mono text-xs">`);
			_push(ssrRenderComponent(SideNav_default, null, null, _parent));
			ssrRenderSlot(_ctx.$slots, "drawer", {}, null, _push, _parent);
			_push(`<div class="flex flex-col flex-1 w-full h-full overflow-hidden"><header class="sticky top-0 z-20 bg-[color-mix(in srgb, var(--ui-bg) 58%, transparent)] backdrop-blur-[12px] border-b border-[var(--ui-border)] w-full"><div class="mx-auto flex items-center w-full justify-between"><div class="${ssrRenderClass(["flex items-start gap-2 w-64 px-4 py-2", { "pl-16": unref(smallerThanMd) }])}"></div><nav class="flex items-center justify-between text-xs font-mono px-4 py-2"></nav></div></header><div class="flex flex-1 h-full w-full overflow-auto"><div class="flex-1 relative">`);
			ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div>`);
			if (_ctx.$slots["right-side"]) {
				_push(`<div class="w-64 border-l border-[var(--ui-border)] sticky top-0">`);
				ssrRenderSlot(_ctx.$slots, "right-side", {}, null, _push, _parent);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			_push(ssrRenderComponent(Console_default, null, null, _parent));
			_push(`</div></div>`);
			_push(ssrRenderComponent(IdentityOnboardingDialog_default, null, null, _parent));
			_push(`</div>`);
		};
	}
});
var _sfc_setup$1 = AppShell_vue_vue_type_script_setup_true_lang_default.setup;
AppShell_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/modules/appShell/AppShell.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var AppShell_default = AppShell_vue_vue_type_script_setup_true_lang_default;
var RouteApp_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "RouteApp",
	__ssrInlineRender: true,
	setup(__props) {
		const appApi = useAppApi();
		const isUnlocked = computed(() => appApi.status.value === "ready" && appApi.identity.activeIdentity.value !== null);
		function hasDevSessionResumeCandidate() {
			return false;
		}
		onMounted(() => {
			if (!hasDevSessionResumeCandidate()) return;
			appApi.identity.ensureUnlocked("auto").catch(() => void 0);
		});
		return (_ctx, _push, _parent, _attrs) => {
			const _component_RouterView = resolveComponent("RouterView");
			_push(ssrRenderComponent(AppShell_default, _attrs, {
				default: withCtx((_$1, _push$1, _parent$1, _scopeId) => {
					if (_push$1) if (isUnlocked.value) _push$1(ssrRenderComponent(_component_RouterView, null, null, _parent$1, _scopeId));
					else _push$1(`<div class="sr-only" data-test="identity-shell-locked"${_scopeId}> Identity locked </div>`);
					else return [isUnlocked.value ? (openBlock(), createBlock(_component_RouterView, { key: 0 })) : (openBlock(), createBlock("div", {
						key: 1,
						class: "sr-only",
						"data-test": "identity-shell-locked"
					}, " Identity locked "))];
				}),
				_: 1
			}, _parent));
		};
	}
});
var _sfc_setup = RouteApp_vue_vue_type_script_setup_true_lang_default.setup;
RouteApp_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/routes/app/RouteApp.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RouteApp_default = RouteApp_vue_vue_type_script_setup_true_lang_default;
export { RouteApp_default as default };
