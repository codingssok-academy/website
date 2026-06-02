/* eslint-disable no-restricted-globals */
// Pyodide Web Worker — SharedArrayBuffer or pre-collected stdin
importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js");

let pyodide = null;
let inputBuffer = null; // SharedArrayBuffer (optional)
let inputSignal = null; // Int32Array view for Atomics
let stdinQueue = [];     // fallback: pre-collected inputs
let stdinIndex = 0;

self.onmessage = async function (e) {
  const msg = e.data;

  // ── init: receive SharedArrayBuffer and boot Pyodide ──
  if (msg.type === "init") {
    inputBuffer = msg.buffer;
    inputSignal = new Int32Array(inputBuffer, 0, 2);

    try {
      self.postMessage({ type: "loading", stage: "downloading" });

      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
        stdout: function (text) {
          self.postMessage({ type: "stdout", data: text });
        },
        stderr: function (text) {
          self.postMessage({ type: "stderr", data: text });
        },
        stdin: function () {
          // Signal main thread that we need input
          self.postMessage({ type: "input-request" });

          // Block worker until main thread writes input and sets flag
          Atomics.wait(inputSignal, 0, 0);

          // Read the input string from the buffer
          var length = Atomics.load(inputSignal, 1);
          var bytes = new Uint8Array(inputBuffer, 8, length);
          var text = new TextDecoder().decode(bytes.slice());

          // Reset flag for next input call
          Atomics.store(inputSignal, 0, 0);

          return text;
        },
      });

      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: "Pyodide load failed: " + err.message });
    }
    return;
  }

  // ── init-simple: no SharedArrayBuffer, pre-collected stdin ──
  if (msg.type === "init-simple") {
    stdinQueue = msg.inputs || [];
    stdinIndex = 0;

    try {
      self.postMessage({ type: "loading", stage: "downloading" });

      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
        stdout: function (text) {
          self.postMessage({ type: "stdout", data: text });
        },
        stderr: function (text) {
          self.postMessage({ type: "stderr", data: text });
        },
        stdin: function () {
          // Return pre-collected input from queue
          if (stdinIndex < stdinQueue.length) {
            var val = stdinQueue[stdinIndex];
            stdinIndex++;
            return val;
          }
          return "";
        },
      });

      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: "Pyodide load failed: " + err.message });
    }
    return;
  }

  // ── run: execute Python code ──
  if (msg.type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "error", message: "Pyodide not initialized" });
      return;
    }
    try {
      await pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: "done", success: true });
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
    return;
  }

  // ── input-response: main thread provides stdin value (SharedArrayBuffer mode) ──
  if (msg.type === "input-response") {
    if (!inputBuffer || !inputSignal) return;

    var encoded = new TextEncoder().encode(msg.value);
    var target = new Uint8Array(inputBuffer, 8);
    target.set(encoded);

    Atomics.store(inputSignal, 1, encoded.length);
    Atomics.store(inputSignal, 0, 1); // set ready flag
    Atomics.notify(inputSignal, 0);   // wake the blocked worker
    return;
  }
};
