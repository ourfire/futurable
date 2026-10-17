// Envía el pase de abordaje de ARCA por correo, con la imagen adjunta.
// Proveedor: Brevo (BREVO_API_KEY) o Resend (RESEND_API_KEY), el que esté configurado.
// Variables en Netlify:
//   BREVO_API_KEY  o  RESEND_API_KEY
//   ARCA_FROM_EMAIL   remitente verificado, p. ej. arca@futurable.now
//   ARCA_FROM_NAME    opcional, por defecto "ARCA · Futurable"
//   ARCA_REPLY_TO     opcional, a dónde llegan las respuestas

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const MAX_IMG = 1_500_000; // ~1.1 MB de JPEG en base64

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (v, n) => String(v ?? "").slice(0, n);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function plantilla(d) {
  const hola = d.nombre ? `Hola, ${esc(d.nombre)}:` : "Hola, pasajero:";
  const equipaje = d.equipaje.map((e) => `<li style="margin:0 0 6px">${esc(e)}</li>`).join("");
  return `<!doctype html><html lang="es"><body style="margin:0;background:#EDE3CF;font-family:Georgia,'Times New Roman',serif;color:#2F3A36">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE3CF;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F3EBDA;border:1px solid #C4B28F;border-radius:10px">
<tr><td style="background:#7E5236;border-radius:10px 10px 0 0;padding:22px 28px;color:#FAF4E6">
  <div style="font-size:30px;letter-spacing:4px">ARC<span style="color:#E1BA78;font-style:italic">A</span></div>
  <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85">Agencia de Reubicación de Capacidades Humanas</div>
</td></tr>
<tr><td style="background:#D2A762;padding:10px 28px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#5F3D27">${esc(d.cubierta)}</td></tr>
<tr><td style="padding:26px 28px 8px;font-size:17px;line-height:1.55">
  <p style="margin:0 0 14px">${hola}</p>
  <p style="margin:0 0 14px">Tu entrevista de embarque quedó sellada. Este es tu pase de abordaje: va adjunto para que lo guardes o lo compartas.</p>
  <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#665F50">Perfil asignado · Folio ${esc(d.folio)}</p>
  <p style="margin:0 0 4px;font-size:30px;color:#7E5236">${esc(d.perfil)}</p>
  <p style="margin:0 0 18px;font-style:italic;color:#4D6A5B">${esc(d.lead)}</p>
  <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px">Imaginación <b>${d.imaginacion}%</b> &nbsp;·&nbsp; Recursos <b>${d.recursos}%</b></p>
  <p style="margin:18px 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#665F50">Equipaje recomendado</p>
  <ul style="margin:0 0 20px;padding-left:20px;font-size:17px">${equipaje}</ul>
  <p style="margin:0 0 24px"><a href="${esc(d.url)}" style="display:inline-block;background:#4D6A5B;color:#FAF4E6;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;padding:14px 22px;border-radius:6px">Ver y compartir mi pase</a></p>
  <p style="margin:0 0 14px">En los próximos días Futurable te escribirá con ideas concretas para tu cubierta. Antes del diluvio, aborda.</p>
</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px dashed #C4B28F;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#665F50">
  ARCA es una ficción de diseño de <a href="https://futurable.now" style="color:#2F3A36">Futurable</a>, un estudio de imaginación constructiva.<br>
  <a href="https://futurable.work/arca/" style="color:#2F3A36">futurable.work/arca</a> · <a href="https://futurable.now" style="color:#2F3A36">futurable.now</a><br>
  Recibes este correo porque lo pediste al terminar tu entrevista en ARCA.
</td></tr></table></td></tr></table></body></html>`;
}

function texto(d) {
  return [
    d.nombre ? `Hola, ${d.nombre}:` : "Hola, pasajero:",
    "",
    "Tu entrevista de embarque quedó sellada. Tu pase de abordaje va adjunto.",
    `Perfil: ${d.perfil} (folio ${d.folio}) — ${d.lead}`,
    `${d.cubierta} · Imaginación ${d.imaginacion}% · Recursos ${d.recursos}%`,
    `Equipaje recomendado: ${d.equipaje.join(", ")}`,
    "",
    `Ver y compartir tu pase: ${d.url}`,
    "",
    "ARCA es una ficción de diseño de Futurable · futurable.now",
  ].join("\n");
}

async function conBrevo(key, from, d, html, txt, archivo) {
  const body = {
    sender: { email: from.email, name: from.name },
    to: [{ email: d.email, ...(d.nombre ? { name: d.nombre } : {}) }],
    subject: `Tu pase de abordaje ARCA · ${d.perfil}`,
    htmlContent: html, textContent: txt,
    attachment: [{ name: archivo, content: d.imagen }],
    tags: ["arca", "pase"],
  };
  if (process.env.ARCA_REPLY_TO) body.replyTo = { email: process.env.ARCA_REPLY_TO };
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, detail: r.ok ? "" : await r.text() };
}

async function conResend(key, from, d, html, txt, archivo) {
  const body = {
    from: `${from.name} <${from.email}>`, to: [d.email],
    subject: `Tu pase de abordaje ARCA · ${d.perfil}`,
    html, text: txt, attachments: [{ filename: archivo, content: d.imagen }],
  };
  if (process.env.ARCA_REPLY_TO) body.reply_to = process.env.ARCA_REPLY_TO;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, detail: r.ok ? "" : await r.text() };
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  let raw;
  try { raw = await req.json(); } catch { return json(400, { error: "json" }); }

  const d = {
    email: clip(raw.email, 254).trim(),
    nombre: clip(raw.nombre, 24).trim(),
    folio: clip(raw.folio, 16),
    perfil: clip(raw.perfil, 40),
    lead: clip(raw.lead, 120),
    cubierta: clip(raw.cubierta, 60),
    imaginacion: Math.max(0, Math.min(100, Number(raw.imaginacion) || 0)),
    recursos: Math.max(0, Math.min(100, Number(raw.recursos) || 0)),
    equipaje: (Array.isArray(raw.equipaje) ? raw.equipaje : []).slice(0, 3).map((e) => clip(e, 60)),
    url: clip(raw.url, 800),
    imagen: typeof raw.imagen === "string" ? raw.imagen : "",
  };
  if (!EMAIL_RE.test(d.email)) return json(400, { error: "email" });
  if (!/^https:\/\/((arca\.)?futurable\.work|([a-z0-9-]+--)?arca-futurable\.netlify\.app)\//.test(d.url)) d.url = "https://futurable.work/arca/";
  if (!d.imagen || d.imagen.length > MAX_IMG || !/^[A-Za-z0-9+/=]+$/.test(d.imagen)) return json(400, { error: "imagen" });

  const fromEmail = process.env.ARCA_FROM_EMAIL;
  const from = { email: fromEmail, name: process.env.ARCA_FROM_NAME || "ARCA · Futurable" };
  const brevo = process.env.BREVO_API_KEY, resend = process.env.RESEND_API_KEY;
  if (!fromEmail || (!brevo && !resend)) return json(503, { error: "no-configurado" });

  const archivo = `pase-arca-${(d.folio || "pasajero").toLowerCase().replace(/[^a-z0-9-]/g, "")}.jpg`;
  const html = plantilla(d), txt = texto(d);
  try {
    const r = brevo ? await conBrevo(brevo, from, d, html, txt, archivo) : await conResend(resend, from, d, html, txt, archivo);
    if (!r.ok) { console.error("envio-fallido", r.status, r.detail.slice(0, 300)); return json(502, { error: "proveedor" }); }
    return json(200, { ok: true });
  } catch (e) {
    console.error("envio-error", e);
    return json(502, { error: "red" });
  }
};

