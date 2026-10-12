// Builds the booking notification email. Kept free of app imports so it can be tested on its own.

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

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function bookingRows(d: BookingDetails): [string, string][] {
  return [
    ["Name", d.name],
    ["Contact #", d.contact],
    ...(d.email ? [["Email", d.email] as [string, string]] : []),
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

export function buildBookingEmail(d: BookingDetails) {
  const rows = bookingRows(d);
  const subject = `New booking: ${d.car}, ${d.days} day${d.days > 1 ? "s" : ""}, ${d.destination} (${d.name})`;

  const text = [
    "New booking request from the AllDrive website",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Reply by calling or texting ${d.contact}.`,
  ].join("\n");

  const tel = d.contact.replace(/[^\d+]/g, "");
  const html = `<!doctype html>
<html><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#070c16">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#070c16;padding:22px 24px">
          <p style="margin:0;color:#27abff;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">New booking request</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:bold">${escapeHtml(d.car)}</p>
          <p style="margin:4px 0 0;color:#94a0b4;font-size:14px">${escapeHtml(d.destination)} · ${d.days} day${d.days > 1 ? "s" : ""} · ${escapeHtml(d.service)}</p>
        </td></tr>
        <tr><td style="padding:8px 24px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
            ${rows
              .map(
                ([k, v]) => `<tr>
              <td style="padding:10px 12px 10px 0;border-bottom:1px solid #e2e8f0;color:#5d6879;width:42%;vertical-align:top">${escapeHtml(k)}</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:bold;vertical-align:top">${escapeHtml(v).replace(/\n/g, "<br>")}</td>
            </tr>`,
              )
              .join("")}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px 24px">
          <a href="tel:${escapeHtml(tel)}" style="display:inline-block;background:#27abff;color:#070c16;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:10px">Call ${escapeHtml(d.name)}</a>
          <a href="sms:${escapeHtml(tel)}" style="display:inline-block;margin-left:8px;background:#070c16;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:10px">Text</a>
        </td></tr>
      </table>
      <p style="margin:12px 0 0;color:#94a0b4;font-size:12px">Sent from the booking form on the AllDrive Rent a Car Butuan website.</p>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

/** "We received your booking" email for customers who left an email address. */
export function buildCustomerEmail(d: BookingDetails, callNumber: string) {
  const firstName = d.name.split(/\s+/)[0];
  const rows = bookingRows(d).filter(([k]) => k !== "Rate zone");
  const subject = `We received your booking: ${d.car}, ${d.dateTime}`;
  const intro = `Hi ${firstName}, thank you for booking with AllDrive Rent a Car Butuan. We received your request and will contact you at ${d.contact} soon to confirm availability and the final rate.`;

  const text = [intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Questions? Call or text us at ${callNumber}. We're open 24 hours.`].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#070c16">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#070c16;padding:22px 24px">
          <p style="margin:0;color:#27abff;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Booking received</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:bold">${escapeHtml(d.car)}</p>
          <p style="margin:4px 0 0;color:#94a0b4;font-size:14px">${escapeHtml(d.dateTime)} · ${d.days} day${d.days > 1 ? "s" : ""} · ${escapeHtml(d.service)}</p>
        </td></tr>
        <tr><td style="padding:20px 24px 4px;font-size:15px;line-height:1.5">${escapeHtml(intro)}</td></tr>
        <tr><td style="padding:8px 24px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
            ${rows
              .map(
                ([k, v]) => `<tr>
              <td style="padding:10px 12px 10px 0;border-bottom:1px solid #e2e8f0;color:#5d6879;width:42%;vertical-align:top">${escapeHtml(k)}</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:bold;vertical-align:top">${escapeHtml(v).replace(/\n/g, "<br>")}</td>
            </tr>`,
              )
              .join("")}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;font-size:14px;color:#5d6879">
          Questions? Call or text us at <a href="tel:${escapeHtml(callNumber.replace(/\s/g, ""))}" style="color:#070c16;font-weight:bold">${escapeHtml(callNumber)}</a>. We're open 24 hours.
        </td></tr>
      </table>
      <p style="margin:12px 0 0;color:#94a0b4;font-size:12px">AllDrive Rent a Car Butuan</p>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}
