// Builds the booking emails (team notification and customer confirmation).
// Kept free of app imports so it can be tested on its own.

export type BookingDetails = {
  name: string;
  contact: string;
  /** Optional; empty when the customer left it blank. */
  email: string;
  address: string;
  work: string;
  destination: string;
  zone: string;
  specificPlace: string;
  dateTime: string;
  car: string;
  days: number;
  service: string;
  yearsDriving: string;
  purpose: string;
  estimate: string;
};

/** Server-side extras that only the emails show. */
export type BookingMeta = {
  /** Short booking reference, e.g. "AD-1013-7K2Q". */
  reference: string;
  /** When the booking came in, Philippine time. */
  receivedAt: string;
  /** Pickup + number of days. */
  returnDateTime: string;
};

/** AllDrive's own contact details, passed in so this file stays free of app imports. */
export type BusinessContact = {
  name: string;
  phones: readonly { network: string; display: string; href: string }[];
  whatsappNumber: string;
  messenger: string;
  address: string;
  directionsUrl: string;
};

export function bookingRows(d: BookingDetails): [string, string][] {
  return [
    ["Name", d.name],
    ["Contact #", d.contact],
    ["Email", d.email || "Not provided"],
    ["Address", d.address],
    ["Work Place / Business", d.work],
    ["Destination", d.specificPlace ? `${d.destination} (${d.specificPlace})` : d.destination],
    ["Rate zone", d.zone],
    ["Date & Time of Rental", d.dateTime],
    ["Preferred Car", d.car],
    ["# of Day(s) Rental", String(d.days)],
    ["Service", d.service],
    ["Length of Years in Driving", d.yearsDriving],
    ["Purpose", d.purpose],
    ["Estimated total", d.estimate],
  ];
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** "0945 857 2321" -> "+639458572321", so call and text links work from any phone and email app. */
export function phoneLink(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  if (/^9\d{9}$/.test(digits)) return `+63${digits}`;
  return value.trim().startsWith("+") ? `+${digits}` : digits;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
const destinationText = (d: BookingDetails) => (d.specificPlace ? `${d.destination} (${d.specificPlace})` : d.destination);

// ---------- Email building blocks (tables and inline styles, so Gmail and Outlook show them the same) ----------

const C = { ink: "#070c16", brand: "#27abff", muted: "#5d6879", soft: "#94a0b4", line: "#e2e8f0", bg: "#f3f6fa", green: "#16a34a" };

function page(preheader: string, body: string, footer: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
        ${body}
      </table>
      <p style="margin:14px 0 0;color:${C.soft};font-size:12px;line-height:1.5">${footer}</p>
    </td></tr>
  </table>
</body></html>`;
}

function header(eyebrow: string, title: string, subtitle: string, reference: string) {
  return `<tr><td style="background:${C.ink};padding:24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="color:${C.brand};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">${escapeHtml(eyebrow)}</td>
    <td align="right" style="color:${C.soft};font-size:12px;white-space:nowrap">Ref <b style="color:#ffffff">${escapeHtml(reference)}</b></td>
  </tr></table>
  <p style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:bold">${escapeHtml(title)}</p>
  <p style="margin:6px 0 0;color:${C.soft};font-size:14px;line-height:1.5">${escapeHtml(subtitle)}</p>
</td></tr>`;
}

function estimateBox(estimate: string, note: string) {
  return `<tr><td style="padding:20px 24px 4px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef8ff;border:1px solid #cdeaff;border-radius:12px">
    <tr><td style="padding:14px 16px">
      <p style="margin:0;color:${C.muted};font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Estimated total</p>
      <p style="margin:4px 0 0;color:${C.ink};font-size:22px;font-weight:bold">${escapeHtml(estimate)}</p>
      <p style="margin:4px 0 0;color:${C.muted};font-size:12px;line-height:1.5">${escapeHtml(note)}</p>
    </td></tr>
  </table>
</td></tr>`;
}

type Action = { label: string; href: string; bg: string; fg: string };

/** Buttons two per row, so they stay big enough to tap on a phone. */
function actions(items: Action[]) {
  const cell = (a: Action) =>
    `<td width="50%" style="padding:4px"><a href="${escapeHtml(a.href)}" style="display:block;background:${a.bg};color:${a.fg};border:1px solid ${
      a.bg === "#ffffff" ? C.line : a.bg
    };text-decoration:none;font-size:14px;font-weight:bold;text-align:center;padding:12px 8px;border-radius:10px">${escapeHtml(a.label)}</a></td>`;
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(`<tr>${cell(items[i])}${items[i + 1] ? cell(items[i + 1]) : '<td width="50%"></td>'}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
}

function section(title: string, rows: [string, string, string?][]) {
  return `<tr><td style="padding:20px 24px 0">
  <p style="margin:0 0 4px;color:${C.brand};font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(title)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.45">
    ${rows
      .map(
        ([k, v, href]) => `<tr>
      <td style="padding:9px 12px 9px 0;border-bottom:1px solid ${C.line};color:${C.muted};width:38%;vertical-align:top">${escapeHtml(k)}</td>
      <td style="padding:9px 0;border-bottom:1px solid ${C.line};font-weight:bold;vertical-align:top;word-break:break-word">${
        href ? `<a href="${escapeHtml(href)}" style="color:${C.ink}">${escapeHtml(v)}</a>` : escapeHtml(v).replace(/\n/g, "<br>")
      }</td>
    </tr>`,
      )
      .join("")}
  </table>
</td></tr>`;
}

const textBlock = (html: string, style = "") =>
  `<tr><td style="padding:20px 24px 0;font-size:15px;line-height:1.6;color:${C.ink};${style}">${html}</td></tr>`;

const plainSection = (title: string, rows: [string, string, string?][]) =>
  [title.toUpperCase(), ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");

// ---------- Team notification ----------

export function buildBookingEmail(d: BookingDetails, meta: BookingMeta, business: BusinessContact) {
  const firstName = d.name.split(/\s+/)[0];
  const tel = phoneLink(d.contact);
  const reply = `Hi ${firstName}, this is ${business.name} about your booking ${meta.reference}: ${d.car}, ${d.dateTime}, ${plural(d.days, "day")}. `;

  const subject = `New booking ${meta.reference}: ${d.car}, ${d.dateTime} (${d.name})`;

  const customer: [string, string, string?][] = [
    ["Name", d.name],
    ["Contact #", d.contact, `tel:${tel}`],
    ["Email", d.email || "Not provided", d.email ? `mailto:${d.email}` : undefined],
    ["Address", d.address],
    ["Work Place / Business", d.work],
  ];
  const trip: [string, string, string?][] = [
    ["Pickup", d.dateTime],
    ["Return", meta.returnDateTime],
    ["Duration", plural(d.days, "day")],
    ["Destination", destinationText(d)],
    ["Rate zone", d.zone],
    ["Service", d.service],
    ["Years of driving", d.yearsDriving],
    ["Purpose", d.purpose],
  ];
  const car: [string, string, string?][] = [
    ["Preferred car", d.car],
    ["Estimated total", d.estimate],
  ];

  const buttons: Action[] = [
    { label: `Call ${firstName}`, href: `tel:${tel}`, bg: C.brand, fg: C.ink },
    { label: "Send a text", href: `sms:${tel}?&body=${encodeURIComponent(reply)}`, bg: C.ink, fg: "#ffffff" },
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?phone=${tel.replace(/\D/g, "")}&text=${encodeURIComponent(reply)}`,
      bg: "#25d366",
      fg: "#ffffff",
    },
    ...(d.email
      ? [
          {
            label: "Reply by email",
            href: `mailto:${d.email}?subject=${encodeURIComponent(`Your AllDrive booking ${meta.reference}`)}&body=${encodeURIComponent(reply)}`,
            bg: "#ffffff",
            fg: C.ink,
          },
        ]
      : []),
  ];

  const text = [
    `NEW BOOKING REQUEST ${meta.reference}`,
    `Received ${meta.receivedAt} from the website booking form.`,
    "",
    `Call or text: ${tel}`,
    ...(d.email ? [`Email: ${d.email} (reply to this email to answer the customer)`] : []),
    "",
    plainSection("Customer", customer),
    "",
    plainSection("Trip", trip),
    "",
    plainSection("Car & price", car),
  ].join("\n");

  const html = page(
    `${d.name} · ${d.contact} · ${d.dateTime} · ${d.estimate}`,
    [
      header("New booking request", d.car, `${d.dateTime} · ${plural(d.days, "day")} · ${d.service} · ${destinationText(d)}`, meta.reference),
      estimateBox(d.estimate, `Received ${meta.receivedAt}. Confirm availability and the final rate with the customer.`),
      `<tr><td style="padding:16px 20px 0">
        <p style="margin:0 4px 6px;color:${C.muted};font-size:13px">Contact ${escapeHtml(firstName)} at <a href="tel:${escapeHtml(tel)}" style="color:${C.ink};font-weight:bold">${escapeHtml(d.contact)}</a> (text and WhatsApp open with a reply ready):</p>
        ${actions(buttons)}
      </td></tr>`,
      section("Customer", customer),
      section("Trip", trip),
      section("Car & price", car),
      textBlock(
        d.email
          ? `Hit <b>Reply</b> to answer ${escapeHtml(firstName)} by email. A confirmation email with these details was also sent to ${escapeHtml(firstName)}.`
          : `${escapeHtml(firstName)} didn't leave an email, so call or text to confirm.`,
        `padding-bottom:24px;font-size:13px;color:${C.muted}`,
      ),
    ].join(""),
    `Sent from the booking form on the ${escapeHtml(business.name)} website.`,
  );

  return { subject, text, html };
}

// ---------- Customer confirmation ----------

export function buildCustomerEmail(d: BookingDetails, meta: BookingMeta, business: BusinessContact) {
  const firstName = d.name.split(/\s+/)[0];
  const subject = `Booking received (${meta.reference}): ${d.car}, ${d.dateTime}`;
  const chat = `Hi ${business.name}! About my booking ${meta.reference} (${d.car}, ${d.dateTime}): `;
  const estimateNote = "Estimate only. Final rate confirmed upon booking. Holidays and peak seasons may vary.";

  const trip: [string, string, string?][] = [
    ["Car", d.car],
    ["Pickup", d.dateTime],
    ["Return", meta.returnDateTime],
    ["Duration", plural(d.days, "day")],
    ["Destination", destinationText(d)],
    ["Service", d.service],
    ["Purpose", d.purpose],
  ];
  const you: [string, string, string?][] = [
    ["Name", d.name],
    ["Contact #", d.contact],
    ["Email", d.email],
    ["Address", d.address],
    ["Work Place / Business", d.work],
    ...(d.service === "Self-drive" ? [["Years of driving", d.yearsDriving] as [string, string]] : []),
  ];

  const buttons: Action[] = [
    ...business.phones.map((p) => ({ label: `Call ${p.network} ${p.display}`, href: `tel:${phoneLink(p.href)}`, bg: C.brand, fg: C.ink })),
    {
      label: "WhatsApp us",
      href: `https://api.whatsapp.com/send?phone=${business.whatsappNumber}&text=${encodeURIComponent(chat)}`,
      bg: "#25d366",
      fg: "#ffffff",
    },
    { label: "Messenger", href: business.messenger, bg: "#0a7cff", fg: "#ffffff" },
  ];

  const text = [
    `Hi ${firstName},`,
    "",
    `Thank you for booking with ${business.name}. We received your request (reference ${meta.reference}) and will contact you at ${d.contact} to confirm availability and the final rate.`,
    `Once your car is confirmed, you'll get a "Booking Confirmed" message with your pickup day and time.`,
    "",
    plainSection("Your trip", trip),
    `Estimated total: ${d.estimate}`,
    estimateNote,
    "",
    plainSection("Your details", you),
    "",
    "Need to change something? Reply to this email, or contact us:",
    ...business.phones.map((p) => `Call/text ${p.network}: ${p.display}`),
    `WhatsApp: https://api.whatsapp.com/send?phone=${business.whatsappNumber}`,
    `Messenger: ${business.messenger}`,
    `Visit: ${business.address}`,
  ].join("\n");

  const html = page(
    `We received your booking ${meta.reference}. We'll call or text ${d.contact} to confirm.`,
    [
      header("Booking request received", d.car, `${d.dateTime} · ${plural(d.days, "day")} · ${d.service}`, meta.reference),
      textBlock(
        `Hi ${escapeHtml(firstName)},<br>Thank you for booking with ${escapeHtml(business.name)}! We received your request and will contact you at <b>${escapeHtml(d.contact)}</b> soon to confirm availability and the final rate.<br><br>Once your car is confirmed, you'll get a <b>Booking Confirmed</b> message with your pickup day and time.`,
      ),
      estimateBox(d.estimate, estimateNote),
      section("Your trip", trip),
      section("Your details", you),
      `<tr><td style="padding:24px 20px 0">
        <p style="margin:0 4px 8px;font-size:15px;font-weight:bold">Questions or changes? Reply to this email or reach us here:</p>
        ${actions(buttons)}
      </td></tr>`,
      textBlock(
        `<b>Visit us:</b> ${escapeHtml(business.address)} &middot; <a href="${escapeHtml(business.directionsUrl)}" style="color:${C.ink}">Get directions</a>`,
        `padding-bottom:24px;font-size:13px;color:${C.muted}`,
      ),
    ].join(""),
    `You're getting this email because you booked a car on the ${escapeHtml(business.name)} website.`,
  );

  return { subject, text, html };
}
