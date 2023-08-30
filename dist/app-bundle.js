/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/krajsy.ts":
/*!***********************!*\
  !*** ./src/krajsy.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.assemble = exports.CPU = exports.Instructions = exports.Registers = exports.RAM = exports.ROM = void 0;
const Empty = (length) => Array.from(Array(length).keys()).map(() => 0);
class ROM {
    constructor(data = null) {
        var _a;
        this.data = Empty(256);
        this.memcpy(data, 0, (_a = data === null || data === void 0 ? void 0 : data.length) !== null && _a !== void 0 ? _a : 0);
    }
    memcpy(src, dest, size) {
        for (let i = dest; i < dest + size; ++i)
            this.data[i] = src[i];
    }
    get(idx) {
        if (idx < 0 || idx > 255)
            throw "Program tried to access memory out of bounds!";
        return this.data[idx];
    }
    dump() {
        return this.data.map((x, i) => x.toString(16).padStart(2, '0') + (((i + 1) % 16) ? ' ' : '\n')).join('');
    }
}
exports.ROM = ROM;
class RAM extends ROM {
    set(idx, data) {
        if (idx < 0 || idx > 255)
            throw "Program tried to access memory out of bounds!";
        this.data[idx] = data;
    }
    reset() {
        this.data = Empty(256);
    }
}
exports.RAM = RAM;
var Registers;
(function (Registers) {
    Registers[Registers["A"] = 0] = "A";
    Registers[Registers["B"] = 1] = "B";
    Registers[Registers["PC"] = 2] = "PC";
})(Registers || (exports.Registers = Registers = {}));
var Instructions;
(function (Instructions) {
    Instructions[Instructions["INV"] = 0] = "INV";
    Instructions[Instructions["ADD"] = 1] = "ADD";
    Instructions[Instructions["SUB"] = 2] = "SUB";
    Instructions[Instructions["OR"] = 3] = "OR";
    Instructions[Instructions["AND"] = 4] = "AND";
    Instructions[Instructions["XOR"] = 5] = "XOR";
    Instructions[Instructions["GET"] = 6] = "GET";
    Instructions[Instructions["SET"] = 7] = "SET";
    Instructions[Instructions["LD"] = 8] = "LD";
    Instructions[Instructions["SWP"] = 9] = "SWP";
    Instructions[Instructions["INC"] = 10] = "INC";
    Instructions[Instructions["DEC"] = 11] = "DEC";
    Instructions[Instructions["SL"] = 12] = "SL";
    Instructions[Instructions["SR"] = 13] = "SR";
    // ...
    Instructions[Instructions["JZ"] = 28] = "JZ";
    Instructions[Instructions["JNZ"] = 29] = "JNZ";
    Instructions[Instructions["JG"] = 30] = "JG";
    Instructions[Instructions["JL"] = 31] = "JL";
})(Instructions || (exports.Instructions = Instructions = {}));
class CPU {
    constructor(rom, ram) {
        this.rom = rom;
        this.ram = ram;
        this.A = this.B = this.PC = 0;
    }
    step() {
        var _a, _b;
        // Read instruction code from rom
        const opcode = this.rom.get(this.PC);
        const op0 = (opcode >> 7) & 0b1; // Selection between A/B register as X
        const op1 = (opcode >> 5) & 0b11; // Selection between A/B/RAM/ROM as Y
        const ins = opcode & 0b11111; // Instruction to execute between X and Y
        const X = op0 ? this.B : this.A;
        const Y = op1 == 0b00 ? this.A :
            op1 == 0b01 ? this.B :
                op1 == 0b10 ? this.ram.get(this.rom.get(++this.PC)) :
                    op1 == 0b11 ? this.rom.get(++this.PC) : 0;
        let X0 = null;
        let Y0 = null;
        switch (ins) {
            case Instructions.INV:
                X0 = ~X;
                break;
            case Instructions.ADD:
                X0 = X + Y;
                break;
            case Instructions.SUB:
                X0 = X - Y;
                break;
            case Instructions.OR:
                X0 = X | Y;
                break;
            case Instructions.AND:
                X0 = X & Y;
                break;
            case Instructions.XOR:
                X0 = X ^ Y;
                break;
            case Instructions.GET:
                X0 = this.ram.get(Y);
                break;
            case Instructions.SET:
                this.ram.set(Y, X);
                break;
            case Instructions.LD:
                X0 = Y;
                break;
            case Instructions.INC:
                X0 = X + 1;
                break;
            case Instructions.DEC:
                X0 = X - 1;
                break;
            case Instructions.SL:
                X0 = X << 1;
                break;
            case Instructions.SR:
                X0 = X >> 1;
                break;
            case Instructions.SWP:
                {
                    [this.A, this.B] = [this.B, this.A];
                }
                break;
            case Instructions.JZ:
                {
                    if (X == 0)
                        this.PC = Y - 1;
                }
                break;
            case Instructions.JNZ:
                {
                    if (X != 0)
                        this.PC = Y - 1;
                }
                break;
            case Instructions.JG:
                {
                    if (X > 0)
                        this.PC = Y - 1;
                }
                break;
            case Instructions.JL:
                {
                    if (X < 0)
                        this.PC = Y - 1;
                }
                break;
        }
        // Update registers, make sure they are not overflowing
        this.PC = (this.PC + 1) & 0xFF;
        this.A = ((_a = (op0 ? Y0 : X0)) !== null && _a !== void 0 ? _a : this.A) & 0xFF;
        this.B = ((_b = (op0 ? X0 : Y0)) !== null && _b !== void 0 ? _b : this.B) & 0xFF;
    }
    reset() {
        this.ram.reset();
        this.A = this.B = this.PC = 0;
    }
    dump() {
        console.log(`A: ${this.A.toString(16)}`);
        console.log(`B: ${this.B.toString(16)}`);
        console.log(`PC: ${this.PC.toString(16)}`);
        console.log(`RAM:\n${this.ram.dump()}`);
        console.log(`ROM:\n${this.rom.dump()}`);
    }
}
exports.CPU = CPU;
const _assemble = (code, labels = {}, preCompile = true) => {
    const lines = code.split('\n').filter((x) => x.trim().length != 0 && !x.startsWith(';'));
    const bytes = [];
    let layout = "";
    const fetchOperant = (token) => {
        if (token == undefined)
            return [0, -1];
        for (const [key, value] of Object.entries(labels).reverse())
            if (typeof (value) === "string")
                token = token.replace(key, value);
        switch (token[0]) {
            case 'A':
                return [0b00, -1];
            case 'B':
                return [0b01, -1];
            case '*':
                return [0b10, parseInt(token.substring(1), 16)];
            case '#':
                return [0b11, parseInt(token.substring(1), 16)];
            default:
                // in this stage we will ignore potential errors and will assume it must be a label
                if (preCompile) {
                    return [0b11, 0];
                }
                if (typeof (labels[token]) === "number") {
                    return [0b11, labels[token]];
                }
                throw "Invalid operant value!";
        }
    };
    lines.forEach((line) => {
        const tokens = line.split(';')[0].trim().split(' ');
        const opcode = tokens.shift().toUpperCase();
        const operants = tokens.join('').toUpperCase().split(',').filter(x => x.trim().length > 0).map(x => x.trim());
        if (opcode.endsWith(':')) {
            labels[opcode.substring(0, opcode.length - 1)] = bytes.length;
            return;
        }
        if (operants.length >= 1 && operants[0].startsWith('=')) {
            labels[opcode] = operants.join('').substring(1);
            return;
        }
        const ins = Instructions[opcode];
        if (ins == undefined)
            throw "Opcode does not exist!";
        const x = operants.length > 0 && fetchOperant(operants[0]);
        const y = operants.length > 1 && fetchOperant(operants[1]);
        if (x[0] > 0b01)
            throw "First operant can only be A or B!";
        const code = (x[0] << 7) | (y[0] << 5) | ins;
        let row = code.toString(16).padStart(2, '0') + ' ';
        let addr = bytes.length;
        bytes.push(code);
        if (y[1] >= 0) {
            bytes.push(y[1]);
            row += y[1].toString(16).padStart(2, '0') + ' ';
        }
        layout += (addr.toString() + ':').padStart(4, '0').padEnd(8, ' ') + row.padEnd(10, ' ') + `; ${line}\n`;
    });
    return {
        bytes: bytes,
        layout: layout,
        labels: labels,
    };
};
const assemble = (code) => {
    const { labels } = _assemble(code); // pre compile to get all labels
    return _assemble(code, labels, false);
};
exports.assemble = assemble;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const krajsy_1 = __webpack_require__(/*! ./krajsy */ "./src/krajsy.ts");
window.onload = () => {
    const input = document.getElementById("input");
    const output = document.getElementById("output");
    const ram = document.getElementById("ram");
    const regA = document.getElementById("regA");
    const regB = document.getElementById("regB");
    const regPC = document.getElementById("regPC");
    const reset = document.getElementById("reset");
    const step = document.getElementById("step");
    const compile = document.getElementById("compile");
    const run = document.getElementById("run");
    const share = document.getElementById("share");
    const speedlabel = document.getElementById("speedlabel");
    const speed = document.getElementById("speed");
    let result = null;
    let cpu = null;
    let inv = null;
    if (window.location.search.length > 0) {
        try {
            input.value = atob(window.location.search.replace("?share=", ""));
        }
        catch (e) { }
    }
    const setTickUpdater = (value) => {
        if (value == null) {
            inv = setInterval(() => {
                step.onclick(null);
            }, parseInt(speed.value) * 10);
        }
        else {
            clearInterval(value);
            inv = null;
        }
    };
    reset.onclick = () => {
        cpu === null || cpu === void 0 ? void 0 : cpu.reset();
        updateDisplay();
    };
    step.onclick = () => {
        let lastIns = result.layout.split('\n').filter(x => x.trim().length > 0).pop();
        if (lastIns == undefined) {
            if (inv != null)
                run.onclick(null);
            alert("Nothing to execute, compile first!");
        }
        if (parseInt(lastIns) < cpu.PC) {
            if (inv != null)
                run.onclick(null);
            alert("PC hit end of ROM");
        }
        cpu === null || cpu === void 0 ? void 0 : cpu.step();
        updateDisplay();
    };
    compile.onclick = () => {
        try {
            result = (0, krajsy_1.assemble)(input.value);
            output.innerHTML = result.layout;
            cpu = new krajsy_1.CPU(new krajsy_1.ROM(result.bytes), new krajsy_1.RAM());
            updateDisplay();
        }
        catch (e) {
            output.value = e;
        }
    };
    run.onclick = () => {
        run.innerText = inv == null ? "Stop" : "Run";
        setTickUpdater(inv);
    };
    share.onclick = () => {
        const url = window.location;
        const base = url.toString().replace(window.location.search, "");
        const link = base + '?share=' + btoa(input.value);
        navigator.clipboard.writeText(link).then(() => {
            alert("Copied link to clipboard!");
        }, (err) => {
            alert("Error copying link to clipboard: " + err);
        });
    };
    speed.onmousemove = () => {
        speedlabel.innerText = speed.value;
        if (inv != null) {
            clearInterval(inv);
            setTickUpdater(inv);
            setTickUpdater(inv);
        }
    };
    input.addEventListener('keydown', function (e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            // set textarea value to: text before caret + tab + text after caret
            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
            // put caret at right position again
            this.selectionStart = this.selectionEnd = start + 1;
        }
    });
    const updateDisplay = () => {
        var _a;
        ram.value = (_a = cpu === null || cpu === void 0 ? void 0 : cpu.ram) === null || _a === void 0 ? void 0 : _a.dump();
        regA.value = `0x${cpu === null || cpu === void 0 ? void 0 : cpu.A.toString(16).padStart(2, '0')}\t0b${cpu === null || cpu === void 0 ? void 0 : cpu.A.toString(2).padStart(8, '0')}\t${cpu === null || cpu === void 0 ? void 0 : cpu.A}`;
        regB.value = `0x${cpu === null || cpu === void 0 ? void 0 : cpu.B.toString(16).padStart(2, '0')}\t0b${cpu === null || cpu === void 0 ? void 0 : cpu.B.toString(2).padStart(8, '0')}\t${cpu === null || cpu === void 0 ? void 0 : cpu.B}`;
        regPC.value = `0x${cpu === null || cpu === void 0 ? void 0 : cpu.PC.toString(16).padStart(2, '0')}\t0b${cpu === null || cpu === void 0 ? void 0 : cpu.PC.toString(2).padStart(8, '0')}\t${cpu === null || cpu === void 0 ? void 0 : cpu.PC}`;
        output.value = result.layout.split('\n').map((x) => parseInt(x) == cpu.PC ? `>${x}` : ' ' + x).join('\n').replace(/\n$/g, '\n\n');
    };
    compile.onclick(null);
    speed.onmousemove(null);
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RSxFQUFFLEVBQUUsQ0FBQztRQUVsSCxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwSSxDQUFDO0lBRUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9LcmFqc3lBcmNoLy4vc3JjL2tyYWpzeS50cyIsIndlYnBhY2s6Ly9LcmFqc3lBcmNoL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0tyYWpzeUFyY2gvLi9zcmMvYXBwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEVtcHR5ID0gKGxlbmd0aDogbnVtYmVyKSA9PiBBcnJheS5mcm9tKEFycmF5KGxlbmd0aCkua2V5cygpKS5tYXAoKCkgPT4gMCk7XG5cbmV4cG9ydCBjbGFzcyBST00ge1xuICBwcm90ZWN0ZWQgZGF0YTogQXJyYXk8bnVtYmVyPlxuXG4gIGNvbnN0cnVjdG9yKGRhdGE6IEFycmF5PG51bWJlcj4gPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhID0gRW1wdHkoMjU2KTtcbiAgICB0aGlzLm1lbWNweShkYXRhLCAwLCBkYXRhPy5sZW5ndGggPz8gMCk7XG4gIH1cblxuICBtZW1jcHkoc3JjOiBBcnJheTxudW1iZXI+LCBkZXN0OiBudW1iZXIsIHNpemU6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBkZXN0OyBpIDwgZGVzdCArIHNpemU7ICsraSlcbiAgICAgIHRoaXMuZGF0YVtpXSA9IHNyY1tpXVxuICB9XG5cbiAgZ2V0KGlkeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoaWR4IDwgMCB8fCBpZHggPiAyNTUpXG4gICAgICB0aHJvdyBcIlByb2dyYW0gdHJpZWQgdG8gYWNjZXNzIG1lbW9yeSBvdXQgb2YgYm91bmRzIVwiO1xuICAgIHJldHVybiB0aGlzLmRhdGFbaWR4XTtcbiAgfVxuXG4gIGR1bXAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLm1hcCgoeCwgaSkgPT4geC50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKSArICgoKGkgKyAxKSAlIDE2KSA/ICcgJyA6ICdcXG4nKSkuam9pbignJylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUkFNIGV4dGVuZHMgUk9NIHtcbiAgc2V0KGlkeDogbnVtYmVyLCBkYXRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoaWR4IDwgMCB8fCBpZHggPiAyNTUpXG4gICAgICB0aHJvdyBcIlByb2dyYW0gdHJpZWQgdG8gYWNjZXNzIG1lbW9yeSBvdXQgb2YgYm91bmRzIVwiO1xuICAgIHRoaXMuZGF0YVtpZHhdID0gZGF0YTtcbiAgfVxuXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuZGF0YSA9IEVtcHR5KDI1Nik7XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gUmVnaXN0ZXJzIHtcbiAgQSA9IDAsXG4gIEIgPSAxLFxuICBQQyA9IDIsXG59XG5cbmV4cG9ydCBlbnVtIEluc3RydWN0aW9ucyB7XG4gIElOViA9IDBiMDAwMDAsXG4gIEFERCA9IDBiMDAwMDEsXG4gIFNVQiA9IDBiMDAwMTAsXG4gIE9SID0gMGIwMDAxMSxcbiAgQU5EID0gMGIwMDEwMCxcbiAgWE9SID0gMGIwMDEwMSxcbiAgR0VUID0gMGIwMDExMCxcbiAgU0VUID0gMGIwMDExMSxcbiAgTEQgPSAwYjAxMDAwLFxuICBTV1AgPSAwYjAxMDAxLFxuICBJTkMgPSAwYjAxMDEwLFxuICBERUMgPSAwYjAxMDExLFxuICBTTCA9IDBiMDExMDAsXG4gIFNSID0gMGIwMTEwMSxcbiAgLy8gLi4uXG4gIEpaID0gMGIxMTEwMCxcbiAgSk5aID0gMGIxMTEwMSxcbiAgSkcgPSAwYjExMTEwLFxuICBKTCA9IDBiMTExMTEsXG59XG5cbmV4cG9ydCBjbGFzcyBDUFUge1xuICBwdWJsaWMgcm9tOiBST007XG4gIHB1YmxpYyByYW06IFJBTTtcblxuICBwdWJsaWMgQTogbnVtYmVyO1xuICBwdWJsaWMgQjogbnVtYmVyO1xuICBwdWJsaWMgUEM6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcihyb206IFJPTSwgcmFtOiBSQU0pIHtcbiAgICB0aGlzLnJvbSA9IHJvbTtcbiAgICB0aGlzLnJhbSA9IHJhbTtcbiAgICB0aGlzLkEgPSB0aGlzLkIgPSB0aGlzLlBDID0gMDtcbiAgfVxuXG4gIHN0ZXAoKTogdm9pZCB7XG4gICAgLy8gUmVhZCBpbnN0cnVjdGlvbiBjb2RlIGZyb20gcm9tXG4gICAgY29uc3Qgb3Bjb2RlID0gdGhpcy5yb20uZ2V0KHRoaXMuUEMpO1xuXG4gICAgY29uc3Qgb3AwID0gKG9wY29kZSA+PiA3KSAmIDBiMTsgIC8vIFNlbGVjdGlvbiBiZXR3ZWVuIEEvQiByZWdpc3RlciBhcyBYXG4gICAgY29uc3Qgb3AxID0gKG9wY29kZSA+PiA1KSAmIDBiMTE7IC8vIFNlbGVjdGlvbiBiZXR3ZWVuIEEvQi9SQU0vUk9NIGFzIFlcbiAgICBjb25zdCBpbnMgPSBvcGNvZGUgJiAwYjExMTExOyAgICAgLy8gSW5zdHJ1Y3Rpb24gdG8gZXhlY3V0ZSBiZXR3ZWVuIFggYW5kIFlcblxuICAgIGNvbnN0IFggPSBvcDAgPyB0aGlzLkIgOiB0aGlzLkE7XG5cbiAgICBjb25zdCBZID0gb3AxID09IDBiMDAgPyB0aGlzLkEgOlxuICAgICAgICAgICAgICBvcDEgPT0gMGIwMSA/IHRoaXMuQiA6XG4gICAgICAgICAgICAgIG9wMSA9PSAwYjEwID8gdGhpcy5yYW0uZ2V0KHRoaXMucm9tLmdldCgrK3RoaXMuUEMpKSA6XG4gICAgICAgICAgICAgIG9wMSA9PSAwYjExID8gdGhpcy5yb20uZ2V0KCsrdGhpcy5QQykgOiAwO1xuXG4gICAgbGV0IFgwID0gbnVsbDtcbiAgICBsZXQgWTAgPSBudWxsO1xuXG4gICAgc3dpdGNoIChpbnMpIHtcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLklOVjogWDAgPSB+WDsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5BREQ6IFgwID0gWCArIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU1VCOiBYMCA9IFggLSBZOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLk9SOiAgWDAgPSBYIHwgWTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5BTkQ6IFgwID0gWCAmIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuWE9SOiBYMCA9IFggXiBZOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkdFVDogWDAgPSB0aGlzLnJhbS5nZXQoWSk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU0VUOiB0aGlzLnJhbS5zZXQoWSwgWCk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuTEQ6ICBYMCA9IFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSU5DOiBYMCA9IFgrMTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5ERUM6IFgwID0gWC0xOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLlNMOiAgWDAgPSBYIDw8IDE7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU1I6ICBYMCA9IFggPj4gMTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5TV1A6IHtcbiAgICAgICAgW3RoaXMuQSwgdGhpcy5CXSA9IFt0aGlzLkIsIHRoaXMuQV07XG4gICAgICB9IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSlo6IHtcbiAgICAgICAgaWYgKFggPT0gMCkgdGhpcy5QQyA9IFkgLSAxO1xuICAgICAgfSBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkpOWjoge1xuICAgICAgICBpZiAoWCAhPSAwKSB0aGlzLlBDID0gWSAtIDE7XG4gICAgICB9IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSkc6IHtcbiAgICAgICAgaWYgKFggPiAwKSB0aGlzLlBDID0gWSAtIDE7XG4gICAgICB9IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSkw6IHtcbiAgICAgICAgaWYgKFggPCAwKSB0aGlzLlBDID0gWSAtIDE7XG4gICAgICB9IGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSByZWdpc3RlcnMsIG1ha2Ugc3VyZSB0aGV5IGFyZSBub3Qgb3ZlcmZsb3dpbmdcbiAgICB0aGlzLlBDID0gKHRoaXMuUEMgKyAxKSAmIDB4RkY7XG4gICAgdGhpcy5BID0gKChvcDAgPyBZMCA6IFgwKSA/PyB0aGlzLkEpICYgMHhGRjtcbiAgICB0aGlzLkIgPSAoKG9wMCA/IFgwIDogWTApID8/IHRoaXMuQikgJiAweEZGO1xuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5yYW0ucmVzZXQoKTtcbiAgICB0aGlzLkEgPSB0aGlzLkIgPSB0aGlzLlBDID0gMDtcbiAgfVxuXG4gIGR1bXAoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coYEE6ICR7dGhpcy5BLnRvU3RyaW5nKDE2KX1gKTtcbiAgICBjb25zb2xlLmxvZyhgQjogJHt0aGlzLkIudG9TdHJpbmcoMTYpfWApO1xuICAgIGNvbnNvbGUubG9nKGBQQzogJHt0aGlzLlBDLnRvU3RyaW5nKDE2KX1gKTtcbiAgICBjb25zb2xlLmxvZyhgUkFNOlxcbiR7dGhpcy5yYW0uZHVtcCgpfWApO1xuICAgIGNvbnNvbGUubG9nKGBST006XFxuJHt0aGlzLnJvbS5kdW1wKCl9YCk7XG4gIH1cbn1cblxudHlwZSBMYWJlbE1hcCA9IHtbaWQ6IHN0cmluZ106IG51bWJlcnxzdHJpbmc7fTtcblxuZXhwb3J0IGludGVyZmFjZSBBc3NlbWJsZVJlc3VsdCB7XG4gIGJ5dGVzOiBudW1iZXJbXSxcbiAgbGF5b3V0OiBzdHJpbmcsXG4gIGxhYmVsczogTGFiZWxNYXAsXG59XG5cbmNvbnN0IF9hc3NlbWJsZSA9IChjb2RlOiBzdHJpbmcsIGxhYmVsczogTGFiZWxNYXAgPSB7fSwgcHJlQ29tcGlsZSA9IHRydWUpOiBBc3NlbWJsZVJlc3VsdCA9PiB7XG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IGNvZGUuc3BsaXQoJ1xcbicpLmZpbHRlcigoeCkgPT4geC50cmltKCkubGVuZ3RoICE9IDAgJiYgIXguc3RhcnRzV2l0aCgnOycpKTtcblxuICBjb25zdCBieXRlczogbnVtYmVyW10gPSBbXTtcbiAgbGV0IGxheW91dCA9IFwiXCI7XG5cblxuICBjb25zdCBmZXRjaE9wZXJhbnQgPSAodG9rZW46IHN0cmluZyk6IFtudW1iZXIsIG51bWJlcl0gPT4ge1xuICAgIGlmICh0b2tlbiA9PSB1bmRlZmluZWQpIFxuICAgICAgcmV0dXJuIFsgMCwgLTEgXTtcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGxhYmVscykucmV2ZXJzZSgpKVxuICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHRva2VuID0gdG9rZW4ucmVwbGFjZShrZXksIHZhbHVlKTtcblxuICAgIHN3aXRjaCh0b2tlblswXSkge1xuICAgICAgY2FzZSAnQSc6XG4gICAgICAgIHJldHVybiBbIDBiMDAsIC0xIF1cbiAgICAgIGNhc2UgJ0InOlxuICAgICAgICByZXR1cm4gWyAwYjAxLCAtMSBdXG4gICAgICBjYXNlICcqJzpcbiAgICAgICAgcmV0dXJuIFsgMGIxMCwgcGFyc2VJbnQodG9rZW4uc3Vic3RyaW5nKDEpLCAxNikgXVxuICAgICAgY2FzZSAnIyc6XG4gICAgICAgIHJldHVybiBbIDBiMTEsIHBhcnNlSW50KHRva2VuLnN1YnN0cmluZygxKSwgMTYpIF1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIGluIHRoaXMgc3RhZ2Ugd2Ugd2lsbCBpZ25vcmUgcG90ZW50aWFsIGVycm9ycyBhbmQgd2lsbCBhc3N1bWUgaXQgbXVzdCBiZSBhIGxhYmVsXG4gICAgICAgIGlmIChwcmVDb21waWxlKSB7XG4gICAgICAgICAgcmV0dXJuIFsgMGIxMSwgMCBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZihsYWJlbHNbdG9rZW5dKSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIHJldHVybiBbIDBiMTEsIGxhYmVsc1t0b2tlbl0gYXMgbnVtYmVyIF07XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBcIkludmFsaWQgb3BlcmFudCB2YWx1ZSFcIjtcbiAgICB9XG4gIH1cblxuICBsaW5lcy5mb3JFYWNoKChsaW5lOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0b2tlbnMgPSBsaW5lLnNwbGl0KCc7JylbMF0udHJpbSgpLnNwbGl0KCcgJyk7XG4gICAgY29uc3Qgb3Bjb2RlID0gdG9rZW5zLnNoaWZ0KCkudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCBvcGVyYW50cyA9IHRva2Vucy5qb2luKCcnKS50b1VwcGVyQ2FzZSgpLnNwbGl0KCcsJykuZmlsdGVyKHggPT4geC50cmltKCkubGVuZ3RoID4gMCkubWFwKHggPT4geC50cmltKCkpO1xuXG4gICAgaWYgKG9wY29kZS5lbmRzV2l0aCgnOicpKSB7XG4gICAgICBsYWJlbHNbb3Bjb2RlLnN1YnN0cmluZygwLCBvcGNvZGUubGVuZ3RoLTEpXSA9IGJ5dGVzLmxlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob3BlcmFudHMubGVuZ3RoID49IDEgJiYgb3BlcmFudHNbMF0uc3RhcnRzV2l0aCgnPScpKSB7XG4gICAgICBsYWJlbHNbb3Bjb2RlXSA9IG9wZXJhbnRzLmpvaW4oJycpLnN1YnN0cmluZygxKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbnM6IG51bWJlciA9IEluc3RydWN0aW9uc1tvcGNvZGVdO1xuICAgIGlmIChpbnMgPT0gdW5kZWZpbmVkKVxuICAgICAgdGhyb3cgXCJPcGNvZGUgZG9lcyBub3QgZXhpc3QhXCI7XG5cbiAgICBjb25zdCB4ID0gb3BlcmFudHMubGVuZ3RoID4gMCAmJiBmZXRjaE9wZXJhbnQob3BlcmFudHNbMF0pO1xuICAgIGNvbnN0IHkgPSBvcGVyYW50cy5sZW5ndGggPiAxICYmIGZldGNoT3BlcmFudChvcGVyYW50c1sxXSk7XG5cbiAgICBpZiAoeFswXSA+IDBiMDEpXG4gICAgICB0aHJvdyBcIkZpcnN0IG9wZXJhbnQgY2FuIG9ubHkgYmUgQSBvciBCIVwiO1xuXG4gICAgY29uc3QgY29kZSA9ICh4WzBdIDw8IDcpIHwgKHlbMF0gPDwgNSkgfCBpbnM7XG4gICAgbGV0IHJvdyA9IGNvZGUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykgKyAnICc7XG4gICAgbGV0IGFkZHIgPSBieXRlcy5sZW5ndGg7XG5cbiAgICBieXRlcy5wdXNoKGNvZGUpO1xuXG4gICAgaWYgKHlbMV0gPj0gMCkge1xuICAgICAgYnl0ZXMucHVzaCh5WzFdKTtcbiAgICAgIHJvdyArPSB5WzFdLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpICsgJyAnO1xuICAgIH1cblxuICAgIGxheW91dCArPSAoYWRkci50b1N0cmluZygpICsgJzonKS5wYWRTdGFydCg0LCAnMCcpLnBhZEVuZCg4LCAnICcpICsgcm93LnBhZEVuZCgxMCwgJyAnKSArIGA7ICR7bGluZX1cXG5gO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGJ5dGVzOiBieXRlcyxcbiAgICBsYXlvdXQ6IGxheW91dCxcbiAgICBsYWJlbHM6IGxhYmVscyxcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGFzc2VtYmxlID0gKGNvZGU6IHN0cmluZyk6IEFzc2VtYmxlUmVzdWx0ID0+IHtcbiAgY29uc3QgeyBsYWJlbHMgfSA9IF9hc3NlbWJsZShjb2RlKTsgLy8gcHJlIGNvbXBpbGUgdG8gZ2V0IGFsbCBsYWJlbHNcbiAgcmV0dXJuIF9hc3NlbWJsZShjb2RlLCBsYWJlbHMsIGZhbHNlKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBST00sIFJBTSwgQ1BVLCBhc3NlbWJsZSwgQXNzZW1ibGVSZXN1bHQgfSBmcm9tICcuL2tyYWpzeSdcblxuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5wdXRcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3Qgb3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRwdXRcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3QgcmFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyYW1cIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3QgcmVnQSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVnQVwiKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBjb25zdCByZWdCID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdCXCIpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gIGNvbnN0IHJlZ1BDID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdQQ1wiKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0IHJlc2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXNldFwiKTtcbiAgY29uc3Qgc3RlcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcFwiKTtcbiAgY29uc3QgY29tcGlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29tcGlsZVwiKTtcbiAgY29uc3QgcnVuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJydW5cIik7XG4gIGNvbnN0IHNoYXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaGFyZVwiKTtcbiAgY29uc3Qgc3BlZWRsYWJlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3BlZWRsYWJlbFwiKTtcbiAgY29uc3Qgc3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNwZWVkXCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgbGV0IHJlc3VsdDogQXNzZW1ibGVSZXN1bHQgPSBudWxsO1xuICBsZXQgY3B1OiBDUFUgPSBudWxsO1xuICBsZXQgaW52ID0gbnVsbDtcblxuICBpZiAod2luZG93LmxvY2F0aW9uLnNlYXJjaC5sZW5ndGggPiAwKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlucHV0LnZhbHVlID0gYXRvYih3aW5kb3cubG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoXCI/c2hhcmU9XCIsIFwiXCIpKTtcbiAgICB9IGNhdGNoKGUpIHt9XG4gIH1cblxuICBjb25zdCBzZXRUaWNrVXBkYXRlciA9ICh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpbnYgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIHN0ZXAub25jbGljayhudWxsKTtcbiAgICAgIH0sIHBhcnNlSW50KHNwZWVkLnZhbHVlKSAqIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xlYXJJbnRlcnZhbCh2YWx1ZSk7XG4gICAgICBpbnYgPSBudWxsO1xuICAgIH1cbiAgfVxuXG5cbiAgcmVzZXQub25jbGljayA9ICgpID0+IHtcbiAgICBjcHU/LnJlc2V0KCk7XG4gICAgdXBkYXRlRGlzcGxheSgpO1xuICB9XG5cbiAgc3RlcC5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGxldCBsYXN0SW5zID0gcmVzdWx0LmxheW91dC5zcGxpdCgnXFxuJykuZmlsdGVyKHggPT4geC50cmltKCkubGVuZ3RoID4gMCkucG9wKCk7XG4gICAgaWYgKGxhc3RJbnMgPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoaW52ICE9IG51bGwpXG4gICAgICAgIHJ1bi5vbmNsaWNrKG51bGwpO1xuICAgICAgYWxlcnQoXCJOb3RoaW5nIHRvIGV4ZWN1dGUsIGNvbXBpbGUgZmlyc3QhXCIpO1xuICAgIH1cblxuICAgIGlmIChwYXJzZUludChsYXN0SW5zKSA8IGNwdS5QQykge1xuICAgICAgaWYgKGludiAhPSBudWxsKVxuICAgICAgICBydW4ub25jbGljayhudWxsKTtcbiAgICAgIGFsZXJ0KFwiUEMgaGl0IGVuZCBvZiBST01cIik7XG4gICAgfVxuXG4gICAgY3B1Py5zdGVwKCk7XG4gICAgdXBkYXRlRGlzcGxheSgpO1xuICB9XG5cbiAgY29tcGlsZS5vbmNsaWNrID0gKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBhc3NlbWJsZShpbnB1dC52YWx1ZSk7XG4gICAgICBvdXRwdXQuaW5uZXJIVE1MID0gcmVzdWx0LmxheW91dDtcbiAgICAgIGNwdSA9IG5ldyBDUFUobmV3IFJPTShyZXN1bHQuYnl0ZXMpLCBuZXcgUkFNKCkpO1xuICAgICAgdXBkYXRlRGlzcGxheSgpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgb3V0cHV0LnZhbHVlID0gZTtcbiAgICB9XG4gIH1cblxuICBydW4ub25jbGljayA9ICgpID0+IHtcbiAgICBydW4uaW5uZXJUZXh0ID0gaW52ID09IG51bGwgPyBcIlN0b3BcIiA6IFwiUnVuXCI7XG4gICAgc2V0VGlja1VwZGF0ZXIoaW52KTtcbiAgfVxuXG4gIHNoYXJlLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgdXJsID0gd2luZG93LmxvY2F0aW9uO1xuICAgIGNvbnN0IGJhc2UgPSB1cmwudG9TdHJpbmcoKS5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gsIFwiXCIpO1xuICAgIGNvbnN0IGxpbmsgPSBiYXNlICsgJz9zaGFyZT0nICsgYnRvYShpbnB1dC52YWx1ZSk7XG5cbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKS50aGVuKCgpID0+IHtcbiAgICAgIGFsZXJ0KFwiQ29waWVkIGxpbmsgdG8gY2xpcGJvYXJkIVwiKTtcbiAgICB9LCAoZXJyKSA9PiB7XG4gICAgICBhbGVydChcIkVycm9yIGNvcHlpbmcgbGluayB0byBjbGlwYm9hcmQ6IFwiICsgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNwZWVkLm9ubW91c2Vtb3ZlID0gKCkgPT4ge1xuICAgIHNwZWVkbGFiZWwuaW5uZXJUZXh0ID0gc3BlZWQudmFsdWU7XG4gICAgaWYgKGludiAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGludik7XG4gICAgICBzZXRUaWNrVXBkYXRlcihpbnYpO1xuICAgICAgc2V0VGlja1VwZGF0ZXIoaW52KTtcbiAgICB9XG4gIH1cblxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleSA9PSAnVGFiJykge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB2YXIgc3RhcnQgPSB0aGlzLnNlbGVjdGlvblN0YXJ0O1xuICAgICAgdmFyIGVuZCA9IHRoaXMuc2VsZWN0aW9uRW5kO1xuXG4gICAgICAvLyBzZXQgdGV4dGFyZWEgdmFsdWUgdG86IHRleHQgYmVmb3JlIGNhcmV0ICsgdGFiICsgdGV4dCBhZnRlciBjYXJldFxuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIFwiXFx0XCIgKyB0aGlzLnZhbHVlLnN1YnN0cmluZyhlbmQpO1xuXG4gICAgICAvLyBwdXQgY2FyZXQgYXQgcmlnaHQgcG9zaXRpb24gYWdhaW5cbiAgICAgIHRoaXMuc2VsZWN0aW9uU3RhcnQgPSB0aGlzLnNlbGVjdGlvbkVuZCA9IHN0YXJ0ICsgMTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IHVwZGF0ZURpc3BsYXkgPSAoKSA9PiB7XG4gICAgcmFtLnZhbHVlID0gY3B1Py5yYW0/LmR1bXAoKTtcbiAgICByZWdBLnZhbHVlID0gYDB4JHtjcHU/LkEudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJyl9XFx0MGIke2NwdT8uQS50b1N0cmluZygyKS5wYWRTdGFydCg4LCAnMCcpfVxcdCR7Y3B1Py5BfWA7XG4gICAgcmVnQi52YWx1ZSA9IGAweCR7Y3B1Py5CLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpfVxcdDBiJHtjcHU/LkIudG9TdHJpbmcoMikucGFkU3RhcnQoOCwgJzAnKX1cXHQke2NwdT8uQn1gO1xuICAgIHJlZ1BDLnZhbHVlID0gYDB4JHtjcHU/LlBDLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpfVxcdDBiJHtjcHU/LlBDLnRvU3RyaW5nKDIpLnBhZFN0YXJ0KDgsICcwJyl9XFx0JHtjcHU/LlBDfWA7XG5cbiAgICBvdXRwdXQudmFsdWUgPSByZXN1bHQubGF5b3V0LnNwbGl0KCdcXG4nKS5tYXAoKHgpID0+IHBhcnNlSW50KHgpID09IGNwdS5QQyA/IGA+JHt4fWAgOiAnICcgKyB4KS5qb2luKCdcXG4nKS5yZXBsYWNlKC9cXG4kL2csICdcXG5cXG4nKTtcbiAgfVxuXG4gIGNvbXBpbGUub25jbGljayhudWxsKTtcbiAgc3BlZWQub25tb3VzZW1vdmUobnVsbCk7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=