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

  vhdl(): string {
    const data = this.data.map((x, i) => 'x"' + x.toString(16).padStart(2, '0') + '"' + (((i + 1) % 16) ? ',' : ',\n')).join('')
    return data.substring(0, data.length - 2); // remove last comma
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
  IO = 3,
  SLP = 4,
}

export enum Instructions {
  NOP = 0b00000, // No Operation
  ADD = 0b00001,
  SUB = 0b00010,
  OR  = 0b00011,
  AND = 0b00100,
  XOR = 0b00101,
  GET = 0b00110,
  SET = 0b00111,
  LD  = 0b01000,
  SWP = 0b01001,
  INC = 0b01010,
  DEC = 0b01011,
  SL  = 0b01100, // Shift Left
  SR  = 0b01101, // Shift Right
  INV = 0b01110,
  OUT = 0b01111, // IO Output
  IN  = 0b10000, // IO Input
  SRL = 0b10001, // Shift Rotate Left
  SRR = 0b10010, // Shift Rotate Right
  SLP = 0b10011, // Sleep
  // ...
  JZ  = 0b11100,  // Jump Zero
  JNZ = 0b11101, // Jump Not-Zero
  JG  = 0b11110, // Jump Greater
  JMP = 0b11111, // Unconditional Jump
}

export class CPU {
  public rom: ROM;
  public ram: RAM;

  public A: number;
  public B: number;
  public PC: number;
  public IO: number;
  public SLP: number;

  constructor(rom: ROM, ram: RAM) {
    this.reset();
    this.rom = rom;
    this.ram = ram;
  }

  step(): void {
    if (this.SLP > 0) { 
      this.SLP--;
      return;
    }

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

    // This contains the next state of either A or B (depending on opcode)
    let temp = X;

    switch (ins) {
      case Instructions.INV: temp = ~X; break;
      case Instructions.ADD: temp = X + Y; break;
      case Instructions.SUB: temp = X - Y; break;
      case Instructions.OR:  temp = X | Y; break;
      case Instructions.AND: temp = X & Y; break;
      case Instructions.XOR: temp = X ^ Y; break;
      case Instructions.GET: temp = this.ram.get(Y); break;
      case Instructions.SET: this.ram.set(Y, X); break;
      case Instructions.LD:  temp = Y; break;
      case Instructions.INC: temp = X+1; break;
      case Instructions.DEC: temp = X-1; break;
      case Instructions.SL:  temp = X << 1; break;
      case Instructions.SR:  temp = X >> 1; break;
      case Instructions.JMP: this.PC = Y - 1; break;
      case Instructions.OUT: this.IO = X; break;
      case Instructions.IN:  temp = this.IO; break; // TODO: Currently there is no way of actual input on the website
      case Instructions.SRL: temp = ((X << 1) & 0xFF) | ((X & 0x80) >> 7); break;
      case Instructions.SRR: temp = (X >> 1) | ((X & 0x1) << 7); break;
      case Instructions.SLP: this.SLP = Y; break;
      case Instructions.SWP: [this.A, this.B] = [this.B, this.A]; break;
      case Instructions.JZ:  if (X == 0) this.PC = Y - 1; break;
      case Instructions.JNZ: if (X != 0) this.PC = Y - 1; break;
      case Instructions.JG:  if (X & 0x80) this.PC = Y - 1; break;
    }

    // Update registers, make sure they are not overflowing
    this.PC = (this.PC + 1) & 0xFF;
    this.A = (op0 ? this.A : temp) & 0xFF;
    this.B = (op0 ? temp : this.B) & 0xFF;
  }

  reset(): void {
    this.ram?.reset();
    this.A = this.B = this.PC = this.IO = this.SLP = 0;
  }

  dump(): void {
    console.log(`A: ${this.A.toString(16)}`);
    console.log(`B: ${this.B.toString(16)}`);
    console.log(`IO: ${this.IO.toString(16)}`);
    console.log(`PC: ${this.PC.toString(16)}`);
    console.log(`SLP: ${this.SLP.toString(16)}`);
    console.log(`RAM:\n${this.ram.dump()}`);
    console.log(`ROM:\n${this.rom.dump()}`);
  }
}

type LabelMap = {[id: string]: number|string;};

export interface AssembleResult {
  bytes: number[],
  layout: string,
  labels: LabelMap,
}

const _assemble = (code: string, labels: LabelMap = {}, preCompile = true): AssembleResult => {
  const lines: string[] = code.split('\n').filter((x) => x.trim().length != 0 && !x.startsWith(';'));

  const bytes: number[] = [];
  let layout = "";


  const fetchOperant = (token: string): [number, number] => {
    if (token == undefined) 
      return [ 0, -1 ];

    for (const [key, value] of Object.entries(labels).sort().reverse())
      if (typeof(value) === "string" && token.includes(key))
        return fetchOperant(token.replace(key, value));

    if (token.includes('#') && token.includes('*'))
      throw "Instruction cannot have both # and *"

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
        // in this stage we will ignore potential errors and will assume it must be a label
        if (preCompile)
          return [ 0b11, 0 ];

        if (typeof(labels[token]) === "number")
          return [ 0b11, labels[token] as number ];

        if (!isNaN(token as any)) 
          throw "Invalid operant value! Are you missing # or * ?"

        throw "Invalid operant value!";
    }
  }

  lines.forEach((line: string) => {
    const tokens = line.split(';')[0].trim().split(' ');
    const opcode = tokens.shift().toUpperCase();
    const operants = tokens.join('').toUpperCase().split(',').filter(x => x.trim().length > 0).map(x => x.trim());

    if (opcode.endsWith(':')) {
      labels[opcode.substring(0, opcode.length-1)] = bytes.length;
      return;
    }

    if (operants.length >= 1 && operants[0].startsWith('=')) {
      labels[opcode] = operants.join('').substring(1);
      return;
    }

    const ins: number = Instructions[opcode];
    if (ins == undefined)
      throw "Opcode does not exist!";

    let x = operants.length > 0 && fetchOperant(operants[0]);
    let y = operants.length > 1 && fetchOperant(operants[1]);

    // Special case where first operant is not A or B
    if (opcode == Instructions[Instructions.JMP] || opcode == Instructions[Instructions.SLP]) {
      y = x;
      x = [ 0, -1 ];
    } else if (x[0] > 0b01)
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
}

export const assemble = (code: string): AssembleResult => {
  const { labels } = _assemble(code); // pre compile to get all labels
  return _assemble(code, labels, false);
}
