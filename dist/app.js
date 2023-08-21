"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const krajsy_1 = require("./krajsy");
var rom = new krajsy_1.ROM([104, 2, 232, 5, 137, 98, 1, 125, 4]);
var ram = new krajsy_1.RAM();
var cpu = new krajsy_1.CPU(rom, ram);
cpu.step();
cpu.step();
cpu.step();
cpu.step();
cpu.step();
cpu.dump();
console.log((0, krajsy_1.assemble)(`
LD A, #2F ; test
label:
ADD A, #01
test:
JZ A, test
`));
//# sourceMappingURL=app.js.map