/*
MIT License

Copyright (c) Project Nayuki
Copyright (c) 2023 Anthony Fu <https://github.com/antfu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export type BuildQrSvgInput = {
  value: string;
  errorCorrection?: QrErrorCorrection;
  quietZoneModules?: number;
  pixelSize?: number;
  foregroundColor?: string;
  backgroundColor?: string;
};

type EccLevel = readonly [number, number];

const LOW: EccLevel = [0, 1] as const;
const MEDIUM: EccLevel = [1, 0] as const;
const QUARTILE: EccLevel = [2, 3] as const;
const HIGH: EccLevel = [3, 2] as const;

const EccMap: Record<QrErrorCorrection, EccLevel> = {
  L: LOW,
  M: MEDIUM,
  Q: QUARTILE,
  H: HIGH,
};

const NUMERIC_REGEX = /^[0-9]*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

const DEFAULT_QR_ERROR_CORRECTION: QrErrorCorrection = "M";
const DEFAULT_QR_QUIET_ZONE_MODULES = 4;
const DEFAULT_QR_PIXEL_SIZE = 8;

const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30,
    28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28,
    26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28,
    28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28,
    28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30,
  ],
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9,
    10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17,
    17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47,
    49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20,
    23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62,
    65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25,
    25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74,
    77, 81,
  ],
];

function normalizeContent(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error("QR payload is required.");
  }
  return normalized;
}

function normalizeQuietZone(value?: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_QR_QUIET_ZONE_MODULES;
  }
  return Math.max(0, Math.floor(Number(value)));
}

function normalizePixelSize(value?: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_QR_PIXEL_SIZE;
  }
  return Math.max(1, Math.floor(Number(value)));
}

class QrCode {
  public readonly version: number;
  public readonly ecc: EccLevel;
  public readonly size: number;
  public readonly mask: number;
  public readonly modules: boolean[][] = [];
  private readonly types: boolean[][] = [];

  constructor(version: number, ecc: EccLevel, dataCodewords: number[], msk: number) {
    if (version < MIN_VERSION || version > MAX_VERSION) {
      throw new RangeError("Version value out of range");
    }
    if (msk < -1 || msk > 7) {
      throw new RangeError("Mask value out of range");
    }

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

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        const inFinderOverlap =
          (i === 0 && j === 0) ||
          (i === 0 && j === numAlign - 1) ||
          (i === numAlign - 1 && j === 0);
        if (!inFinderOverlap) {
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
        }
      }
    }

    this.drawFormatBits(0);
    this.drawVersion();
  }

  private drawFormatBits(mask: number): void {
    const data = (this.ecc[1] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 1335);
    }
    const bits = ((data << 10) | rem) ^ 21522;

    for (let i = 0; i <= 5; i++) {
      this.setFunctionModule(8, i, getBit(bits, i));
    }
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));

    for (let i = 9; i < 15; i++) {
      this.setFunctionModule(14 - i, 8, getBit(bits, i));
    }

    for (let i = 0; i < 8; i++) {
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    }
    for (let i = 8; i < 15; i++) {
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    }
    this.setFunctionModule(8, this.size - 8, true);
  }

  private drawVersion(): void {
    if (this.version < 7) {
      return;
    }

    let rem = this.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 7973);
    }
    const bits = (this.version << 12) | rem;

    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
        );
      }
    }
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.types[y][x] = true;
  }

  private addEccAndInterleave(data: number[]): number[] {
    const ver = this.version;
    const ecl = this.ecc;

    if (data.length !== getNumDataCodewords(ver, ecl)) {
      throw new RangeError("Invalid argument");
    }

    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);

    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(
        k,
        k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1),
      );
      k += dat.length;

      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) {
        dat.push(0);
      }
      blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          result.push(block[i]);
        }
      });
    }

    return result;
  }

  private drawCodewords(data: number[]): void {
    if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8)) {
      throw new RangeError("Invalid argument");
    }

    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }

      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;

          if (!this.types[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    if (mask < 0 || mask > 7) {
      throw new RangeError("Mask value out of range");
    }

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
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
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0;
            break;
          case 7:
            invert = ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0;
            break;
          default:
            throw new Error("Unreachable");
        }

        if (!this.types[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;

    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];

      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5) {
            result += PENALTY_N1;
          } else if (runX > 5) {
            result++;
          }
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runX = 1;
        }
      }

      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }

    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];

      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5) {
            result += PENALTY_N1;
          } else if (runY > 5) {
            result++;
          }
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runY = 1;
        }
      }

      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }

    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        ) {
          result += PENALTY_N2;
        }
      }
    }

    let dark = 0;
    for (const row of this.modules) {
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    }

    const total = this.size * this.size;
    const k = Math.ceil(Math.abs((dark * 20) - (total * 10)) / total) - 1;
    result += k * PENALTY_N4;

    return result;
  }

  private getAlignmentPatternPositions(): number[] {
    if (this.version === 1) {
      return [];
    }

    const numAlign = Math.floor(this.version / 7) + 2;
    const step =
      this.version === 32
        ? 26
        : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;

    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  private finderPenaltyCountPatterns(runHistory: number[]): number {
    const n = runHistory[1];
    const core =
      n > 0 &&
      runHistory[2] === n &&
      runHistory[3] === n * 3 &&
      runHistory[4] === n &&
      runHistory[5] === n;

    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  }

  private finderPenaltyTerminateAndCount(
    currentRunColor: boolean,
    currentRunLength: number,
    runHistory: number[],
  ): number {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }

    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  private finderPenaltyAddHistory(currentRunLength: number, runHistory: number[]): void {
    if (runHistory[0] === 0) {
      currentRunLength += this.size;
    }
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}

class QrSegment {
  public readonly mode: readonly [number, number, number, number];
  public readonly numChars: number;
  private readonly bitData: number[];

  constructor(mode: readonly [number, number, number, number], numChars: number, bitData: number[]) {
    if (numChars < 0) {
      throw new RangeError("Invalid argument");
    }
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData.slice();
  }

  public getData(): number[] {
    return this.bitData.slice();
  }
}

const MODE_NUMERIC = [1, 10, 12, 14] as const;
const MODE_ALPHANUMERIC = [2, 9, 11, 13] as const;
const MODE_BYTE = [4, 8, 16, 16] as const;

function appendBits(val: number, len: number, bb: number[]): void {
  if (len < 0 || len > 31 || (val >>> len) !== 0) {
    throw new RangeError("Value out of range");
  }
  for (let i = len - 1; i >= 0; i--) {
    bb.push((val >>> i) & 1);
  }
}

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

function numCharCountBits(mode: readonly [number, number, number, number], ver: number): number {
  return mode[Math.floor((ver + 7) / 17) + 1];
}

function makeBytes(data: number[]): QrSegment {
  const bb: number[] = [];
  for (const b of data) {
    appendBits(b, 8, bb);
  }
  return new QrSegment(MODE_BYTE, data.length, bb);
}

function makeNumeric(digits: string): QrSegment {
  if (!NUMERIC_REGEX.test(digits)) {
    throw new RangeError("String contains non-numeric characters");
  }

  const bb: number[] = [];
  for (let i = 0; i < digits.length;) {
    const n = Math.min(digits.length - i, 3);
    appendBits(Number.parseInt(digits.slice(i, i + n), 10), n * 3 + 1, bb);
    i += n;
  }
  return new QrSegment(MODE_NUMERIC, digits.length, bb);
}

function makeAlphanumeric(text: string): QrSegment {
  if (!ALPHANUMERIC_REGEX.test(text)) {
    throw new RangeError("String contains unencodable characters in alphanumeric mode");
  }

  const bb: number[] = [];
  let i = 0;
  for (; i + 2 <= text.length; i += 2) {
    let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
    temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
    appendBits(temp, 11, bb);
  }

  if (i < text.length) {
    appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
  }

  return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}

function makeSegments(text: string): QrSegment[] {
  if (text === "") {
    return [];
  }
  if (NUMERIC_REGEX.test(text)) {
    return [makeNumeric(text)];
  }
  if (ALPHANUMERIC_REGEX.test(text)) {
    return [makeAlphanumeric(text)];
  }
  return [makeBytes(toUtf8ByteArray(text))];
}

function getTotalBits(segs: QrSegment[], version: number): number {
  let result = 0;
  for (const seg of segs) {
    const ccbits = numCharCountBits(seg.mode, version);
    if (seg.numChars >= (1 << ccbits)) {
      return Number.POSITIVE_INFINITY;
    }
    result += 4 + ccbits + seg.getData().length;
  }
  return result;
}

function toUtf8ByteArray(str: string): number[] {
  const encoded = encodeURI(str);
  const result: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded.charAt(i) !== "%") {
      result.push(encoded.charCodeAt(i));
    } else {
      result.push(Number.parseInt(encoded.slice(i + 1, i + 3), 16));
      i += 2;
    }
  }
  return result;
}

function getNumRawDataModules(ver: number): number {
  if (ver < MIN_VERSION || ver > MAX_VERSION) {
    throw new RangeError("Version number out of range");
  }

  let result = ((16 * ver + 128) * ver) + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= ((25 * numAlign - 10) * numAlign) - 55;
    if (ver >= 7) {
      result -= 36;
    }
  }
  return result;
}

function getNumDataCodewords(ver: number, ecl: EccLevel): number {
  return (
    Math.floor(getNumRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver]
  );
}

function reedSolomonComputeDivisor(degree: number): number[] {
  if (degree < 1 || degree > 255) {
    throw new RangeError("Degree out of range");
  }

  const result: number[] = [];
  for (let i = 0; i < degree - 1; i++) {
    result.push(0);
  }
  result.push(1);

  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 2);
  }

  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);

  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= reedSolomonMultiply(coef, factor);
    });
  }

  return result;
}

function reedSolomonMultiply(x: number, y: number): number {
  if ((x >>> 8) !== 0 || (y >>> 8) !== 0) {
    throw new RangeError("Byte out of range");
  }

  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 285);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function encodeSegments(
  segs: QrSegment[],
  ecl: EccLevel,
  minVersion = 1,
  maxVersion = 40,
  mask = -1,
  boostEcl = false,
): QrCode {
  if (
    !(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) ||
    mask < -1 ||
    mask > 7
  ) {
    throw new RangeError("Invalid value");
  }

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

  if (version > maxVersion) {
    throw new RangeError("Data too long");
  }

  for (const newEcl of [MEDIUM, QUARTILE, HIGH]) {
    if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8) {
      ecl = newEcl;
    }
  }

  const bb: number[] = [];
  for (const seg of segs) {
    appendBits(seg.mode[0], 4, bb);
    appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
    for (const b of seg.getData()) {
      bb.push(b);
    }
  }

  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - (bb.length % 8)) % 8, bb);

  for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= (236 ^ 17)) {
    appendBits(padByte, 8, bb);
  }

  const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
  bb.forEach((b, i) => {
    dataCodewords[i >>> 3] |= b << (7 - (i & 7));
  });

  return new QrCode(version, ecl, dataCodewords, mask);
}

function renderLocalSvg(data: string, input: BuildQrSvgInput): string {
  const qr = encodeSegments(
    makeSegments(data),
    EccMap[input.errorCorrection ?? DEFAULT_QR_ERROR_CORRECTION],
    1,
    40,
    -1,
    false,
  );

  const border = normalizeQuietZone(input.quietZoneModules);
  const pixelSize = normalizePixelSize(input.pixelSize);
  const whiteColor = input.backgroundColor ?? "#ffffff";
  const blackColor = input.foregroundColor ?? "#111111";

  const size = qr.size + border * 2;
  const width = size * pixelSize;
  const height = size * pixelSize;

  const paths: string[] = [];
  for (let row = 0; row < qr.size; row++) {
    for (let col = 0; col < qr.size; col++) {
      if (!qr.modules[row][col]) {
        continue;
      }
      const x = (col + border) * pixelSize;
      const y = (row + border) * pixelSize;
      paths.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    `<rect fill="${whiteColor}" width="${width}" height="${height}"/>`,
    `<path fill="${blackColor}" d="${paths.join("")}"/>`,
    "</svg>",
  ].join("");
}

export function buildQrSvg(input: BuildQrSvgInput): string {
  return renderLocalSvg(normalizeContent(input.value), input);
}

export function qrSvgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildQrDataUri(input: BuildQrSvgInput): string {
  return qrSvgToDataUri(buildQrSvg(input));
}
