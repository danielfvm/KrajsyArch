const Empty = (length: number) => Array.from(Array(length).keys()).map(() => 0);

export class ROM {
  protected data: Array<number>

  constructor(data: Array<number> = null) {
    this.data = Empty(256);
    this.memcpy(data, 0, data?.length ?? 0);
  }

  memcpy(src: Array<number>, dest: number, size: number) {
    for (let i = dest; i < dest + size; ++i)
      this.data[i] = src[i]
  }

  get(idx: number): number {
    if (idx < 0 || idx > 255)
      throw "Program tried to access memory out of bounds!";
    return this.data[idx];
  }

  dump(): string {
    return this.data.map((x, i) => x.toString(16).padStart(2, '0') + (((i + 1) % 16) ? ' ' : '\n')).join('')
  }
}

export class RAM extends ROM {
  set(idx: number, data: number): void {
    if (idx < 0 || idx > 255)
      throw "Program tried to access memory out of bounds!";
    this.data[idx] = data;
  }

  reset(): void {
    this.data = Empty(256);
  }
}

export enum Registers {
  A = 0,
  B = 1,
  PC = 2,
}

export enum Instructions {
  INV = 0b00000,
  ADD = 0b00001,
  SUB = 0b00010,
  OR  = 0b00011,
  AND = 0b00100,
  XOR = 0b00101,
  GET = 0b00110,
  SET = 0b00111,
  LD  = 0b01000,
  SWP = 0b01001,
  // ...
  JZ  = 0b11100,
  JNZ = 0b11101,
  JG  = 0b11110,
  JL  = 0b11111,
}

export class CPU {
  public rom: ROM;
  public ram: RAM;

  public A: number;
  public B: number;
  public PC: number;

  constructor(rom: ROM, ram: RAM) {
    this.rom = rom;
    this.ram = ram;
    this.A = this.B = this.PC = 0;
  }

  step(): void {
    // Read instruction code from rom
    const opcode = this.rom.get(this.PC);

    const op0 = (opcode >> 7) & 0b1;  // Selection between A/B register as X
    const op1 = (opcode >> 5) & 0b11; // Selection between A/B/RAM/ROM as Y
    const ins = opcode & 0b11111;     // Instruction to execute between X and Y

    const X = op0 ? this.B : this.A;

    const Y = op1 == 0b00 ? this.A :
              op1 == 0b01 ? this.B :
              op1 == 0b10 ? this.ram.get(this.rom.get(++this.PC)) :
              op1 == 0b11 ? this.rom.get(++this.PC) : 0;

    let X0 = null;
    let Y0 = null;

    switch (ins) {
      case Instructions.INV: X0 = ~X; break;
      case Instructions.ADD: X0 = X + Y; break;
      case Instructions.SUB: X0 = X - Y; break;
      case Instructions.OR:  X0 = X | Y; break;
      case Instructions.AND: X0 = X & Y; break;
      case Instructions.XOR: X0 = X ^ Y; break;
      case Instructions.GET: X0 = this.ram.get(Y); break;
      case Instructions.SET: this.ram.set(Y, X); break;
      case Instructions.LD:  X0 = Y; break;
      case Instructions.SWP: {
        [this.A, this.B] = [this.B, this.A];
      } break;
      case Instructions.JZ: {
        if (X == 0) this.PC = Y - 1;
      } break;
      case Instructions.JNZ: {
        if (X != 0) this.PC = Y - 1;
      } break;
      case Instructions.JG: {
        if (X > 0) this.PC = Y - 1;
      } break;
      case Instructions.JL: {
        if (X < 0) this.PC = Y - 1;
      } break;
    }

    // Update registers, make sure they are not overflowing
    this.PC = (this.PC + 1) & 0xFF;
    this.A = ((op0 ? Y0 : X0) ?? this.A) & 0xFF;
    this.B = ((op0 ? X0 : Y0) ?? this.B) & 0xFF;
  }

  reset(): void {
    this.ram.reset();
    this.A = this.B = this.PC = 0;
  }

  dump(): void {
    console.log(`A: ${this.A.toString(16)}`);
    console.log(`B: ${this.B.toString(16)}`);
    console.log(`PC: ${this.PC.toString(16)}`);
    console.log(`RAM:\n${this.ram.dump()}`);
    console.log(`ROM:\n${this.rom.dump()}`);
  }
}

export interface AssembleResult {
  bytes: number[],
  layout: string
}

export const assemble = (code: string): AssembleResult => {
  const lines: string[] = code.split('\n').filter((x) => x.trim().length != 0 && !x.startsWith(';'));
  const labels: {[id: string]: number;} = {};

  const bytes: number[] = [];
  let layout = "";


  const fetchOperant = (token: string): [number, number] => {
    if (token == undefined) 
      return [ 0, -1 ];

    switch(token[0]) {
      case 'A':
        return [ 0b00, -1 ]
      case 'B':
        return [ 0b01, -1 ]
      case '*':
        return [ 0b10, parseInt(token.substring(1), 16) ]
      case '#':
        return [ 0b11, parseInt(token.substring(1), 16) ]
      default:
        if (labels[token] != undefined) {
          return [ 0b11, labels[token] ];
        }
        throw "Invalid operant value!";
    }
  }

  lines.forEach((line: string) => {
    const tokens = line.split(';')[0].split(/[ ,]+/);
    const opcode = tokens.shift().toUpperCase();
    const operants = tokens.join('').toUpperCase().split(',').filter(x => x.trim().length > 0);

    if (opcode.endsWith(':')) {
      labels[opcode.substring(0, opcode.length-1)] = bytes.length;
      return;
    }

    const ins: number = Instructions[opcode];
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
  };
}
