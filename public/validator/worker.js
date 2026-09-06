// Worker: loads the WebAssembly checker and provides the two synchronous range-request
// callbacks it expects. Synchronous XMLHttpRequest is permitted in workers, not on the main thread.
importScripts("pkg/geoparquet_conf.js");

function xhr(method, url, range) {
  const r = new XMLHttpRequest();
  r.open(method, url, false);
  if (range) r.setRequestHeader("Range", range);
  r.responseType = "arraybuffer";
  r.send(null);
  if (r.status < 200 || r.status >= 300) throw new Error(`${method} ${url}: HTTP ${r.status}`);
  return r;
}

// Object length: Content-Length of a HEAD, else the total of a one-byte ranged GET.
self.gpqHeadLength = function (url) {
  try {
    const r = xhr("HEAD", url);
    const len = Number(r.getResponseHeader("Content-Length"));
    if (len > 0) return len;
  } catch (e) { /* fall through */ }
  const r = xhr("GET", url, "bytes=0-0");
  const cr = r.getResponseHeader("Content-Range") || "";
  const m = cr.match(/\/(\d+)$/);
  if (!m) throw new Error("server does not expose the object length (Content-Length or Content-Range; check CORS)");
  return Number(m[1]);
};

// Bytes [start, end).
self.gpqFetchRange = function (url, start, end) {
  const r = xhr("GET", url, `bytes=${start}-${end - 1}`);
  const bytes = new Uint8Array(r.response);
  if (r.status === 200 && bytes.length > end - start) return bytes.subarray(start, end); // server ignored Range
  return bytes;
};

const ready = wasm_bindgen("pkg/geoparquet_conf_bg.wasm");

self.onmessage = async (e) => {
  try {
    await ready;
    const m = e.data;
    const report = m.type === "file"
      ? wasm_bindgen.check_bytes(m.name, new Uint8Array(m.buffer))
      : wasm_bindgen.check_url(m.url, m.maxRows >>> 0);
    self.postMessage({ report });
  } catch (err) {
    self.postMessage({ error: String(err && err.message ? err.message : err) });
  }
};
