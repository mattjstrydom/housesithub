import { esc } from "./html.js";

async function send(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error("Resend rejected the email: HTTP " + res.status);
}

const wrap = (inner) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1D2A4D;max-width:520px">${inner}</div>`;
const button = (url, label) =>
  `<p style="margin:24px 0"><a href="${esc(url)}" style="background:#D63F45;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block">${esc(label)}</a></p>`;

export function sendLoginLink(env, to, url) {
  return send(env, {
    to,
    subject: "Your login link for Learn How to House Sit",
    html: wrap(`<p>Here is your link to log in. It works once and expires in 15 minutes.</p>${button(url, "Log in to the course")}<p style="color:#56627F;font-size:14px">If you didn't ask for this, you can ignore this email.</p>`),
    text: `Here is your link to log in. It works once and expires in 15 minutes.\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
  });
}

export function sendWelcome(env, to, url) {
  return send(env, {
    to,
    subject: "You're in! Your access to Learn How to House Sit",
    html: wrap(`<p>Thank you for joining Learn How to House Sit. Your course is ready.</p>${button(url, "Start the course")}<p>This link works once and expires in 15 minutes. Any time after that, go to ${esc(env.SITE_ORIGIN)}/login and enter this email address to get a new one.</p>`),
    text: `Thank you for joining Learn How to House Sit. Your course is ready.\n\nStart the course: ${url}\n\nThis link works once and expires in 15 minutes. Any time after that, go to ${env.SITE_ORIGIN}/login and enter this email address to get a new one.`,
  });
}
