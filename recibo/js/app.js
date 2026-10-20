/* Recibo de Vida Humana — Privatizadora de Planetas Inc.
   Entrevista (columna izquierda), recibo en vivo (centro) y acciones para llevárselo (derecha). */
(function () {
const CFG = Object.assign({ emailEndpoint: "", allowDownload: true, siteUrl: "https://futurable.work" }, window.RVH_CONFIG || {});
const $ = id => document.getElementById(id);
const els = { quiz: $("quiz"), receipt: $("receipt"), stage: $("stage"), rState: $("receiptState"), sState: $("sideState"), qCount: $("quizCount"),
  dl: $("dl"), share: $("share"), copy: $("copy"), toast: $("toast"), plain: $("plain"), mail: $("mail"), email: $("email") };

let A = { other: {} }, cur = 0, printTimer = null, printed = null;

/* ===== Utilidades ===== */
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const saveProgress = () => ls.set("rvh_progress", JSON.stringify({ A, cur }));
const loadProgress = () => { try { return JSON.parse(ls.get("rvh_progress") || "null"); } catch (e) { return null; } };
const esc = s => String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const visible = () => Q.filter(q => A.age === undefined || !q.show || q.show(A));
const optionsOf = q => (typeof q.o === "function" ? q.o(A) : q.o) || [];
const valueOf = (q, i) => q.id === "country" ? COUNTRY_KEYS[i] : i;
const toast = msg => { els.toast.textContent = msg; };
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function clientId() {
  let id = ls.get("rvh_client");
  if (!id) { id = "FW-" + String(Math.floor(Math.random() * 900000) + 100000); ls.set("rvh_client", id); }
  return id;
}
function nextReceiptNo() {
  const n = (parseInt(ls.get("rvh_count") || "0", 10) || 0) + 1;
  ls.set("rvh_count", String(n));
  return String(n).padStart(6, "0");
}
function nowStamp() { const d = new Date(), p = n => String(n).padStart(2, "0"), h = d.getHours(); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(h % 12 || 12)}:${p(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`; }

/* ===== Contenido del recibo ===== */
const LABEL = {
  cert: "Acta de nacimiento", birth: "Parto", housing: "Vivienda", food: "Alimentación", water: "Agua", elec: "Electricidad", gas: "Gas doméstico",
  household: "Mantenimiento del hogar", hygiene: "Productos de higiene", clothing: "Ropa y calzado", health: "Salud", insurance: "Seguro médico",
  hosp: "Hospitalizaciones", eduBasic: "Educación básica", eduHigh: "Educación superior", transport: "Transporte", phones: "Teléfonos celulares",
  telecom: "Internet y telefonía", extra: "Clases extraescolares", subs: "Suscripciones digitales", travel: "Viajes", leisure: "Entretenimiento",
  gym: "Ejercicio", alcohol: "Alcohol", tobacco: "Tabaco", pets: "Mascotas", ccint: "Intereses de tarjetas", mortint: "Intereses hipotecarios",
  bank: "Comisiones bancarias", ss: "Aportaciones (pensión y salud)"
};
const MAIN = ["cert", "birth", "housing", "food", "water", "elec", "gas", "household", "hygiene", "clothing", "health", "insurance", "hosp", "eduBasic", "eduHigh", "transport", "phones", "telecom"];
const EXTRAS = ["extra", "subs", "travel", "leisure", "gym", "alcohol", "tobacco", "pets"];
const MONEY = ["ccint", "mortint", "bank"];
const PENDING = "· · · · ·";

function headerLines(A, ids) {
  const c = A.country ? C[A.country] : null, L = [];
  const nf = v => fmtInt(v);
  L.push({ t: "ctr", s: "Privatizadora de Planetas Inc.", cls: "co" });
  L.push({ t: "ctr", s: "Sucursal Planeta Tierra", cls: "" });
    L.push({ t: "ctr", s: "Vía Láctea", cls: "small" });
  L.push({ t: "ctr", s: "X −8.2 · Y 0.0 · Z +0.02 kpc", cls: "small" });
  L.push({ t: "hr", k: "dash" });
  L.push({ t: "rtitle", s: "*** RECIBO DE VIDA HUMANA ***" });
  const life = A.life || (c ? c.le : null);
  L.push({ t: "meta", lines: [
    "Cajero: El Mercado",
    `Cliente Nº ${ids.client}`,
    `Recibo Nº ${ids.receipt}`,
    ids.date,
    `Nombre: ${A.alias || "—"}`,
    `País: ${c ? `${c.name} (${c.cur})` : "—"}`,
    `Edad: ${A.age ? `${A.age} años · ${nf(A.age * 365.25)} días` : "—"}`,
    `Vida estimada: ${life ? life + " años" : "—"}`
  ] });
  L.push({ t: "hr", k: "dbl" });
  return L;
}

function bodyLines(A, r) {
  const c = r.c, m = v => money(v, c), L = [], nf = v => fmtInt(v);
  const row = (l, v, cls = "") => L.push({ t: "row", l, v, cls });
  const sec = s => L.push({ t: "sec", s });
  const hr = (k = "dash") => L.push({ t: "hr", k });
  MAIN.filter(k => r.T[k] >= 1).forEach(k => row(LABEL[k], m(r.T[k])));
  const ex = EXTRAS.filter(k => r.T[k] >= 1);
  if (ex.length) { sec("*Extras*"); ex.forEach(k => row("-" + LABEL[k], m(r.T[k]))); }
  const mo = MONEY.filter(k => r.T[k] >= 1);
  if (mo.length) { sec("*El precio del dinero*"); mo.forEach(k => row("-" + LABEL[k], m(r.T[k]))); }
  sec("*Tiempo regalado*");
  if (r.unpaid > 0) {
    row(`-Cuidados sin pago (${nf(r.unpaidHours)} h)`, m(0));
    row("  Valor de mercado", m(r.unpaid), "dim");
  }
  row("-Amor", m(0)); row("-Amistad", m(0)); row("-Tiempo con los tuyos", m(0));
  hr();
  row("Subtotal", m(r.subtotal), "sub");
  row(`${c.vatName} (${r.vatRatePct}%)`, m(r.vat));
  if (r.T.tax) row(c.taxName, m(r.T.tax));
  if (r.T.ss) row(LABEL.ss, m(r.T.ss));
  L.push({ t: "gap" });
  row("Total", m(r.total), "big");
  if (r.total > 0) { const fp = Math.round(r.fam / r.total * 100); row("Pagado por tu familia", `${fp}%`, "dim"); row("Pagado por ti", `${100 - fp}%`, "dim"); }
  hr();
  sec("*Pagado con tiempo*");
  if (r.working) {
    row("-Horas de trabajo vendidas", `${nf(r.hoursWorked)} h`);
    row("-Vida despierta vendida", `${Math.round(r.hoursWorked / r.awakeSinceWork * 100)}%`);
    row("-Precio de tu hora hoy", m(r.hourly));
    row("-Horas para pagar este recibo", `${nf(r.total / r.hourly)} h`);
  } else row("-Horas de trabajo vendidas", "0 h");
  row("-Costo por día vivido", m(r.total / (A.age * 365.25)));
  sec("*Saldo pendiente*");
  if (r.futureYears > 0) row(`-Resto de tu vida (${r.futureYears} años)`, m(r.future));
  row("-Funeral", m(r.funeral));
  row("-Acta de defunción", m(c.cert * c.fx));
  row("Vida completa estimada", m(r.total + r.future + r.funeral + c.cert * c.fx), "sub");
  const others = Object.entries(A.other || {}).filter(([id, v]) => v && (A[id] === "other" || (Array.isArray(A[id]) && A[id].includes("other"))));
  if (others.length) {
    sec("*Notas del cliente*");
    others.forEach(([id, v]) => { const q = Q.find(x => x.id === id); row(`-${q ? shortQ(q) : id}: ${v}`, "", "dim"); });
  }
  return L;
}

function closingLines(r) {
  const c = r.c;
  return [
    { t: "black" },
    { t: "thanks", s: "Gracias por su estancia en el Planeta Tierra" },
    { t: "qr" },
    { t: "foot", s: `Estimación con costos promedio de ${c.name} en 2026. Lo público se pagó con tus impuestos. Lo que diste sin cobrar no aparece en ningún balance, y aun así sostuvo todo lo demás. No se aceptan devoluciones.` }
  ];
}

/* ===== QR ===== */
let qrCache = null;
function qrModules() {
  if (qrCache) return qrCache;
  try {
    if (typeof qrcode !== "function") return null;
    const qr = qrcode(0, "M"); qr.addData(CFG.siteUrl); qr.make();
    const n = qr.getModuleCount(), cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push([c, r]);
    qrCache = { n, cells }; return qrCache;
  } catch (e) { return null; }
}
function qrSvg() {
  const q = qrModules();
  if (!q) return "";
  const d = q.cells.map(([x, y]) => `M${x + 2} ${y + 2}h1v1h-1z`).join("");
  return `<svg class="qr" viewBox="0 0 ${q.n + 4} ${q.n + 4}" role="img" aria-label="Código QR a ${esc(CFG.siteUrl)}" shape-rendering="crispEdges"><path d="${d}" fill="#1b1c1e"/></svg>`;
}

/* ===== Render del recibo ===== */
function lineHTML(x, pending) {
  switch (x.t) {
    case "ctr": return `<p class="ctr ${x.cls}">${esc(x.s)}</p>`;
    case "rtitle": return `<p class="rtitle">${esc(x.s)}</p>`;
    case "meta": return `<p class="meta">${x.lines.map(esc).join("<br>")}</p>`;
    case "hr": return `<hr class="${x.k}">`;
    case "gap": return `<div style="height:6px"></div>`;
    case "sec": return `<p class="sec">${esc(x.s)}</p>`;
    case "row": {
      const v = pending && x.v ? PENDING : x.v;
      return `<div class="row ${x.cls}${pending && x.v ? " pending" : ""}" data-v="${esc(x.v)}"><span class="l">${esc(x.l)}</span><span class="v">${esc(v)}</span></div>`;
    }
    case "waiting": return `<p class="waiting">${esc(x.s)}</p>`;
    case "black": return `<div class="black" aria-hidden="true"></div>`;
    case "thanks": return `<p class="thanks">${esc(x.s)}</p>`;
    case "qr": return qrSvg();
    case "foot": return `<p class="foot">${esc(x.s)}</p>`;
  }
  return "";
}
function paint(L, pending) { els.receipt.innerHTML = L.map(x => lineHTML(x, pending)).join(""); }
function stamp(top, html) {
  const st = document.createElement("div");
  st.className = "stamp"; st.setAttribute("aria-hidden", "true"); st.innerHTML = html;
  els.receipt.appendChild(st);
  const totalRow = els.receipt.querySelector(".row.big");
  if (totalRow) st.style.top = (totalRow.offsetTop + totalRow.offsetHeight + 2) + "px";
}

function showSample() {
  const r = compute(SAMPLE);
  const ids = { client: "FW-000001", receipt: "MUESTRA", date: "19.10.2026 09:52 AM" };
  paint([...headerLines(SAMPLE, ids), ...bodyLines(SAMPLE, r), ...closingLines(r)], false);
  stamp(0, "MUESTRA<br><span>SIN VALOR</span>");
  els.rState.textContent = "Recibo de muestra";
}
function showLive() {
  const ids = { client: clientId(), receipt: "En curso", date: nowStamp() };
  const head = headerLines(A, ids);
  if (!A.age || !A.country) {
    paint([...head, { t: "waiting", s: "Esperando al cliente…" }], true);
  } else {
    const r = compute(A);
    paint([...head, ...bodyLines(A, r), ...closingLines(r)], true);
  }
  els.rState.textContent = "Transacción en curso";
}

/* ===== Entrevista ===== */
function introPanel() {
  clearInterval(printTimer);
  const saved = loadProgress();
  els.quiz.innerHTML = `
    <h2>Bienvenido a la sucursal Planeta Tierra.</h2>
    <p>Esta entrevista tiene ${Q.length} preguntas sobre tu origen, tu casa, tu trabajo, tu cuerpo y tus hábitos. Con cada respuesta, la caja va armando tu recibo.</p>
    <p class="small">Cliente Nº ${clientId()} · Unos 4 minutos · Nada sale de tu navegador.</p>
    <div class="btns">
      <button class="btn" id="go">Iniciar transacción</button>
      ${saved && saved.A && saved.A.age !== undefined ? `<button class="btn ghost" id="resume">Retomar donde ibas</button>` : ""}
    </div>`;
  els.qCount.textContent = `${Q.length} preguntas`;
  $("go").onclick = () => { A = { other: {} }; cur = 0; ls.del("rvh_progress"); resetSide(); ask(); };
  const rs = $("resume");
  if (rs) rs.onclick = () => { A = Object.assign({ other: {} }, saved.A); cur = Math.min(saved.cur || 0, visible().length - 1); resetSide(); ask(); };
}

function ask() {
  const list = visible();
  if (cur >= list.length) { printReceipt(); return; }
  const q = list[cur];
  saveProgress();
  showLive();
  els.qCount.textContent = `${String(cur + 1).padStart(2, "0")} / ${list.length}`;
  let body = "";
  if (q.type === "text") body = `<input type="text" id="in" maxlength="28" autocomplete="off" placeholder="${esc(q.ph)}" value="${esc(A.alias || "")}"><div class="err" id="err"></div>`;
  else if (q.type === "number") body = `<input type="number" id="in" inputmode="numeric" min="1" max="110" placeholder="${esc(q.ph)}" value="${A.age ?? ""}"><div class="err" id="err"></div>`;
  else if (q.type === "life") {
    const c = C[A.country] || C.MX;
    body = `<input type="number" id="in" inputmode="numeric" min="${A.age}" max="150" placeholder="Ej. ${Math.max(c.le, A.age + 1)}" value="${A.life ?? ""}"><div class="err" id="err"></div>`;
  } else {
    const sel = A[q.id], isOn = v => q.multi ? Array.isArray(sel) && sel.includes(v) : sel === v;
    const rows = optionsOf(q).map((o, i) => [valueOf(q, i), o]);
    if (!q.noOther) rows.push(["other", "Otro"]);
    body = `<div class="opts" role="${q.multi ? "group" : "radiogroup"}" aria-label="${esc(q.q)}">${rows.map(([v, label], i) => {
      const on = isOn(v);
      return `<button class="opt${on ? " on" : ""}" role="${q.multi ? "checkbox" : "radio"}" aria-checked="${on}" data-v="${v}" id="o-${q.id}-${i}"><span class="k">${q.multi ? `[${on ? "x" : " "}]` : i + 1}</span><span class="t">${esc(label)}</span></button>`;
    }).join("")}</div>
    <div id="otherBox" ${isOn("other") ? "" : "hidden"}><input type="text" id="otherTxt" maxlength="60" placeholder="Escribe tu respuesta" value="${esc((A.other || {})[q.id] || "")}"></div>`;
  }
  const why = q.type === "life" ? `La esperanza de vida en ${(C[A.country] || C.MX).name} es de ${(C[A.country] || C.MX).le} años. Tu respuesta define el saldo pendiente.` : q.why;
  const needsNext = q.type || q.multi || A[q.id] === "other";
  els.quiz.innerHTML = `
    <div class="qhead"><span>${q.ch}</span><span>${q.multi ? "Respuesta múltiple" : ""}</span></div>
    <div class="prog" aria-hidden="true"><i style="width:${Math.round((cur + 1) / list.length * 100)}%"></i></div>
    <p class="q">${esc(q.q)}</p>
    <div class="field"><b>Nota de campo</b><p>${esc(why)}</p></div>
    ${body}
    <div class="nav">
      <button class="link" id="back">${cur === 0 ? "Salir" : "← Anterior"}</button>
      <button class="btn inline" id="next" ${needsNext ? "" : "hidden"}>Continuar →</button>
    </div>`;
  $("back").onclick = () => { if (cur === 0) { introPanel(); showSample(); } else { cur--; ask(); } };
  const next = $("next");
  if (q.type) {
    const inp = $("in"), err = $("err");
    if (matchMedia("(hover: hover)").matches) setTimeout(() => inp.focus({ preventScroll: true }), 30);
    const go = () => {
      const v = parseInt(inp.value, 10);
      if (q.type === "text") A.alias = inp.value.trim();
      else if (q.type === "number") { if (!(v >= 1 && v <= 110)) { err.textContent = "Escribe una edad entre 1 y 110 años."; return; } A.age = v; }
      else { if (!(v >= A.age && v <= 150)) { err.textContent = `Escribe una edad entre ${A.age} y 150 años.`; return; } A.life = v; }
      cur++; ask();
    };
    next.onclick = go;
    inp.onkeydown = e => { if (e.key === "Enter") go(); };
  } else {
    els.quiz.querySelectorAll(".opt").forEach(b => b.onclick = () => choose(q, b));
    const ot = $("otherTxt");
    ot.oninput = () => { A.other = A.other || {}; A.other[q.id] = ot.value.trim(); saveProgress(); };
    ot.onkeydown = e => { if (e.key === "Enter") advance(q); };
    next.onclick = () => advance(q);
    refreshNext(q);
  }
}
const parseVal = (q, raw) => raw === "other" ? "other" : q.id === "country" ? raw : +raw;
function choose(q, b) {
  const v = parseVal(q, b.dataset.v);
  if (q.multi) {
    let arr = Array.isArray(A[q.id]) ? A[q.id].slice() : [];
    if (arr.includes(v)) arr = arr.filter(x => x !== v);
    else if (q.excl !== undefined && v === q.excl) arr = [v];
    else { arr = arr.filter(x => x !== q.excl); arr.push(v); }
    A[q.id] = arr;
  } else A[q.id] = v;
  saveProgress();
  els.quiz.querySelectorAll(".opt").forEach(x => {
    const xv = parseVal(q, x.dataset.v), on = q.multi ? A[q.id].includes(xv) : A[q.id] === xv;
    x.classList.toggle("on", on); x.setAttribute("aria-checked", on);
    if (q.multi) x.querySelector(".k").textContent = `[${on ? "x" : " "}]`;
  });
  const showOther = q.multi ? A[q.id].includes("other") : A[q.id] === "other";
  $("otherBox").hidden = !showOther;
  if (showOther) setTimeout(() => $("otherTxt").focus(), 20);
  refreshNext(q);
  if (A.age && A.country) showLive();
  if (!q.multi && v !== "other") setTimeout(() => { cur++; ask(); }, 170);
}
function refreshNext(q) {
  const next = $("next"), v = A[q.id];
  if (q.multi) { next.hidden = false; next.disabled = !(Array.isArray(v) && v.length); }
  else next.hidden = v !== "other";
}
function advance(q) {
  const v = A[q.id];
  if (q.multi && !(Array.isArray(v) && v.length)) return;
  cur++; ask();
}
document.addEventListener("keydown", e => {
  if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const n = parseInt(e.key, 10);
  if (!(n >= 1 && n <= 9)) return;
  const b = els.quiz.querySelectorAll(".opt")[n - 1];
  if (b) b.click();
});

/* ===== Impresión ===== */
function printReceipt() {
  clearInterval(printTimer);
  saveProgress();
  const ids = { client: clientId(), receipt: nextReceiptNo(), date: nowStamp() };
  const r = compute(A);
  const L = [...headerLines(A, ids), ...bodyLines(A, r), ...closingLines(r)];
  printed = { L, r, ids };
  paint(L, true);
  els.rState.textContent = "Imprimiendo…";
  els.qCount.textContent = "Completa";
  els.quiz.innerHTML = `
    <h2>Transacción cerrada.</h2>
    <p>Recibo Nº ${ids.receipt} para el cliente Nº ${ids.client}.</p>
    <div class="row-total"><span class="small">Total</span><p class="q" style="margin:0">${money(r.total, r.c)}</p></div>
    <p class="small">El recibo completo está en la caja. Puedes descargarlo, compartirlo o recibirlo por correo.</p>
    <div class="btns">
      <button class="btn ghost" id="edit">Editar respuestas</button>
      <button class="link" id="new">Nueva transacción</button>
    </div>`;
  $("edit").onclick = () => { cur = 0; resetSide(); ask(); };
  $("new").onclick = () => { ls.del("rvh_progress"); A = { other: {} }; resetSide(); introPanel(); showSample(); };
  if (matchMedia("(max-width: 900px)").matches) els.stage.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  const rows = [...els.receipt.querySelectorAll(".row.pending")];
  const finish = () => {
    clearInterval(printTimer);
    rows.forEach(rw => { rw.classList.remove("pending"); rw.querySelector(".v").textContent = rw.dataset.v; });
    stamp(0, "PAGADO<br><span>CON TU VIDA</span>");
    els.rState.textContent = `Recibo Nº ${ids.receipt}`;
    enableSide();
  };
  if (reduceMotion()) { finish(); return; }
  let i = 0;
  printTimer = setInterval(() => {
    if (i >= rows.length) { finish(); return; }
    const rw = rows[i++];
    rw.classList.remove("pending"); rw.classList.add("fill"); rw.querySelector(".v").textContent = rw.dataset.v;
  }, 45);
}

/* ===== Acciones ===== */
function resetSide() {
  printed = null;
  [els.dl, els.share, els.copy].forEach(b => b.disabled = true);
  els.sState.textContent = "Pendiente"; toast(""); els.plain.hidden = true;
}
function enableSide() {
  [els.share, els.copy].forEach(b => b.disabled = false);
  els.dl.disabled = !CFG.allowDownload;
  els.sState.textContent = "Listo";
}
if (!CFG.allowDownload) els.dl.hidden = true;

function plainText(L) {
  const W = 40, out = [], up = s => s.toLocaleUpperCase("es");
  const center = s => { s = up(s); return " ".repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s; };
  const pad = (l, v) => { l = up(l); const sp = W - v.length - 1; if (l.length > sp) { out.push(l); if (v) out.push(" ".repeat(W - v.length) + v); } else out.push(l + " ".repeat(W - l.length - v.length) + v); };
  for (const x of L) {
    if (x.t === "ctr" || x.t === "rtitle" || x.t === "thanks") out.push(center(x.s));
    else if (x.t === "meta") x.lines.forEach(l => out.push(up(l)));
    else if (x.t === "row") pad(x.l, x.v);
    else if (x.t === "sec") out.push(up(x.s));
    else if (x.t === "hr") out.push((x.k === "dbl" ? "=" : "-").repeat(W));
    else if (x.t === "black") out.push(" ".repeat(12) + "█".repeat(28));
    else if (x.t === "foot") out.push("", up(x.s));
  }
  out.push("", center("futurable.work"));
  return out.join("\n");
}
function showPlain(text, msg) { els.plain.value = text; els.plain.hidden = false; els.plain.select(); toast(msg); }

els.copy.onclick = () => {
  if (!printed) return;
  const text = plainText(printed.L);
  try { navigator.clipboard.writeText(text).then(() => toast("Recibo copiado"), () => showPlain(text, "Selecciona el texto y cópialo")); }
  catch (e) { showPlain(text, "Selecciona el texto y cópialo"); }
};
els.dl.onclick = async () => {
  if (!printed) return;
  els.dl.disabled = true; toast("Imprimiendo imagen…");
  try {
    const canvas = await drawReceipt(printed.L);
    const a = document.createElement("a");
    a.download = `recibo-de-vida-humana-${printed.ids.receipt}.png`;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a); a.click(); a.remove();
    toast("Imagen descargada");
  } catch (e) { toast("No se pudo generar la imagen. Copia el recibo como texto."); }
  els.dl.disabled = false;
};
els.share.onclick = async () => {
  if (!printed) return;
  const { r, ids, L } = printed, text = `Mi vida ha costado ${money(r.total, r.c)} según Privatizadora de Planetas Inc. Recibo Nº ${ids.receipt}.`;
  const url = /^https?:/.test(location.href) && !/claude|localhost/.test(location.hostname) ? location.href.split("#")[0] : CFG.siteUrl;
  try {
    if (navigator.share) {
      let files;
      try {
        const canvas = await drawReceipt(L);
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        const f = new File([blob], `recibo-de-vida-humana-${ids.receipt}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) files = [f];
      } catch (e) {}
      await navigator.share(files ? { files, title: "Recibo de Vida Humana", text } : { title: "Recibo de Vida Humana", text, url });
      toast("Compartido"); return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const msg = `${text}\n${url}`;
  try { await navigator.clipboard.writeText(msg); toast("Copiamos el mensaje y el enlace para que lo pegues donde quieras"); }
  catch (e) { showPlain(msg, "Copia este mensaje para compartirlo"); }
};
els.mail.onsubmit = async e => {
  e.preventDefault();
  const email = els.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast("Revisa el correo: falta algo antes o después de la @."); return; }
  if (!printed) { toast("Termina la entrevista para emitir tu recibo."); return; }
  if (!CFG.emailEndpoint) { toast("El envío por correo llega pronto. Por ahora, descarga o comparte tu recibo."); return; }
  toast("Registrando…");
  try {
    const { r, ids, L } = printed;
    const res = await fetch(CFG.emailEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, cliente: ids.client, recibo: ids.receipt, pais: r.c.name, total: money(r.total, r.c), texto: plainText(L) }) });
    toast(res.ok ? `Correo registrado para el recibo Nº ${ids.receipt}.` : "No pudimos registrar tu correo. Intenta de nuevo en un momento.");
  } catch (err) { toast("No pudimos registrar tu correo. Intenta de nuevo en un momento."); }
};

/* ===== Imagen del recibo (canvas) ===== */
async function drawReceipt(L) {
  const BODY = '"Spline Sans Mono", ui-monospace, monospace', DISP = '"Martian Mono", ui-monospace, monospace';
  try { await Promise.all([document.fonts.load(`400 21px ${BODY}`), document.fonts.load(`600 21px ${BODY}`), document.fonts.load(`800 30px ${DISP}`)]); } catch (e) {}
  const S = 2, W = 720, PAD = 48, IN = W - PAD * 2, MARGIN = 36, TOOTH = 10;
  const INK = "#1b1c1e", SOFT = "#5d6066", PAPER = "#fcfcfa", RED = "#b3202a";
  const up = s => s.toLocaleUpperCase("es");
  const wrap = (ctx, text, max) => {
    const words = text.split(" "), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  };
  function pass(ctx, draw) {
    let y = TOOTH + 34, stampY = null;
    const set = (f, col = INK) => { ctx.font = f; ctx.fillStyle = col; ctx.textAlign = "left"; };
    const center = (t, yy) => { if (draw) { ctx.textAlign = "center"; ctx.fillText(t, W / 2, yy); ctx.textAlign = "left"; } };
    for (const x of L) {
      if (x.t === "ctr") {
        const co = x.cls === "co", sm = x.cls === "small";
        set(co ? `800 30px ${DISP}` : sm ? `400 18px ${BODY}` : `400 21px ${BODY}`, sm ? SOFT : INK);
        center(up(x.s), y + 22); y += co ? 40 : sm ? 26 : 30;
      } else if (x.t === "rtitle") {
        y += 14; set(`800 27px ${DISP}`); center(x.s, y + 24); y += 50;
      } else if (x.t === "meta") {
        set(`400 21px ${BODY}`);
        x.lines.forEach(l => { if (draw) ctx.fillText(up(l), PAD, y + 22); y += 30; });
      } else if (x.t === "hr") {
        y += 8;
        if (draw) {
          ctx.strokeStyle = INK; ctx.lineWidth = 2;
          if (x.k === "dbl") { ctx.setLineDash([]); [0, 6].forEach(o => { ctx.beginPath(); ctx.moveTo(PAD, y + o); ctx.lineTo(W - PAD, y + o); ctx.stroke(); }); }
          else { ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke(); ctx.setLineDash([]); }
        }
        y += x.k === "dbl" ? 22 : 16;
      } else if (x.t === "gap") { y += 8; }
      else if (x.t === "sec") {
        y += 6; set(`400 21px ${BODY}`);
        if (draw) ctx.fillText(up(x.s), PAD, y + 22); y += 30;
      } else if (x.t === "row") {
        const big = x.cls.includes("big");
        set(big ? `800 30px ${DISP}` : `${x.cls.includes("sub") ? 600 : 400} 21px ${BODY}`, x.cls.includes("dim") ? SOFT : INK);
        if (big) y += 6;
        const lh = big ? 42 : 30, vw = x.v ? ctx.measureText(x.v).width : 0;
        const lines = wrap(ctx, up(x.l), IN - vw - (vw ? 20 : 0));
        if (big) stampY = y;
        if (draw) {
          lines.forEach((t, i) => ctx.fillText(t, PAD, y + 24 + i * lh));
          if (x.v) { ctx.textAlign = "right"; ctx.fillText(x.v, W - PAD, y + 24); ctx.textAlign = "left"; }
        }
        y += lines.length * lh + (big ? 4 : 0);
      } else if (x.t === "black") {
        y += 22; if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD + IN * .3, y, IN * .7, 32); } y += 54;
      } else if (x.t === "thanks") {
        set(`600 21px ${BODY}`); wrap(ctx, up(x.s), IN).forEach(t => { center(t, y + 22); y += 30; });
      } else if (x.t === "qr") {
        const q = qrModules();
        if (q) {
          y += 18; const size = 200, cell = size / (q.n + 4), x0 = (W - size) / 2;
          if (draw) { ctx.fillStyle = INK; q.cells.forEach(([cx, cy]) => ctx.fillRect(x0 + (cx + 2) * cell, y + (cy + 2) * cell, cell + .3, cell + .3)); }
          y += size + 18;
        }
      } else if (x.t === "foot") {
        set(`400 18px ${BODY}`);
        const lines = wrap(ctx, up(x.s), IN);
        lines.forEach((t, i) => {
          if (draw) {
            const words = t.split(" ");
            if (i === lines.length - 1 || words.length < 2) ctx.fillText(t, PAD, y + 20);
            else {
              const wsum = words.reduce((s, w) => s + ctx.measureText(w).width, 0), gapW = (IN - wsum) / (words.length - 1);
              let xx = PAD; words.forEach(w => { ctx.fillText(w, xx, y + 20); xx += ctx.measureText(w).width + gapW; });
            }
          }
          y += 26;
        });
      }
    }
    y += 22; set(`600 20px ${BODY}`); center("futurable.work", y + 18); y += 44;
    return { h: y + TOOTH, stampY };
  }
  const { h } = pass(document.createElement("canvas").getContext("2d"), false);
  const canvas = document.createElement("canvas");
  canvas.width = (W + MARGIN * 2) * S; canvas.height = (h + MARGIN * 2) * S;
  const ctx = canvas.getContext("2d");
  ctx.scale(S, S);
  const g = ctx.createLinearGradient(0, 0, W + MARGIN * 2, h + MARGIN * 2);
  g.addColorStop(0, "#cfeee2"); g.addColorStop(.35, "#d3e2f7"); g.addColorStop(.65, "#e2d6f4"); g.addColorStop(1, "#f6d5e5");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W + MARGIN * 2, h + MARGIN * 2);
  ctx.translate(MARGIN, MARGIN);
  ctx.save(); ctx.shadowColor = "rgba(30,20,60,.2)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = PAPER; ctx.beginPath();
  const step = 18;
  ctx.moveTo(0, TOOTH);
  for (let x = 0; x < W; x += step) { ctx.lineTo(x + step / 2, 0); ctx.lineTo(Math.min(W, x + step), TOOTH); }
  ctx.lineTo(W, h - TOOTH);
  for (let x = W; x > 0; x -= step) { ctx.lineTo(x - step / 2, h); ctx.lineTo(Math.max(0, x - step), h - TOOTH); }
  ctx.closePath(); ctx.fill(); ctx.restore();
  const { stampY } = pass(ctx, true);
  if (stampY !== null) {
    ctx.save(); ctx.translate(W * .6, stampY + 96); ctx.rotate(-14 * Math.PI / 180); ctx.globalAlpha = .82;
    ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.strokeRect(-110, -46, 220, 92);
    ctx.fillStyle = RED; ctx.textAlign = "center"; ctx.font = `800 34px ${DISP}`; ctx.fillText("PAGADO", 0, 2);
    ctx.font = `800 18px ${DISP}`; ctx.fillText("CON TU VIDA", 0, 30); ctx.restore();
  }
  return canvas;
}

introPanel();
showSample();
})();
