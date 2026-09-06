// Main thread: UI only. All parsing runs in the worker (synchronous range requests are allowed there).
const worker = new Worker("worker.js");
const $ = (id) => document.getElementById(id);
const status = $("status"), result = $("result");
let running = false;

function setStatus(text, cls) { status.textContent = text; status.className = cls || ""; }

function render(report) {
  const classes = { core: "Core", covering: "Bounding Box Covering", distribution: "Cloud-Optimized Distribution" };
  let html = `<h2 style="font-size:1.1rem;margin:0">${escapeHtml(report.file)}</h2>`;
  if (report.traffic) html += `<p class="skip">${(report.traffic[0] / 1e6).toFixed(1)} MB in ${report.traffic[1]} range requests${report.sampled ? "; data tests sampled (first row groups only)" : ""}</p>`;
  for (const [key, title] of Object.entries(classes)) {
    const rows = report.outcomes.filter((o) => o.id.split("/")[2] === key);
    const n = { pass: 0, fail: 0, skip: 0 };
    rows.forEach((o) => n[o.status]++);
    const verdict = n.fail ? '<span class="verdict nonconformant">NOT CONFORMANT</span>' : n.pass ? '<span class="verdict conformant">conformant</span>' : '<span class="skip">not claimed</span>';
    html += `<h2 class="class">${title} <span>${n.pass} pass, ${n.fail} fail, ${n.skip} skipped</span> ${verdict}</h2><table><tbody>`;
    for (const o of rows) html += `<tr><td class="${o.status}">${o.status.toUpperCase()}</td><td class="id">${o.id}</td><td>${escapeHtml(o.message)}</td></tr>`;
    html += "</tbody></table>";
  }
  html += `<details><summary>Report as JSON</summary><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre></details>`;
  result.innerHTML = html;
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function start(msg, label) {
  if (running) return;
  running = true; result.innerHTML = ""; setStatus(`Checking ${label}…`);
  const t0 = performance.now();
  worker.onmessage = (e) => {
    running = false;
    if (e.data.error) { setStatus(`Error: ${e.data.error}`, "fail"); return; }
    setStatus(`Done in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
    render(JSON.parse(e.data.report));
  };
  worker.postMessage(msg, msg.buffer ? [msg.buffer] : []);
}

const drop = $("drop"), fileInput = $("file");
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer.files[0]) checkFile(e.dataTransfer.files[0]); });
fileInput.addEventListener("change", () => { if (fileInput.files[0]) checkFile(fileInput.files[0]); });
async function checkFile(f) { const buffer = await f.arrayBuffer(); start({ type: "file", name: f.name, buffer }, f.name); }

$("go").addEventListener("click", () => checkUrl($("url").value.trim()));
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") checkUrl($("url").value.trim()); });
document.querySelectorAll(".examples button").forEach((b) => b.addEventListener("click", () => { $("url").value = b.dataset.url; checkUrl(b.dataset.url); }));
function checkUrl(url) { if (!url) return; start({ type: "url", url, maxRows: Number($("maxrows").value) || 0 }, url); }

worker.onerror = (e) => { running = false; setStatus(`Worker error: ${e.message}`, "fail"); };
