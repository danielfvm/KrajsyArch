import { ROM, RAM, CPU, assemble, AssembleResult } from './krajsy'


window.onload = () => {
  const input = document.getElementById("input") as HTMLTextAreaElement;
  const output = document.getElementById("output") as HTMLTextAreaElement;
  const ram = document.getElementById("ram") as HTMLTextAreaElement;
  const regA = document.getElementById("regA") as HTMLTextAreaElement;
  const regB = document.getElementById("regB") as HTMLTextAreaElement;
  const regPC = document.getElementById("regPC") as HTMLTextAreaElement;

  const reset = document.getElementById("reset");
  const step = document.getElementById("step");
  const compile = document.getElementById("compile");
  const run = document.getElementById("run");
  const share = document.getElementById("share");

  let result: AssembleResult = null;
  let cpu: CPU = null;
  let inv = null;

  if (window.location.search.length > 0) {
    try {
      input.value = atob(window.location.search.replace("?share=", ""));
    } catch(e) {}
  }

  reset.onclick = () => {
    cpu?.reset();
    updateDisplay();
  }

  step.onclick = () => {
    if (result.layout.split('\n').filter((x) => parseInt(x) == cpu.PC).length == 0) {
      if (inv != null)
        run.onclick(null);
      alert("PC hit end of ROM");
    }

    cpu?.step();
    updateDisplay();
  }

  compile.onclick = () => {
    try {
      result = assemble(input.value);
      output.innerHTML = result.layout;
      cpu = new CPU(new ROM(result.bytes), new RAM());
      updateDisplay();
    } catch(e) {
      output.value = e;
    }
  }

  run.onclick = () => {
    run.innerText = inv == null ? "Stop" : "Run";
    if (inv == null) {
      inv = setInterval(() => {
        step.onclick(null);
      }, 100);
    } else {
      clearInterval(inv);
      inv = null;
    }
  }

  share.onclick = () => {
    const url = window.location;
    const base = url.toString().replace(window.location.search, "");
    const link = base + '?share=' + btoa(input.value);

    navigator.clipboard.writeText(link).then(() => {
      alert("Copied link to clipboard!");
    }, (err) => {
      alert("Error copying link to clipboard: " + err);
    });
  }

  input.addEventListener('keydown', function(e) {
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
    ram.value = cpu?.ram?.dump();
    regA.value = `0x${cpu?.A.toString(16).padStart(2, '0')}\t0b${cpu?.A.toString(2).padStart(8, '0')}\t${cpu?.A}`;
    regB.value = `0x${cpu?.B.toString(16).padStart(2, '0')}\t0b${cpu?.B.toString(2).padStart(8, '0')}\t${cpu?.B}`;
    regPC.value = `0x${cpu?.PC.toString(16).padStart(2, '0')}\t0b${cpu?.PC.toString(2).padStart(8, '0')}\t${cpu?.PC}`;

    output.value = result.layout.split('\n').map((x) => parseInt(x) == cpu.PC ? `>${x}` : ' ' + x).join('\n').replace(/\n$/g, '\n\n');
  }

  compile.onclick(null);
}
