(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Base64;

var require = meteorInstall({"node_modules":{"meteor":{"base64":{"base64.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/base64/base64.js                                                              //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
module.export({
  Base64: () => Base64
});
// Base 64 encoding

const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE_64_VALS = Object.create(null);
const getChar = val => BASE_64_CHARS.charAt(val);
const getVal = ch => ch === '=' ? -1 : BASE_64_VALS[ch];
for (let i = 0; i < BASE_64_CHARS.length; i++) {
  BASE_64_VALS[getChar(i)] = i;
}
;
const encode = array => {
  if (typeof array === "string") {
    const str = array;
    array = newBinary(str.length);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      if (ch > 0xFF) {
        throw new Error("Not ascii. Base64.encode can only take ascii strings.");
      }
      array[i] = ch;
    }
  }
  const answer = [];
  let a = null;
  let b = null;
  let c = null;
  let d = null;
  for (let i = 0; i < array.length; i++) {
    switch (i % 3) {
      case 0:
        a = array[i] >> 2 & 0x3F;
        b = (array[i] & 0x03) << 4;
        break;
      case 1:
        b = b | array[i] >> 4 & 0xF;
        c = (array[i] & 0xF) << 2;
        break;
      case 2:
        c = c | array[i] >> 6 & 0x03;
        d = array[i] & 0x3F;
        answer.push(getChar(a));
        answer.push(getChar(b));
        answer.push(getChar(c));
        answer.push(getChar(d));
        a = null;
        b = null;
        c = null;
        d = null;
        break;
    }
  }
  if (a != null) {
    answer.push(getChar(a));
    answer.push(getChar(b));
    if (c == null) {
      answer.push('=');
    } else {
      answer.push(getChar(c));
    }
    if (d == null) {
      answer.push('=');
    }
  }
  return answer.join("");
};

// XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.
const newBinary = len => {
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
    const ret = [];
    for (let i = 0; i < len; i++) {
      ret.push(0);
    }
    ret.$Uint8ArrayPolyfill = true;
    return ret;
  }
  return new Uint8Array(new ArrayBuffer(len));
};
const decode = str => {
  let len = Math.floor(str.length * 3 / 4);
  if (str.charAt(str.length - 1) == '=') {
    len--;
    if (str.charAt(str.length - 2) == '=') {
      len--;
    }
  }
  const arr = newBinary(len);
  let one = null;
  let two = null;
  let three = null;
  let j = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    const v = getVal(c);
    switch (i % 4) {
      case 0:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }
        one = v << 2;
        break;
      case 1:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }
        one = one | v >> 4;
        arr[j++] = one;
        two = (v & 0x0F) << 4;
        break;
      case 2:
        if (v >= 0) {
          two = two | v >> 2;
          arr[j++] = two;
          three = (v & 0x03) << 6;
        }
        break;
      case 3:
        if (v >= 0) {
          arr[j++] = three | v;
        }
        break;
    }
  }
  return arr;
};
const Base64 = {
  encode,
  decode,
  newBinary
};
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/base64/base64.js");

/* Exports */
Package._define("base64", exports, {
  Base64: Base64
});

})();

//# sourceURL=meteor://💻app/packages/base64.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYmFzZTY0L2Jhc2U2NC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJCYXNlNjQiLCJCQVNFXzY0X0NIQVJTIiwiQkFTRV82NF9WQUxTIiwiT2JqZWN0IiwiY3JlYXRlIiwiZ2V0Q2hhciIsInZhbCIsImNoYXJBdCIsImdldFZhbCIsImNoIiwiaSIsImxlbmd0aCIsImVuY29kZSIsImFycmF5Iiwic3RyIiwibmV3QmluYXJ5IiwiY2hhckNvZGVBdCIsIkVycm9yIiwiYW5zd2VyIiwiYSIsImIiLCJjIiwiZCIsInB1c2giLCJqb2luIiwibGVuIiwiVWludDhBcnJheSIsIkFycmF5QnVmZmVyIiwicmV0IiwiJFVpbnQ4QXJyYXlQb2x5ZmlsbCIsImRlY29kZSIsIk1hdGgiLCJmbG9vciIsImFyciIsIm9uZSIsInR3byIsInRocmVlIiwiaiIsInYiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxNQUFNLEVBQUNBLENBQUEsS0FBSUE7QUFBTSxDQUFDLENBQUM7QUFBbEM7O0FBRUEsTUFBTUMsYUFBYSxHQUFHLGtFQUFrRTtBQUV4RixNQUFNQyxZQUFZLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDLElBQUksQ0FBQztBQUV4QyxNQUFNQyxPQUFPLEdBQUdDLEdBQUcsSUFBSUwsYUFBYSxDQUFDTSxNQUFNLENBQUNELEdBQUcsQ0FBQztBQUNoRCxNQUFNRSxNQUFNLEdBQUdDLEVBQUUsSUFBSUEsRUFBRSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBR1AsWUFBWSxDQUFDTyxFQUFFLENBQUM7QUFFdkQsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdULGFBQWEsQ0FBQ1UsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRTtFQUM3Q1IsWUFBWSxDQUFDRyxPQUFPLENBQUNLLENBQUMsQ0FBQyxDQUFD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Q0o7RUFDRjtFQUVBLE9BQU9MLEdBQUc7QUFDWixDQUFDO0FBRU0sTUFBTWpDLE1BQU0sR0FBRztFQUFFWSxNQUFNO0VBQUVrQixNQUFNO0VBQUVmO0FBQVUsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9iYXNlNjQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBCYXNlIDY0IGVuY29kaW5nXG5cbmNvbnN0IEJBU0VfNjRfQ0hBUlMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcblxuY29uc3QgQkFTRV82NF9WQUxTID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuY29uc3QgZ2V0Q2hhciA9IHZhbCA9PiBCQVNFXzY0X0NIQVJTLmNoYXJBdCh2YWwpO1xuY29uc3QgZ2V0VmFsID0gY2ggPT4gY2ggPT09ICc9JyA/IC0xIDogQkFTRV82NF9WQUxTW2NoXTtcblxuZm9yIChsZXQgaSA9IDA7IGkgPCBCQVNFXzY0X0NIQVJTLmxlbmd0aDsgaSsrKSB7XG4gIEJBU0VfNjRfVkFMU1tnZXRDaGFyKGkpXSA9IGk7XG59O1xuXG5jb25zdCBlbmNvZGUgPSBhcnJheSA9PiB7XG4gIGlmICh0eXBlb2YgYXJyYXkgPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBzdHIgPSBhcnJheTtcbiAgICBhcnJheSA9IG5ld0JpbmFyeShzdHIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaCA+IDB4RkYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIFwiTm90IGFzY2lpLiBCYXNlNjQuZW5jb2RlIGNhbiBvbmx5IHRha2UgYXNjaWkgc3RyaW5ncy5cIik7XG4gICAgICB9XG5cbiAgICAgIGFycmF5W2ldID0gY2g7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYW5zd2VyID0gW107XG4gIGxldCBhID0gbnVsbDtcbiAgbGV0IGIgPSBudWxsO1xuICBsZXQgYyA9IG51bGw7XG4gIGxldCBkID0gbnVsbDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgc3dpdGNoIChpICUgMykge1xuICAgICAgY2FzZSAwOlxuICAgICAgICBhID0gKGFycmF5W2ldID4+IDIpICYgMHgzRjtcbiAgICAgICAgYiA9IChhcnJheVtpXSAmIDB4MDMpIDw8IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOlxuICAgICAgICBiID0gYiB8IChhcnJheVtpXSA+PiA0KSAmIDB4RjtcbiAgICAgICAgYyA9IChhcnJheVtpXSAmIDB4RikgPDwgMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGMgPSBjIHwgKGFycmF5W2ldID4+IDYpICYgMHgwMztcbiAgICAgICAgZCA9IGFycmF5W2ldICYgMHgzRjtcbiAgICAgICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihhKSk7XG4gICAgICAgIGFuc3dlci5wdXNoKGdldENoYXIoYikpO1xuICAgICAgICBhbnN3ZXIucHVzaChnZXRDaGFyKGMpKTtcbiAgICAgICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihkKSk7XG4gICAgICAgIGEgPSBudWxsO1xuICAgICAgICBiID0gbnVsbDtcbiAgICAgICAgYyA9IG51bGw7XG4gICAgICAgIGQgPSBudWxsO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoYSAhPSBudWxsKSB7XG4gICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihhKSk7XG4gICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihiKSk7XG4gICAgaWYgKGMgPT0gbnVsbCkge1xuICAgICAgYW5zd2VyLnB1c2goJz0nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihjKSk7XG4gICAgfVxuXG4gICAgaWYgKGQgPT0gbnVsbCkge1xuICAgICAgYW5zd2VyLnB1c2goJz0nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYW5zd2VyLmpvaW4oXCJcIik7XG59O1xuXG5cblxuLy8gWFhYIFRoaXMgaXMgYSB3ZWlyZCBwbGFjZSBmb3IgdGhpcyB0byBsaXZlLCBidXQgaXQncyB1c2VkIGJvdGggYnlcbi8vIHRoaXMgcGFja2FnZSBhbmQgJ2Vqc29uJywgYW5kIHdlIGNhbid0IHB1dCBpdCBpbiAnZWpzb24nIHdpdGhvdXRcbi8vIGludHJvZHVjaW5nIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS4gSXQgc2hvdWxkIHByb2JhYmx5IGJlIGluIGl0cyBvd25cbi8vIHBhY2thZ2Ugb3IgYXMgYSBoZWxwZXIgaW4gYSBwYWNrYWdlIHRoYXQgYm90aCAnYmFzZTY0JyBhbmQgJ2Vqc29uJ1xuLy8gdXNlLlxuY29uc3QgbmV3QmluYXJ5ID0gbGVuID0+IHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc3QgcmV0ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgcmV0LnB1c2goMCk7XG4gICAgfVxuXG4gICAgcmV0LiRVaW50OEFycmF5UG9seWZpbGwgPSB0cnVlO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG5ldyBBcnJheUJ1ZmZlcihsZW4pKTtcbn07XG5cbmNvbnN0IGRlY29kZSA9IHN0ciA9PiB7XG4gIGxldCBsZW4gPSBNYXRoLmZsb29yKChzdHIubGVuZ3RoICogMykgLyA0KTtcbiAgaWYgKHN0ci5jaGFyQXQoc3RyLmxlbmd0aCAtIDEpID09ICc9Jykge1xuICAgIGxlbi0tO1xuICAgIGlmIChzdHIuY2hhckF0KHN0ci5sZW5ndGggLSAyKSA9PSAnPScpIHtcbiAgICAgIGxlbi0tO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGFyciA9IG5ld0JpbmFyeShsZW4pO1xuXG4gIGxldCBvbmUgPSBudWxsO1xuICBsZXQgdHdvID0gbnVsbDtcbiAgbGV0IHRocmVlID0gbnVsbDtcblxuICBsZXQgaiA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICBjb25zdCB2ID0gZ2V0VmFsKGMpO1xuICAgIHN3aXRjaCAoaSAlIDQpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgaWYgKHYgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGJhc2U2NCBzdHJpbmcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9uZSA9IHYgPDwgMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGlmICh2IDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBiYXNlNjQgc3RyaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvbmUgPSBvbmUgfCAodiA+PiA0KTtcbiAgICAgICAgYXJyW2orK10gPSBvbmU7XG4gICAgICAgIHR3byA9ICh2ICYgMHgwRikgPDwgNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGlmICh2ID49IDApIHtcbiAgICAgICAgICB0d28gPSB0d28gfCAodiA+PiAyKTtcbiAgICAgICAgICBhcnJbaisrXSA9IHR3bztcbiAgICAgICAgICB0aHJlZSA9ICh2ICYgMHgwMykgPDwgNjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAodiA+PSAwKSB7XG4gICAgICAgICAgYXJyW2orK10gPSB0aHJlZSB8IHY7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXJyO1xufTtcblxuZXhwb3J0IGNvbnN0IEJhc2U2NCA9IHsgZW5jb2RlLCBkZWNvZGUsIG5ld0JpbmFyeSB9O1xuIl19