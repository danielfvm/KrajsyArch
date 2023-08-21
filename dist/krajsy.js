"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.PC++;
        this.A = (_a = (op0 ? Y0 : X0)) !== null && _a !== void 0 ? _a : this.A;
        this.B = (_b = (op0 ? X0 : Y0)) !== null && _b !== void 0 ? _b : this.B;
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
const assemble = (code) => {
    const lines = code.toUpperCase().split('\n').filter((x) => x.trim().length != 0 && !x.startsWith(';'));
    const bytes = [];
    const labels = {};
    const fetchOperant = (token) => {
        if (token == undefined)
            return [0, -1];
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
                if (labels[token] != undefined) {
                    return [0b11, labels[token]];
                }
                throw "Invalid operant value!";
        }
    };
    lines.forEach((line) => {
        const tokens = line.split(';')[0].split(' ');
        const opcode = tokens.shift();
        const operants = tokens.join('').split(',');
        if (opcode.endsWith(':')) {
            labels[opcode.substring(0, opcode.length - 1)] = bytes.length;
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
        bytes.push(code);
        if (y[1] >= 0)
            bytes.push(y[1]);
    });
    return bytes;
};
exports.assemble = assemble;
//# sourceMappingURL=krajsy.js.map