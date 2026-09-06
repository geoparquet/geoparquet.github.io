// GeoParquet Validator UI. All parsing runs in the worker; this file only drives the page.
const worker = new Worker("worker.js");
const $ = (id) => document.getElementById(id);
const EXAMPLE = "https://raw.githubusercontent.com/opengeospatial/geoparquet/main/examples/example.parquet";
const CLASSES = [
  ["core", "Core", "Every GeoParquet 2.0 file"],
  ["covering", "Bounding Box Covering", "Files that declare a bbox covering"],
  ["distribution", "Cloud-Optimized Distribution", "Optional profile for direct cloud access"],
];
let running = false;

function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function fmtMsg(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
function setStatus(html, cls) { $("status").innerHTML = html; $("status").className = "status" + (cls ? " " + cls : ""); }

function render(report, label) {
  const r = $("result");
  const counts = Object.fromEntries(CLASSES.map(([k]) => [k, { pass: 0, fail: 0, skip: 0 }]));
  for (const o of report.outcomes) counts[o.id.split("/")[2]][o.status]++;
  const verdict = (n) => n.fail ? ["fail", "Not conformant"] : n.pass ? ["pass", "Conformant"] : ["skip", "Not claimed"];
  let html = `<div class="report">`;
  html += `<div class="report-head"><p class="name">${label ? `<span>${esc(label)} · </span>` : ""}${esc(report.file)}</p>`;
  const meta = [];
  if (report.traffic) meta.push(`${(report.traffic[0] / 1e6).toFixed(1)} MB read in ${report.traffic[1]} range request${report.traffic[1] === 1 ? "" : "s"}`);
  if (report.sampled) meta.push("first row groups only: data tests are a sample, not a conformance pass");
  if (meta.length) html += `<p class="meta">${esc(meta.join(" · "))}</p>`;
  html += `</div><div class="summary">`;
  for (const [k, title, sub] of CLASSES) {
    const n = counts[k], [vc, vt] = verdict(n);
    html += `<div class="tile"><div class="cls">${title}</div><span class="verdict ${vc}">${vt}</span><div class="counts"><b>${n.pass}</b> pass · <b>${n.fail}</b> fail · <b>${n.skip}</b> skipped</div><div class="meta" style="font-size:.82rem">${sub}</div></div>`;
  }
  html += `</div><div class="detail">`;
  for (const [k, title] of CLASSES) {
    const rows = report.outcomes.filter((o) => o.id.split("/")[2] === k);
    html += `<h3>${title} <small>/conf/${k}</small></h3><div class="tablewrap"><table class="tests"><tbody>`;
    for (const o of rows) {
      html += `<tr class="${o.status}"><td class="state"><span class="pill ${o.status}">${o.status}</span></td><td class="id">${esc(o.id.split("/").slice(3).join("/"))}</td><td class="msg">${fmtMsg(o.message) || "<span style='opacity:.5'>—</span>"}</td></tr>`;
    }
    html += `</tbody></table></div>`;
  }
  html += `</div><details class="json"><summary>Report as JSON</summary><pre>${esc(JSON.stringify(report, null, 2))}</pre></details></div>`;
  r.innerHTML = html;
}

function start(msg, label, tag) {
  if (running) return;
  running = true;
  $("result").innerHTML = "";
  setStatus(`<span class="spinner" aria-hidden="true"></span> Checking ${esc(label)}…`);
  const t0 = performance.now();
  worker.onmessage = (e) => {
    running = false;
    if (e.data.error) { setStatus(`Could not check ${esc(label)}: ${esc(e.data.error)}`, "error"); return; }
    const s = ((performance.now() - t0) / 1000).toFixed(1);
    setStatus(`Checked in ${s} s`);
    render(JSON.parse(e.data.report), tag);
  };
  worker.postMessage(msg, msg.buffer ? [msg.buffer] : []);
}

const drop = $("drop"), fileInput = $("file");
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer.files[0]) checkFile(e.dataTransfer.files[0]); });
fileInput.addEventListener("change", () => { if (fileInput.files[0]) checkFile(fileInput.files[0]); });
async function checkFile(f) { const buffer = await f.arrayBuffer(); start({ type: "file", name: f.name, buffer }, f.name); }

function checkUrl(url, tag) {
  url = (url || "").trim();
  if (!url) { $("url").focus(); return; }
  $("url").value = url;
  start({ type: "url", url, maxRows: Number($("maxrows").value) || 0 }, url, tag);
}
$("go").addEventListener("click", () => checkUrl($("url").value));
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") checkUrl($("url").value); });
document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => checkUrl(b.dataset.url)));
worker.onerror = (e) => { running = false; setStatus(`The checker could not start: ${esc(e.message)}`, "error"); };

// Open with a real report so the page shows what it does: the 2.0 example file from the spec repository.
checkUrl(EXAMPLE, "Example");
