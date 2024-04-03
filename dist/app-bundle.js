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
    vhdl() {
        const data = this.data.map((x, i) => 'x"' + x.toString(16).padStart(2, '0') + '"' + (((i + 1) % 16) ? ',' : ',\n')).join('');
        return data.substring(0, data.length - 2); // remove last comma
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
    Registers[Registers["IO"] = 3] = "IO";
    Registers[Registers["SLP"] = 4] = "SLP";
})(Registers || (exports.Registers = Registers = {}));
var Instructions;
(function (Instructions) {
    Instructions[Instructions["NOP"] = 0] = "NOP";
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
    Instructions[Instructions["INV"] = 14] = "INV";
    Instructions[Instructions["OUT"] = 15] = "OUT";
    Instructions[Instructions["IN"] = 16] = "IN";
    Instructions[Instructions["SRL"] = 17] = "SRL";
    Instructions[Instructions["SRR"] = 18] = "SRR";
    Instructions[Instructions["SLP"] = 19] = "SLP";
    // ...
    Instructions[Instructions["JZ"] = 28] = "JZ";
    Instructions[Instructions["JNZ"] = 29] = "JNZ";
    Instructions[Instructions["JG"] = 30] = "JG";
    Instructions[Instructions["JMP"] = 31] = "JMP";
})(Instructions || (exports.Instructions = Instructions = {}));
class CPU {
    constructor(rom, ram) {
        this.reset();
        this.rom = rom;
        this.ram = ram;
    }
    step() {
        if (this.SLP > 0) {
            this.SLP--;
            return;
        }
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
        // This contains the next state of either A or B (depending on opcode)
        let temp = X;
        switch (ins) {
            case Instructions.INV:
                temp = ~X;
                break;
            case Instructions.ADD:
                temp = X + Y;
                break;
            case Instructions.SUB:
                temp = X - Y;
                break;
            case Instructions.OR:
                temp = X | Y;
                break;
            case Instructions.AND:
                temp = X & Y;
                break;
            case Instructions.XOR:
                temp = X ^ Y;
                break;
            case Instructions.GET:
                temp = this.ram.get(Y);
                break;
            case Instructions.SET:
                this.ram.set(Y, X);
                break;
            case Instructions.LD:
                temp = Y;
                break;
            case Instructions.INC:
                temp = X + 1;
                break;
            case Instructions.DEC:
                temp = X - 1;
                break;
            case Instructions.SL:
                temp = X << 1;
                break;
            case Instructions.SR:
                temp = X >> 1;
                break;
            case Instructions.JMP:
                this.PC = Y - 1;
                break;
            case Instructions.OUT:
                this.IO = X;
                break;
            case Instructions.IN:
                temp = this.IO;
                break; // TODO: Currently there is no way of actual input on the website
            case Instructions.SRL:
                temp = ((X << 1) & 0xFF) | ((X & 0x80) >> 7);
                break;
            case Instructions.SRR:
                temp = (X >> 1) | ((X & 0x1) << 7);
                break;
            case Instructions.SLP:
                this.SLP = Y;
                break;
            case Instructions.SWP:
                [this.A, this.B] = [this.B, this.A];
                break;
            case Instructions.JZ:
                if (X == 0)
                    this.PC = Y - 1;
                break;
            case Instructions.JNZ:
                if (X != 0)
                    this.PC = Y - 1;
                break;
            case Instructions.JG:
                if (X & 0x80)
                    this.PC = Y - 1;
                break;
        }
        // Update registers, make sure they are not overflowing
        this.PC = (this.PC + 1) & 0xFF;
        this.A = (op0 ? this.A : temp) & 0xFF;
        this.B = (op0 ? temp : this.B) & 0xFF;
    }
    reset() {
        var _a;
        (_a = this.ram) === null || _a === void 0 ? void 0 : _a.reset();
        this.A = this.B = this.PC = this.IO = this.SLP = 0;
    }
    dump() {
        console.log(`A: ${this.A.toString(16)}`);
        console.log(`B: ${this.B.toString(16)}`);
        console.log(`IO: ${this.IO.toString(16)}`);
        console.log(`PC: ${this.PC.toString(16)}`);
        console.log(`SLP: ${this.SLP.toString(16)}`);
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
        for (const [key, value] of Object.entries(labels).sort().reverse())
            if (typeof (value) === "string" && token.includes(key))
                return fetchOperant(token.replace(key, value));
        if (token.includes('#') && token.includes('*'))
            throw "Instruction cannot have both # and *";
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
                if (preCompile)
                    return [0b11, 0];
                if (typeof (labels[token]) === "number")
                    return [0b11, labels[token]];
                if (!isNaN(token))
                    throw "Invalid operant value! Are you missing # or * ?";
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
        let x = operants.length > 0 && fetchOperant(operants[0]);
        let y = operants.length > 1 && fetchOperant(operants[1]);
        // Special case where first operant is not A or B
        if (opcode == Instructions[Instructions.JMP] || opcode == Instructions[Instructions.SLP]) {
            y = x;
            x = [0, -1];
        }
        else if (x[0] > 0b01)
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
    const regIO = document.getElementById("regIO");
    const regSLP = document.getElementById("regSLP");
    const rom = document.getElementById("rom");
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
    rom.onclick = () => {
        var _a;
        navigator.clipboard.writeText((_a = cpu === null || cpu === void 0 ? void 0 : cpu.rom) === null || _a === void 0 ? void 0 : _a.vhdl()).then(() => {
            alert("Copied VHDL ROM to clipboard!");
        }, (err) => {
            alert("Error copying ROM to clipboard: " + err);
        });
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
        regIO.value = `0x${cpu === null || cpu === void 0 ? void 0 : cpu.IO.toString(16).padStart(2, '0')}\t0b${cpu === null || cpu === void 0 ? void 0 : cpu.IO.toString(2).padStart(8, '0')}\t${cpu === null || cpu === void 0 ? void 0 : cpu.IO}`;
        regSLP.value = `0x${cpu === null || cpu === void 0 ? void 0 : cpu.SLP.toString(16).padStart(2, '0')}\t0b${cpu === null || cpu === void 0 ? void 0 : cpu.SLP.toString(2).padStart(8, '0')}\t${cpu === null || cpu === void 0 ? void 0 : cpu.SLP}`;
        output.value = result.layout.split('\n').map((x) => parseInt(x) == cpu.PC ? `>${x}` : ' ' + x).join('\n').replace(/\n$/g, '\n\n');
    };
    compile.onclick(null);
    speed.onmousemove(null);
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RztnQkFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzNDLEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUMzQyxLQUFLLFlBQVksQ0FBQyxHQUFHO2dCQUFFLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3JELEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDakQsS0FBSyxZQUFZLENBQUMsRUFBRTtnQkFBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDdkMsS0FBSyxZQUFZLENBQUMsR0FBRztnQkFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3pDLEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN6QyxLQUFLLFlBQVksQ0FBQyxFQUFFO2dCQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDNUMsS0FBSyxZQUFZLENBQUMsRUFBRTtnQkFBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzVDLEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDOUMsS0FBSyxZQUFZLENBQUMsR0FBRztnQkFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzFDLEtBQUssWUFBWSxDQUFDLEVBQUU7Z0JBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQUMsTUFBTSxDQUFDLGlFQUFpRTtZQUMvRyxLQUFLLFlBQVksQ0FBQyxHQUFHO2dCQUFFLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUMzRSxLQUFLLFlBQVksQ0FBQyxHQUFHO2dCQUFFLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDakUsS0FBSyxZQUFZLENBQUMsR0FBRztnQkFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzNDLEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbEUsS0FBSyxZQUFZLENBQUMsRUFBRTtnQkFBRyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzFELEtBQUssWUFBWSxDQUFDLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUMxRCxLQUFLLFlBQVksQ0FBQyxFQUFFO2dCQUFHLElBQUksQ0FBQyxHQUFHLElBQUk7b0JBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07U0FDN0Q7UUFFRCx1REFBdUQ7UUFDdkQsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN0QyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDeEMsQ0FBQztJQUVELEtBQUs7O1FBQ0gsVUFBSSxDQUFDLEdBQUcsMENBQUUsS0FBSyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsSUFBSTtRQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxD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QUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ2xILEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsRUFBRSxFQUFFLENBQUM7UUFDbEgsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxHQUFHLEVBQUUsQ0FBQztRQUV0SCxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwSSxDQUFDO0lBRUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9LcmFqc3lBcmNoLy4vc3JjL2tyYWpzeS50cyIsIndlYnBhY2s6Ly9LcmFqc3lBcmNoL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0tyYWpzeUFyY2gvLi9zcmMvYXBwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEVtcHR5ID0gKGxlbmd0aDogbnVtYmVyKSA9PiBBcnJheS5mcm9tKEFycmF5KGxlbmd0aCkua2V5cygpKS5tYXAoKCkgPT4gMCk7XG5cbmV4cG9ydCBjbGFzcyBST00ge1xuICBwcm90ZWN0ZWQgZGF0YTogQXJyYXk8bnVtYmVyPlxuXG4gIGNvbnN0cnVjdG9yKGRhdGE6IEFycmF5PG51bWJlcj4gPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhID0gRW1wdHkoMjU2KTtcbiAgICB0aGlzLm1lbWNweShkYXRhLCAwLCBkYXRhPy5sZW5ndGggPz8gMCk7XG4gIH1cblxuICBtZW1jcHkoc3JjOiBBcnJheTxudW1iZXI+LCBkZXN0OiBudW1iZXIsIHNpemU6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBkZXN0OyBpIDwgZGVzdCArIHNpemU7ICsraSlcbiAgICAgIHRoaXMuZGF0YVtpXSA9IHNyY1tpXVxuICB9XG5cbiAgZ2V0KGlkeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoaWR4IDwgMCB8fCBpZHggPiAyNTUpXG4gICAgICB0aHJvdyBcIlByb2dyYW0gdHJpZWQgdG8gYWNjZXNzIG1lbW9yeSBvdXQgb2YgYm91bmRzIVwiO1xuICAgIHJldHVybiB0aGlzLmRhdGFbaWR4XTtcbiAgfVxuXG4gIGR1bXAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLm1hcCgoeCwgaSkgPT4geC50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKSArICgoKGkgKyAxKSAlIDE2KSA/ICcgJyA6ICdcXG4nKSkuam9pbignJylcbiAgfVxuXG4gIHZoZGwoKTogc3RyaW5nIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhLm1hcCgoeCwgaSkgPT4gJ3hcIicgKyB4LnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpICsgJ1wiJyArICgoKGkgKyAxKSAlIDE2KSA/ICcsJyA6ICcsXFxuJykpLmpvaW4oJycpXG4gICAgcmV0dXJuIGRhdGEuc3Vic3RyaW5nKDAsIGRhdGEubGVuZ3RoIC0gMik7IC8vIHJlbW92ZSBsYXN0IGNvbW1hXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJBTSBleHRlbmRzIFJPTSB7XG4gIHNldChpZHg6IG51bWJlciwgZGF0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKGlkeCA8IDAgfHwgaWR4ID4gMjU1KVxuICAgICAgdGhyb3cgXCJQcm9ncmFtIHRyaWVkIHRvIGFjY2VzcyBtZW1vcnkgb3V0IG9mIGJvdW5kcyFcIjtcbiAgICB0aGlzLmRhdGFbaWR4XSA9IGRhdGE7XG4gIH1cblxuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEgPSBFbXB0eSgyNTYpO1xuICB9XG59XG5cbmV4cG9ydCBlbnVtIFJlZ2lzdGVycyB7XG4gIEEgPSAwLFxuICBCID0gMSxcbiAgUEMgPSAyLFxuICBJTyA9IDMsXG4gIFNMUCA9IDQsXG59XG5cbmV4cG9ydCBlbnVtIEluc3RydWN0aW9ucyB7XG4gIE5PUCA9IDBiMDAwMDAsIC8vIE5vIE9wZXJhdGlvblxuICBBREQgPSAwYjAwMDAxLFxuICBTVUIgPSAwYjAwMDEwLFxuICBPUiAgPSAwYjAwMDExLFxuICBBTkQgPSAwYjAwMTAwLFxuICBYT1IgPSAwYjAwMTAxLFxuICBHRVQgPSAwYjAwMTEwLFxuICBTRVQgPSAwYjAwMTExLFxuICBMRCAgPSAwYjAxMDAwLFxuICBTV1AgPSAwYjAxMDAxLFxuICBJTkMgPSAwYjAxMDEwLFxuICBERUMgPSAwYjAxMDExLFxuICBTTCAgPSAwYjAxMTAwLCAvLyBTaGlmdCBMZWZ0XG4gIFNSICA9IDBiMDExMDEsIC8vIFNoaWZ0IFJpZ2h0XG4gIElOViA9IDBiMDExMTAsXG4gIE9VVCA9IDBiMDExMTEsIC8vIElPIE91dHB1dFxuICBJTiAgPSAwYjEwMDAwLCAvLyBJTyBJbnB1dFxuICBTUkwgPSAwYjEwMDAxLCAvLyBTaGlmdCBSb3RhdGUgTGVmdFxuICBTUlIgPSAwYjEwMDEwLCAvLyBTaGlmdCBSb3RhdGUgUmlnaHRcbiAgU0xQID0gMGIxMDAxMSwgLy8gU2xlZXBcbiAgLy8gLi4uXG4gIEpaICA9IDBiMTExMDAsICAvLyBKdW1wIFplcm9cbiAgSk5aID0gMGIxMTEwMSwgLy8gSnVtcCBOb3QtWmVyb1xuICBKRyAgPSAwYjExMTEwLCAvLyBKdW1wIEdyZWF0ZXJcbiAgSk1QID0gMGIxMTExMSwgLy8gVW5jb25kaXRpb25hbCBKdW1wXG59XG5cbmV4cG9ydCBjbGFzcyBDUFUge1xuICBwdWJsaWMgcm9tOiBST007XG4gIHB1YmxpYyByYW06IFJBTTtcblxuICBwdWJsaWMgQTogbnVtYmVyO1xuICBwdWJsaWMgQjogbnVtYmVyO1xuICBwdWJsaWMgUEM6IG51bWJlcjtcbiAgcHVibGljIElPOiBudW1iZXI7XG4gIHB1YmxpYyBTTFA6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcihyb206IFJPTSwgcmFtOiBSQU0pIHtcbiAgICB0aGlzLnJlc2V0KCk7XG4gICAgdGhpcy5yb20gPSByb207XG4gICAgdGhpcy5yYW0gPSByYW07XG4gIH1cblxuICBzdGVwKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLlNMUCA+IDApIHsgXG4gICAgICB0aGlzLlNMUC0tO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlYWQgaW5zdHJ1Y3Rpb24gY29kZSBmcm9tIHJvbVxuICAgIGNvbnN0IG9wY29kZSA9IHRoaXMucm9tLmdldCh0aGlzLlBDKTtcblxuICAgIGNvbnN0IG9wMCA9IChvcGNvZGUgPj4gNykgJiAwYjE7ICAvLyBTZWxlY3Rpb24gYmV0d2VlbiBBL0IgcmVnaXN0ZXIgYXMgWFxuICAgIGNvbnN0IG9wMSA9IChvcGNvZGUgPj4gNSkgJiAwYjExOyAvLyBTZWxlY3Rpb24gYmV0d2VlbiBBL0IvUkFNL1JPTSBhcyBZXG4gICAgY29uc3QgaW5zID0gb3Bjb2RlICYgMGIxMTExMTsgICAgIC8vIEluc3RydWN0aW9uIHRvIGV4ZWN1dGUgYmV0d2VlbiBYIGFuZCBZXG5cbiAgICBjb25zdCBYID0gb3AwID8gdGhpcy5CIDogdGhpcy5BO1xuXG4gICAgY29uc3QgWSA9IG9wMSA9PSAwYjAwID8gdGhpcy5BIDpcbiAgICAgICAgICAgICAgb3AxID09IDBiMDEgPyB0aGlzLkIgOlxuICAgICAgICAgICAgICBvcDEgPT0gMGIxMCA/IHRoaXMucmFtLmdldCh0aGlzLnJvbS5nZXQoKyt0aGlzLlBDKSkgOlxuICAgICAgICAgICAgICBvcDEgPT0gMGIxMSA/IHRoaXMucm9tLmdldCgrK3RoaXMuUEMpIDogMDtcblxuICAgIC8vIFRoaXMgY29udGFpbnMgdGhlIG5leHQgc3RhdGUgb2YgZWl0aGVyIEEgb3IgQiAoZGVwZW5kaW5nIG9uIG9wY29kZSlcbiAgICBsZXQgdGVtcCA9IFg7XG5cbiAgICBzd2l0Y2ggKGlucykge1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSU5WOiB0ZW1wID0gflg7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuQUREOiB0ZW1wID0gWCArIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU1VCOiB0ZW1wID0gWCAtIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuT1I6ICB0ZW1wID0gWCB8IFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuQU5EOiB0ZW1wID0gWCAmIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuWE9SOiB0ZW1wID0gWCBeIFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuR0VUOiB0ZW1wID0gdGhpcy5yYW0uZ2V0KFkpOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLlNFVDogdGhpcy5yYW0uc2V0KFksIFgpOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkxEOiAgdGVtcCA9IFk7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSU5DOiB0ZW1wID0gWCsxOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkRFQzogdGVtcCA9IFgtMTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5TTDogIHRlbXAgPSBYIDw8IDE7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU1I6ICB0ZW1wID0gWCA+PiAxOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkpNUDogdGhpcy5QQyA9IFkgLSAxOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLk9VVDogdGhpcy5JTyA9IFg7IGJyZWFrO1xuICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuSU46ICB0ZW1wID0gdGhpcy5JTzsgYnJlYWs7IC8vIFRPRE86IEN1cnJlbnRseSB0aGVyZSBpcyBubyB3YXkgb2YgYWN0dWFsIGlucHV0IG9uIHRoZSB3ZWJzaXRlXG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5TUkw6IHRlbXAgPSAoKFggPDwgMSkgJiAweEZGKSB8ICgoWCAmIDB4ODApID4+IDcpOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLlNSUjogdGVtcCA9IChYID4+IDEpIHwgKChYICYgMHgxKSA8PCA3KTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5TTFA6IHRoaXMuU0xQID0gWTsgYnJlYWs7XG4gICAgICBjYXNlIEluc3RydWN0aW9ucy5TV1A6IFt0aGlzLkEsIHRoaXMuQl0gPSBbdGhpcy5CLCB0aGlzLkFdOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkpaOiAgaWYgKFggPT0gMCkgdGhpcy5QQyA9IFkgLSAxOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkpOWjogaWYgKFggIT0gMCkgdGhpcy5QQyA9IFkgLSAxOyBicmVhaztcbiAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkpHOiAgaWYgKFggJiAweDgwKSB0aGlzLlBDID0gWSAtIDE7IGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSByZWdpc3RlcnMsIG1ha2Ugc3VyZSB0aGV5IGFyZSBub3Qgb3ZlcmZsb3dpbmdcbiAgICB0aGlzLlBDID0gKHRoaXMuUEMgKyAxKSAmIDB4RkY7XG4gICAgdGhpcy5BID0gKG9wMCA/IHRoaXMuQSA6IHRlbXApICYgMHhGRjtcbiAgICB0aGlzLkIgPSAob3AwID8gdGVtcCA6IHRoaXMuQikgJiAweEZGO1xuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5yYW0/LnJlc2V0KCk7XG4gICAgdGhpcy5BID0gdGhpcy5CID0gdGhpcy5QQyA9IHRoaXMuSU8gPSB0aGlzLlNMUCA9IDA7XG4gIH1cblxuICBkdW1wKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKGBBOiAke3RoaXMuQS50b1N0cmluZygxNil9YCk7XG4gICAgY29uc29sZS5sb2coYEI6ICR7dGhpcy5CLnRvU3RyaW5nKDE2KX1gKTtcbiAgICBjb25zb2xlLmxvZyhgSU86ICR7dGhpcy5JTy50b1N0cmluZygxNil9YCk7XG4gICAgY29uc29sZS5sb2coYFBDOiAke3RoaXMuUEMudG9TdHJpbmcoMTYpfWApO1xuICAgIGNvbnNvbGUubG9nKGBTTFA6ICR7dGhpcy5TTFAudG9TdHJpbmcoMTYpfWApO1xuICAgIGNvbnNvbGUubG9nKGBSQU06XFxuJHt0aGlzLnJhbS5kdW1wKCl9YCk7XG4gICAgY29uc29sZS5sb2coYFJPTTpcXG4ke3RoaXMucm9tLmR1bXAoKX1gKTtcbiAgfVxufVxuXG50eXBlIExhYmVsTWFwID0ge1tpZDogc3RyaW5nXTogbnVtYmVyfHN0cmluZzt9O1xuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2VtYmxlUmVzdWx0IHtcbiAgYnl0ZXM6IG51bWJlcltdLFxuICBsYXlvdXQ6IHN0cmluZyxcbiAgbGFiZWxzOiBMYWJlbE1hcCxcbn1cblxuY29uc3QgX2Fzc2VtYmxlID0gKGNvZGU6IHN0cmluZywgbGFiZWxzOiBMYWJlbE1hcCA9IHt9LCBwcmVDb21waWxlID0gdHJ1ZSk6IEFzc2VtYmxlUmVzdWx0ID0+IHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gY29kZS5zcGxpdCgnXFxuJykuZmlsdGVyKCh4KSA9PiB4LnRyaW0oKS5sZW5ndGggIT0gMCAmJiAheC5zdGFydHNXaXRoKCc7JykpO1xuXG4gIGNvbnN0IGJ5dGVzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgbGF5b3V0ID0gXCJcIjtcblxuXG4gIGNvbnN0IGZldGNoT3BlcmFudCA9ICh0b2tlbjogc3RyaW5nKTogW251bWJlciwgbnVtYmVyXSA9PiB7XG4gICAgaWYgKHRva2VuID09IHVuZGVmaW5lZCkgXG4gICAgICByZXR1cm4gWyAwLCAtMSBdO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMobGFiZWxzKS5zb3J0KCkucmV2ZXJzZSgpKVxuICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT09IFwic3RyaW5nXCIgJiYgdG9rZW4uaW5jbHVkZXMoa2V5KSlcbiAgICAgICAgcmV0dXJuIGZldGNoT3BlcmFudCh0b2tlbi5yZXBsYWNlKGtleSwgdmFsdWUpKTtcblxuICAgIGlmICh0b2tlbi5pbmNsdWRlcygnIycpICYmIHRva2VuLmluY2x1ZGVzKCcqJykpXG4gICAgICB0aHJvdyBcIkluc3RydWN0aW9uIGNhbm5vdCBoYXZlIGJvdGggIyBhbmQgKlwiXG5cbiAgICBzd2l0Y2godG9rZW5bMF0pIHtcbiAgICAgIGNhc2UgJ0EnOlxuICAgICAgICByZXR1cm4gWyAwYjAwLCAtMSBdXG4gICAgICBjYXNlICdCJzpcbiAgICAgICAgcmV0dXJuIFsgMGIwMSwgLTEgXVxuICAgICAgY2FzZSAnKic6XG4gICAgICAgIHJldHVybiBbIDBiMTAsIHBhcnNlSW50KHRva2VuLnN1YnN0cmluZygxKSwgMTYpIF1cbiAgICAgIGNhc2UgJyMnOlxuICAgICAgICByZXR1cm4gWyAwYjExLCBwYXJzZUludCh0b2tlbi5zdWJzdHJpbmcoMSksIDE2KSBdXG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBpbiB0aGlzIHN0YWdlIHdlIHdpbGwgaWdub3JlIHBvdGVudGlhbCBlcnJvcnMgYW5kIHdpbGwgYXNzdW1lIGl0IG11c3QgYmUgYSBsYWJlbFxuICAgICAgICBpZiAocHJlQ29tcGlsZSlcbiAgICAgICAgICByZXR1cm4gWyAwYjExLCAwIF07XG5cbiAgICAgICAgaWYgKHR5cGVvZihsYWJlbHNbdG9rZW5dKSA9PT0gXCJudW1iZXJcIilcbiAgICAgICAgICByZXR1cm4gWyAwYjExLCBsYWJlbHNbdG9rZW5dIGFzIG51bWJlciBdO1xuXG4gICAgICAgIGlmICghaXNOYU4odG9rZW4gYXMgYW55KSkgXG4gICAgICAgICAgdGhyb3cgXCJJbnZhbGlkIG9wZXJhbnQgdmFsdWUhIEFyZSB5b3UgbWlzc2luZyAjIG9yICogP1wiXG5cbiAgICAgICAgdGhyb3cgXCJJbnZhbGlkIG9wZXJhbnQgdmFsdWUhXCI7XG4gICAgfVxuICB9XG5cbiAgbGluZXMuZm9yRWFjaCgobGluZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdG9rZW5zID0gbGluZS5zcGxpdCgnOycpWzBdLnRyaW0oKS5zcGxpdCgnICcpO1xuICAgIGNvbnN0IG9wY29kZSA9IHRva2Vucy5zaGlmdCgpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3Qgb3BlcmFudHMgPSB0b2tlbnMuam9pbignJykudG9VcHBlckNhc2UoKS5zcGxpdCgnLCcpLmZpbHRlcih4ID0+IHgudHJpbSgpLmxlbmd0aCA+IDApLm1hcCh4ID0+IHgudHJpbSgpKTtcblxuICAgIGlmIChvcGNvZGUuZW5kc1dpdGgoJzonKSkge1xuICAgICAgbGFiZWxzW29wY29kZS5zdWJzdHJpbmcoMCwgb3Bjb2RlLmxlbmd0aC0xKV0gPSBieXRlcy5sZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9wZXJhbnRzLmxlbmd0aCA+PSAxICYmIG9wZXJhbnRzWzBdLnN0YXJ0c1dpdGgoJz0nKSkge1xuICAgICAgbGFiZWxzW29wY29kZV0gPSBvcGVyYW50cy5qb2luKCcnKS5zdWJzdHJpbmcoMSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW5zOiBudW1iZXIgPSBJbnN0cnVjdGlvbnNbb3Bjb2RlXTtcbiAgICBpZiAoaW5zID09IHVuZGVmaW5lZClcbiAgICAgIHRocm93IFwiT3Bjb2RlIGRvZXMgbm90IGV4aXN0IVwiO1xuXG4gICAgbGV0IHggPSBvcGVyYW50cy5sZW5ndGggPiAwICYmIGZldGNoT3BlcmFudChvcGVyYW50c1swXSk7XG4gICAgbGV0IHkgPSBvcGVyYW50cy5sZW5ndGggPiAxICYmIGZldGNoT3BlcmFudChvcGVyYW50c1sxXSk7XG5cbiAgICAvLyBTcGVjaWFsIGNhc2Ugd2hlcmUgZmlyc3Qgb3BlcmFudCBpcyBub3QgQSBvciBCXG4gICAgaWYgKG9wY29kZSA9PSBJbnN0cnVjdGlvbnNbSW5zdHJ1Y3Rpb25zLkpNUF0gfHwgb3Bjb2RlID09IEluc3RydWN0aW9uc1tJbnN0cnVjdGlvbnMuU0xQXSkge1xuICAgICAgeSA9IHg7XG4gICAgICB4ID0gWyAwLCAtMSBdO1xuICAgIH0gZWxzZSBpZiAoeFswXSA+IDBiMDEpXG4gICAgICB0aHJvdyBcIkZpcnN0IG9wZXJhbnQgY2FuIG9ubHkgYmUgQSBvciBCIVwiO1xuXG4gICAgY29uc3QgY29kZSA9ICh4WzBdIDw8IDcpIHwgKHlbMF0gPDwgNSkgfCBpbnM7XG4gICAgbGV0IHJvdyA9IGNvZGUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykgKyAnICc7XG4gICAgbGV0IGFkZHIgPSBieXRlcy5sZW5ndGg7XG5cbiAgICBieXRlcy5wdXNoKGNvZGUpO1xuXG4gICAgaWYgKHlbMV0gPj0gMCkge1xuICAgICAgYnl0ZXMucHVzaCh5WzFdKTtcbiAgICAgIHJvdyArPSB5WzFdLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpICsgJyAnO1xuICAgIH1cblxuICAgIGxheW91dCArPSAoYWRkci50b1N0cmluZygpICsgJzonKS5wYWRTdGFydCg0LCAnMCcpLnBhZEVuZCg4LCAnICcpICsgcm93LnBhZEVuZCgxMCwgJyAnKSArIGA7ICR7bGluZX1cXG5gO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGJ5dGVzOiBieXRlcyxcbiAgICBsYXlvdXQ6IGxheW91dCxcbiAgICBsYWJlbHM6IGxhYmVscyxcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGFzc2VtYmxlID0gKGNvZGU6IHN0cmluZyk6IEFzc2VtYmxlUmVzdWx0ID0+IHtcbiAgY29uc3QgeyBsYWJlbHMgfSA9IF9hc3NlbWJsZShjb2RlKTsgLy8gcHJlIGNvbXBpbGUgdG8gZ2V0IGFsbCBsYWJlbHNcbiAgcmV0dXJuIF9hc3NlbWJsZShjb2RlLCBsYWJlbHMsIGZhbHNlKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBST00sIFJBTSwgQ1BVLCBhc3NlbWJsZSwgQXNzZW1ibGVSZXN1bHQgfSBmcm9tICcuL2tyYWpzeSdcblxuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5wdXRcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3Qgb3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRwdXRcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3QgcmFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyYW1cIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3QgcmVnQSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVnQVwiKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBjb25zdCByZWdCID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdCXCIpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gIGNvbnN0IHJlZ1BDID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdQQ1wiKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBjb25zdCByZWdJTyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVnSU9cIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3QgcmVnU0xQID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdTTFBcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgY29uc3Qgcm9tID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyb21cIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICBjb25zdCByZXNldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzZXRcIik7XG4gIGNvbnN0IHN0ZXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0ZXBcIik7XG4gIGNvbnN0IGNvbXBpbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbXBpbGVcIik7XG4gIGNvbnN0IHJ1biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicnVuXCIpO1xuICBjb25zdCBzaGFyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hhcmVcIik7XG4gIGNvbnN0IHNwZWVkbGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNwZWVkbGFiZWxcIik7XG4gIGNvbnN0IHNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzcGVlZFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG4gIGxldCByZXN1bHQ6IEFzc2VtYmxlUmVzdWx0ID0gbnVsbDtcbiAgbGV0IGNwdTogQ1BVID0gbnVsbDtcbiAgbGV0IGludiA9IG51bGw7XG5cbiAgaWYgKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gubGVuZ3RoID4gMCkge1xuICAgIHRyeSB7XG4gICAgICBpbnB1dC52YWx1ZSA9IGF0b2Iod2luZG93LmxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKFwiP3NoYXJlPVwiLCBcIlwiKSk7XG4gICAgfSBjYXRjaChlKSB7fVxuICB9XG5cbiAgY29uc3Qgc2V0VGlja1VwZGF0ZXIgPSAodmFsdWUpID0+IHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgaW52ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBzdGVwLm9uY2xpY2sobnVsbCk7XG4gICAgICB9LCBwYXJzZUludChzcGVlZC52YWx1ZSkgKiAxMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodmFsdWUpO1xuICAgICAgaW52ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuXG4gIHJlc2V0Lm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY3B1Py5yZXNldCgpO1xuICAgIHVwZGF0ZURpc3BsYXkoKTtcbiAgfVxuXG4gIHN0ZXAub25jbGljayA9ICgpID0+IHtcbiAgICBsZXQgbGFzdElucyA9IHJlc3VsdC5sYXlvdXQuc3BsaXQoJ1xcbicpLmZpbHRlcih4ID0+IHgudHJpbSgpLmxlbmd0aCA+IDApLnBvcCgpO1xuICAgIGlmIChsYXN0SW5zID09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGludiAhPSBudWxsKVxuICAgICAgICBydW4ub25jbGljayhudWxsKTtcbiAgICAgIGFsZXJ0KFwiTm90aGluZyB0byBleGVjdXRlLCBjb21waWxlIGZpcnN0IVwiKTtcbiAgICB9XG5cbiAgICBpZiAocGFyc2VJbnQobGFzdElucykgPCBjcHUuUEMpIHtcbiAgICAgIGlmIChpbnYgIT0gbnVsbClcbiAgICAgICAgcnVuLm9uY2xpY2sobnVsbCk7XG4gICAgICBhbGVydChcIlBDIGhpdCBlbmQgb2YgUk9NXCIpO1xuICAgIH1cblxuICAgIGNwdT8uc3RlcCgpO1xuICAgIHVwZGF0ZURpc3BsYXkoKTtcbiAgfVxuXG4gIGNvbXBpbGUub25jbGljayA9ICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gYXNzZW1ibGUoaW5wdXQudmFsdWUpO1xuICAgICAgb3V0cHV0LmlubmVySFRNTCA9IHJlc3VsdC5sYXlvdXQ7XG4gICAgICBjcHUgPSBuZXcgQ1BVKG5ldyBST00ocmVzdWx0LmJ5dGVzKSwgbmV3IFJBTSgpKTtcbiAgICAgIHVwZGF0ZURpc3BsYXkoKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIG91dHB1dC52YWx1ZSA9IGU7XG4gICAgfVxuICB9XG5cbiAgcnVuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgcnVuLmlubmVyVGV4dCA9IGludiA9PSBudWxsID8gXCJTdG9wXCIgOiBcIlJ1blwiO1xuICAgIHNldFRpY2tVcGRhdGVyKGludik7XG4gIH1cblxuICByb20ub25jbGljayA9ICgpID0+IHtcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChjcHU/LnJvbT8udmhkbCgpKS50aGVuKCgpID0+IHtcbiAgICAgIGFsZXJ0KFwiQ29waWVkIFZIREwgUk9NIHRvIGNsaXBib2FyZCFcIik7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgYWxlcnQoXCJFcnJvciBjb3B5aW5nIFJPTSB0byBjbGlwYm9hcmQ6IFwiICsgZXJyKTtcbiAgICB9KTtcbiAgfTtcblxuICBzaGFyZS5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICBjb25zdCBiYXNlID0gdXJsLnRvU3RyaW5nKCkucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uc2VhcmNoLCBcIlwiKTtcbiAgICBjb25zdCBsaW5rID0gYmFzZSArICc/c2hhcmU9JyArIGJ0b2EoaW5wdXQudmFsdWUpO1xuXG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluaykudGhlbigoKSA9PiB7XG4gICAgICBhbGVydChcIkNvcGllZCBsaW5rIHRvIGNsaXBib2FyZCFcIik7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgYWxlcnQoXCJFcnJvciBjb3B5aW5nIGxpbmsgdG8gY2xpcGJvYXJkOiBcIiArIGVycik7XG4gICAgfSk7XG4gIH1cblxuICBzcGVlZC5vbm1vdXNlbW92ZSA9ICgpID0+IHtcbiAgICBzcGVlZGxhYmVsLmlubmVyVGV4dCA9IHNwZWVkLnZhbHVlO1xuICAgIGlmIChpbnYgIT0gbnVsbCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnYpO1xuICAgICAgc2V0VGlja1VwZGF0ZXIoaW52KTtcbiAgICAgIHNldFRpY2tVcGRhdGVyKGludik7XG4gICAgfVxuICB9XG5cbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXkgPT0gJ1RhYicpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5zZWxlY3Rpb25TdGFydDtcbiAgICAgIHZhciBlbmQgPSB0aGlzLnNlbGVjdGlvbkVuZDtcblxuICAgICAgLy8gc2V0IHRleHRhcmVhIHZhbHVlIHRvOiB0ZXh0IGJlZm9yZSBjYXJldCArIHRhYiArIHRleHQgYWZ0ZXIgY2FyZXRcbiAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnN1YnN0cmluZygwLCBzdGFydCkgKyBcIlxcdFwiICsgdGhpcy52YWx1ZS5zdWJzdHJpbmcoZW5kKTtcblxuICAgICAgLy8gcHV0IGNhcmV0IGF0IHJpZ2h0IHBvc2l0aW9uIGFnYWluXG4gICAgICB0aGlzLnNlbGVjdGlvblN0YXJ0ID0gdGhpcy5zZWxlY3Rpb25FbmQgPSBzdGFydCArIDE7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCB1cGRhdGVEaXNwbGF5ID0gKCkgPT4ge1xuICAgIHJhbS52YWx1ZSA9IGNwdT8ucmFtPy5kdW1wKCk7XG4gICAgcmVnQS52YWx1ZSA9IGAweCR7Y3B1Py5BLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpfVxcdDBiJHtjcHU/LkEudG9TdHJpbmcoMikucGFkU3RhcnQoOCwgJzAnKX1cXHQke2NwdT8uQX1gO1xuICAgIHJlZ0IudmFsdWUgPSBgMHgke2NwdT8uQi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKX1cXHQwYiR7Y3B1Py5CLnRvU3RyaW5nKDIpLnBhZFN0YXJ0KDgsICcwJyl9XFx0JHtjcHU/LkJ9YDtcbiAgICByZWdQQy52YWx1ZSA9IGAweCR7Y3B1Py5QQy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKX1cXHQwYiR7Y3B1Py5QQy50b1N0cmluZygyKS5wYWRTdGFydCg4LCAnMCcpfVxcdCR7Y3B1Py5QQ31gO1xuICAgIHJlZ0lPLnZhbHVlID0gYDB4JHtjcHU/LklPLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpfVxcdDBiJHtjcHU/LklPLnRvU3RyaW5nKDIpLnBhZFN0YXJ0KDgsICcwJyl9XFx0JHtjcHU/LklPfWA7XG4gICAgcmVnU0xQLnZhbHVlID0gYDB4JHtjcHU/LlNMUC50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKX1cXHQwYiR7Y3B1Py5TTFAudG9TdHJpbmcoMikucGFkU3RhcnQoOCwgJzAnKX1cXHQke2NwdT8uU0xQfWA7XG5cbiAgICBvdXRwdXQudmFsdWUgPSByZXN1bHQubGF5b3V0LnNwbGl0KCdcXG4nKS5tYXAoKHgpID0+IHBhcnNlSW50KHgpID09IGNwdS5QQyA/IGA+JHt4fWAgOiAnICcgKyB4KS5qb2luKCdcXG4nKS5yZXBsYWNlKC9cXG4kL2csICdcXG5cXG4nKTtcbiAgfVxuXG4gIGNvbXBpbGUub25jbGljayhudWxsKTtcbiAgc3BlZWQub25tb3VzZW1vdmUobnVsbCk7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=