/* Recibo de Vida Humana — modelo de costos.
   Costos base en USD por mes para un adulto de nivel medio en una ciudad media de México.
   Cada país ajusta por categoría con un índice de precios. Valores aproximados para 2026. */

const BASE = { housing: 350, food: 260, water: 10, elec: 22, gas: 16, telecom: 30, health: 50, clothing: 35, hygiene: 24, household: 27, leisure: 86 };
const MODE = [8, 50, 110, 350, 220];   // caminar/bici, público, moto, auto, taxi/apps
const LVL = [.4, .65, 1, 1.7, 3.2];    // multiplicador de consumo por nivel económico
const NOW_YEAR = 2026;

const C = {
  MX: { name: "México", cur: "MXN", loc: "es-MX", fx: 18.5, le: 75, vat: .16, taxName: "ISR (impuesto sobre la renta)", vatName: "IVA", cert: 5, funeral: 1600, mort: .6, cc: .55, ss: .03,
    idx: { housing: 1, food: 1, util: 1, telecom: 1, health: 1, clothing: 1, hygiene: 1, household: 1, leisure: 1, transport: 1, travel: 1, tobacco: 1, tech: 1.2, sub: .7 }, edu: [1, 1, 1, 1], inc: [380, 810, 1620, 3500, 8100], tax: [.02, .08, .14, .21, .28] },
  CO: { name: "Colombia", cur: "COP", loc: "es-CO", fx: 4100, le: 77, vat: .19, taxName: "Impuesto de renta", vatName: "IVA", cert: 2, funeral: 900, mort: .55, cc: .3, ss: .08,
    idx: { housing: .8, food: .85, util: .9, telecom: 1, health: .8, clothing: .9, hygiene: .9, household: .9, leisure: .85, transport: .9, travel: .9, tobacco: .7, tech: 1.3, sub: .6 }, edu: [.9, .8, 2, .9], inc: [330, 700, 1450, 3100, 7300], tax: [0, .02, .08, .15, .24] },
  US: { name: "Estados Unidos", cur: "USD", loc: "en-US", fx: 1, le: 79, vat: .07, taxName: "Income tax federal y estatal", vatName: "Sales tax", cert: 25, funeral: 8000, mort: .45, cc: .22, ss: .0765,
    idx: { housing: 4.2, food: 2, util: 3, telecom: 2.5, health: 8, clothing: 2, hygiene: 1.8, household: 2.5, leisure: 2.5, transport: 2.6, travel: 2, tobacco: 3, tech: 1, sub: 1.1 }, edu: [2, 4.5, 18, 8], inc: [1800, 3500, 6000, 10000, 22000], tax: [.04, .08, .12, .17, .25] },
  ES: { name: "España", cur: "EUR", loc: "es-ES", fx: .88, le: 84, vat: .21, taxName: "IRPF", vatName: "IVA", cert: 0, funeral: 4000, mort: .3, cc: .18, ss: .065,
    idx: { housing: 2.3, food: 1.4, util: 2.5, telecom: 1.3, health: 1.2, clothing: 1.4, hygiene: 1.4, household: 1.6, leisure: 1.6, transport: 1.6, travel: 1.6, tobacco: 1.7, tech: 1.15, sub: .9 }, edu: [1.5, 1.4, 2.8, 1.8], inc: [1300, 2000, 3000, 5000, 10000], tax: [.05, .11, .17, .24, .32] },
  CL: { name: "Chile", cur: "CLP", loc: "es-CL", fx: 940, le: 81, vat: .19, taxName: "Impuesto de segunda categoría", vatName: "IVA", cert: 2, funeral: 2000, mort: .4, cc: .3, ss: .17,
    idx: { housing: 1.4, food: 1.3, util: 1.5, telecom: 1.1, health: 1.6, clothing: 1.2, hygiene: 1.2, household: 1.2, leisure: 1.2, transport: 1.3, travel: 1.3, tobacco: 2, tech: 1.15, sub: .8 }, edu: [1.2, 1, 6, 2], inc: [600, 1100, 2000, 4000, 9000], tax: [0, 0, .02, .07, .15] },
  PE: { name: "Perú", cur: "PEN", loc: "es-PE", fx: 3.7, le: 77, vat: .18, taxName: "Impuesto a la renta", vatName: "IGV", cert: 3, funeral: 1000, mort: .5, cc: .45, ss: .13,
    idx: { housing: .75, food: .85, util: .9, telecom: .9, health: .8, clothing: .85, hygiene: .85, household: .85, leisure: .85, transport: .85, travel: .9, tobacco: .9, tech: 1.2, sub: .6 }, edu: [.8, .7, 1, .7], inc: [350, 700, 1400, 3000, 7000], tax: [0, .02, .06, .11, .2] }
};
const COUNTRY_KEYS = ["MX", "CO", "US", "ES", "CL", "PE"];

function money(v, c) {
  // Siempre coma para los miles, sin importar el país, para que se lea igual en todas partes.
  const n = Math.round(v), sym = c.cur === "EUR" ? "€" : "$";
  return (n < 0 ? "-" : "") + sym + fmtInt(Math.abs(n));
}
function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function round2(n) { if (n <= 0) return 0; const p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / p) * p; }
function incomeLabels(c) {
  const r = c.inc.map(x => x * c.fx), b = [];
  for (let i = 0; i < 4; i++) b.push(round2(Math.sqrt(r[i] * r[i + 1])));
  const f = v => money(v, c);
  return [`Menos de ${f(b[0])} al mes`, `${f(b[0])} – ${f(b[1])} al mes`, `${f(b[1])} – ${f(b[2])} al mes`, `${f(b[2])} – ${f(b[3])} al mes`, `Más de ${f(b[3])} al mes`];
}

/* Respuestas: índice, "other", o arreglo de índices (respuesta múltiple). */
const one = (v, def) => (typeof v === "number" ? v : def);
const many = (v, def) => {
  if (!Array.isArray(v)) return typeof v === "number" ? [v] : def;
  const n = v.filter(x => typeof x === "number");
  return n.length ? n : def;
};
const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
const START_AGES = [14, 16, 19, 23, 27, null];
const VAT_KEYS = ["food", "water", "elec", "gas", "telecom", "clothing", "hygiene", "household", "leisure", "transport", "travel", "phones", "subs", "alcohol", "tobacco", "gym", "pets"];

function compute(A) {
  const c = C[A.country], I = c.idx, age = A.age;
  const life = Math.max(age, A.life || c.le);
  const leftAge = Math.min(age, [17, 20, 24, 28, 32, 999][one(A.leftHome, 5)]);
  const startAge = START_AGES[one(A.startWork, 2)];
  const working = startAge !== null && startAge < age;
  const lvlChild = LVL[one(A.childLvl, 2)];
  const incIdx = one(A.income, 2);
  const lvlNow = working ? LVL[incIdx] : lvlChild;
  const lvlAt = a => a < leftAge ? lvlChild : lvlChild + (lvlNow - lvlChild) * Math.min(1, (a - leftAge) / 12);
  const place = one(A.place, 1), PH = [1.45, 1, .6][place], PF = [1.1, 1, .88][place];
  const hhIdx = one(A.household, 1), share = [1, .6, .45, .35][hhIdx], ushare = [1, .67, .53, .43][hhIdx];
  const t = one(A.tenure, 0), tenF = [1, 1.15, .55, .3], tenU = [1, 1, 1, .4];
  const famSize = [0, 1, 2, 3, 4.5][one(A.siblings, 1)] + 3;
  const diet = [.85, 1.15, 1.6][one(A.diet, 1)];
  const extraN = many(A.extra, []).filter(i => i !== 4).length + (Array.isArray(A.extra) && A.extra.includes("other") ? 1 : 0);
  const ins = many(A.ins, [0]), hasPriv = ins.includes(1), hasPub = ins.includes(0);
  const insF = hasPriv ? (hasPub ? .9 : 1) : hasPub ? .8 : 1.2;
  const hospF = hasPriv ? .35 : hasPub ? .2 : 1;
  const edu = one(A.eduLvl, 2);
  const basicEnd = [12, 15, 18, 18, 18, 18, 18][edu];
  const schoolT = many(A.school, [0, 1]);
  const uniT = many(A.uniType, [0]);
  const transportCost = avg(many(A.transport, [1]).map(i => MODE[i]));
  const mortStart = Math.max(leftAge, age < 30 ? leftAge + (age - leftAge) / 2 : 30);
  const birthYear = NOW_YEAR - age;
  const workT = [[1, 1], [.85, .6], [.05, 0], [1.1, .3]][one(A.workType, 0)];
  const hoursWk = [15, 38, 45, 55, 65][one(A.hours, 1)];
  const income = a => c.inc[incIdx] * Math.max(.35, Math.min(1, .35 + .65 * (a - startAge) / 15));

  function year(a, add) {
    const home = a < leftAge, lv = lvlAt(a), y = birthYear + a;
    let hs, uf, hh;
    if (home) { hs = BASE.housing * I.housing * PH * Math.pow(lv, .9) * 1.6 / famSize; uf = 2.6 / famSize; hh = 1.6 / famSize; }
    else { hs = BASE.housing * I.housing * PH * Math.pow(lv, .9) * share * tenF[t]; uf = ushare * tenU[t]; hh = share * (t === 3 ? .4 : 1); }
    if (!home && t === 1 && a >= mortStart) { const int = hs * c.mort; add("mortint", int * 12, a); hs -= int; }
    add("housing", hs * 12, a);
    const ul = Math.pow(lv, .5);
    add("water", BASE.water * I.util * uf * ul * 12, a);
    add("elec", BASE.elec * I.util * uf * ul * 12, a);
    add("gas", BASE.gas * I.util * uf * ul * 12, a);
    const ff = a < 3 ? .3 : a < 12 ? .55 : a < 18 ? .8 : 1;
    const dm = (!home && a >= 18) ? diet : (a >= 18 ? (diet + 1) / 2 : 1);
    add("food", BASE.food * I.food * PF * Math.pow(lv, .6) * ff * dm * 12, a);
    const tf = a < 12 ? 0 : a < 18 ? .4 : (home ? .7 : 1);
    add("telecom", BASE.telecom * I.telecom * Math.pow(lv, .4) * tf * 12, a);
    add("clothing", BASE.clothing * I.clothing * Math.pow(lv, .8) * (a < 18 ? .6 : 1) * 12, a);
    add("hygiene", BASE.hygiene * I.hygiene * Math.pow(lv, .5) * (a < 3 ? .9 : a < 18 ? .5 : 1) * 12, a);
    add("household", BASE.household * I.household * lv * hh * 12, a);
    add("leisure", BASE.leisure * I.leisure * lv * (a < 5 ? .15 : a < 18 ? .35 : 1) * 12, a);
    const agef = a < 18 ? .6 : a < 50 ? 1 : a < 65 ? 1.6 : 2.3;
    add("health", BASE.health * I.health * Math.pow(lv, .6) * agef * (home && a < 18 ? 1 : insF) * 12, a);
    if (hasPriv && !home) add("insurance", 70 * I.health * Math.pow(lv, .5) * (a < 40 ? 1 : a < 55 ? 1.5 : 2.2) * 12, a);
    const tr = a < 6 ? MODE[1] * .15 : a < 15 ? MODE[1] * .3 : a < 18 ? MODE[1] * .6 : transportCost * (a < 23 ? .75 : 1) * Math.pow(lv, .45);
    add("transport", tr * I.transport * 12, a);

    if (a >= 4 && a < basicEnd) {
      const per = [25 * c.edu[0], 300 * c.edu[1] * Math.pow(lvlChild, .5), 650, 120 * c.edu[0]];
      add("eduBasic", avg(schoolT.map(i => per[i])) * 12, a);
    }
    if (a >= 5 && a < 18) add("extra", extraN * 30 * I.leisure * Math.pow(lvlChild, .5) * 12, a);
    if (edu >= 3 && a >= 18) {
      const pu = 50 * c.edu[2], pr = 480 * c.edu[3] * Math.pow(lvlChild, .3);
      const uni = avg(uniT.map(i => [pu, pr, pu * .5, 2600][i]));
      if (edu === 3 && a < 20) add("eduHigh", uni * .7 * 12, a);
      if (edu === 4 && a < 20) add("eduHigh", uni * 12, a);
      if (edu >= 5 && a < 22) add("eduHigh", uni * 12, a);
      if (edu === 6 && a >= 23 && a < 25) add("eduHigh", (uniT.includes(1) || uniT.includes(3) ? pr * 1.3 : pu * 2) * 12, a);
    }
    if (a >= 18) {
      const lh = Math.pow(lv, .5);
      add("alcohol", [0, 20, 70][one(A.alcohol, 1)] * I.leisure * lh * 12, a);
      const tb = one(A.tobacco, 0), tob = [0, .6, 3.5, 3.5][tb];
      if (tob && (tb !== 3 || a < 28)) add("tobacco", tob * I.tobacco * 365, a);
      if (a >= 20) add("gym", [0, .25, .6][one(A.gym, 1)] * 30 * I.leisure * lh * 12, a);
      if (a >= Math.max(22, leftAge)) add("pets", [0, 1, 2.5][one(A.pets, 1)] * 40 * I.leisure * lh * .7 * 12, a);
      if (a >= leftAge) add("travel", [0, 250, 1200, 4000][one(A.travel, 1)] * I.travel * lh, a);
      add("bank", 3 * I.household * 12, a);
    }
    if (a >= 14 && y >= 2014) add("subs", [0, 1.5, 4, 7][one(A.subs, 1)] * 9 * I.sub * (y < 2019 ? .6 : 1) * 12, a);
    if (a >= 13 && y >= 2010) add("phones", 320 * Math.pow(lv, .6) * I.tech / [1.2, 2.5, 4.5, 6][one(A.phone, 1)], a);
    if (working && a >= startAge && a < 65) {
      const inc = income(a) * 12;
      add("tax", inc * c.tax[incIdx] * workT[0], a);
      add("ss", inc * c.ss * workT[1], a);
      if (a >= 21) add("ccint", [0, .5, 1.5][one(A.cc, 0)] * income(a) * c.cc, a);
    }
  }

  const T = {}, F = {};
  const add = (k, usd, a) => { if (!(usd > 0)) return; const v = usd * c.fx; T[k] = (T[k] || 0) + v; if (a < leftAge) F[k] = (F[k] || 0) + v; };
  add("cert", c.cert, 0);
  add("birth", [150, 2200, 60][one(A.birth, 0)] * I.health, 0);
  const hn = [0, 1, 2.5, 5][one(A.hosp, 1)];
  if (hn) add("hosp", hn * 1500 * I.health * hospF, age);
  for (let a = 0; a < age; a++) year(a, add);

  // Precio sin impuesto al consumo; el impuesto se suma aparte, como en un ticket.
  const vatRate = c.vat * .75;
  let vat = 0;
  for (const k of VAT_KEYS) if (T[k]) { const part = T[k] * vatRate / (1 + vatRate); T[k] -= part; vat += part; }
  const subtotal = Object.entries(T).filter(([k]) => k !== "tax" && k !== "ss").reduce((s, [, v]) => s + v, 0);
  const total = subtotal + vat + (T.tax || 0) + (T.ss || 0);
  const fam = Object.values(F).reduce((s, v) => s + v, 0);

  let future = 0;
  for (let a = age; a < life; a++) year(a, (k, u) => { if (u > 0) future += u * c.fx; });

  let hoursWorked = 0;
  if (working) for (let a = startAge; a < age; a++) hoursWorked += hoursWk * 48;
  const hourly = working ? c.inc[incIdx] * c.fx / (hoursWk * 4.33) : 0;
  const unpaidH = [2, 10, 22, 40][one(A.unpaid, 1)];
  const unpaidHours = Math.max(0, age - 15) * 52 * unpaidH;
  return {
    c, T, F, subtotal, vat, vatRatePct: Math.round(c.vat * 100), total, fam, life, future, futureYears: life - age,
    funeral: c.funeral * c.fx, hoursWorked, hourly, awakeSinceWork: working ? (age - startAge) * 365 * 16 : 0,
    unpaid: unpaidHours * (c.inc[0] * c.fx / 173), unpaidHours, working, leftAge, age
  };
}

if (typeof module !== "undefined") module.exports = { compute, C, COUNTRY_KEYS, money, incomeLabels, fmtInt };
