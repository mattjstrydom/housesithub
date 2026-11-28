import { esc } from "./lib/html.js";

const CSS = `
:root{--paper:#F0FAFD;--surface:#fff;--ink:#1D2A4D;--muted:#56627F;--accent:#D63F45;--accent-hover:#BC3238;--sage:#DDF1F7;--line:rgba(29,42,77,.12);--on-ink:#B9C3DD;
--font-display:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;--font-body:"Instrument Sans",ui-sans-serif,system-ui,sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.6 var(--font-body)}
a{color:#1E78AC}a:hover{color:var(--accent-hover)}
:focus-visible{outline:3px solid #1E78AC;outline-offset:3px;border-radius:6px}
h1,h2,h3{font-family:var(--font-display);line-height:1.15;margin:0 0 .5em;font-weight:700}
h1{font-size:clamp(28px,4.2vw,42px)}h2{font-size:clamp(22px,2.6vw,28px)}h3{font-size:19px}
.skip{position:absolute;left:-999px;top:8px;background:#fff;padding:8px 14px;border-radius:8px;z-index:9}.skip:focus{left:8px}
header.top{background:var(--ink);color:#fff}
header.top .in{max-width:1100px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{font-family:var(--font-display);font-weight:800;font-size:20px;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px}
.brand svg{width:22px;height:22px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
nav.top{display:flex;gap:18px;align-items:center;font-size:15px}
nav.top a{color:var(--on-ink);text-decoration:none}nav.top a:hover,nav.top a[aria-current]{color:#fff}
nav.top form{margin:0}
main{max-width:1100px;margin:0 auto;padding:36px 20px 72px}
.narrow{max-width:520px}
.card{background:var(--surface);border-radius:18px;padding:24px;box-shadow:0 2px 12px rgba(29,42,77,.08)}
.btn{display:inline-block;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:13px 24px;font:700 16px var(--font-body);text-decoration:none;cursor:pointer;min-height:48px}
.btn:hover{background:var(--accent-hover);color:#fff}
.btn.ghost{background:transparent;color:var(--ink);border:2px solid var(--ink)}.btn.ghost:hover{background:var(--ink);color:#fff}
.btn.small{padding:9px 16px;font-size:15px;min-height:40px}
label{display:block;font-weight:600;margin-bottom:6px}
input[type=email]{width:100%;font:inherit;padding:12px 14px;border:2px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);margin-bottom:16px}
.muted{color:var(--muted)}.note{background:var(--sage);border-radius:12px;padding:14px 16px}
.bar{height:12px;background:#fff;border-radius:99px;overflow:hidden;border:1px solid var(--line)}.bar>span{display:block;height:100%;background:var(--accent)}
.module{margin-top:28px}.module h2{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.module h2 small{font:500 15px var(--font-body);color:var(--muted)}
ul.lessons{list-style:none;margin:0;padding:0;display:grid;gap:10px}
ul.lessons a{display:flex;gap:14px;align-items:center;background:#fff;border-radius:14px;padding:14px 18px;text-decoration:none;color:var(--ink);box-shadow:0 1px 6px rgba(29,42,77,.07)}
ul.lessons a:hover{box-shadow:0 2px 12px rgba(29,42,77,.16)}
.tick{flex:none;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;color:#fff;font-size:15px}
.tick.on{background:var(--accent);border-color:var(--accent)}
.len{margin-left:auto;color:var(--muted);font-size:14px;white-space:nowrap}
.video{position:relative;aspect-ratio:16/9;background:var(--ink);border-radius:18px;overflow:hidden}
.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.video .soon{position:absolute;inset:0;display:grid;place-items:center;color:var(--on-ink);text-align:center;padding:24px}
.crumbs{font-size:15px;color:var(--muted);margin-bottom:10px}.crumbs a{color:var(--muted)}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:22px 0}.row .push{margin-left:auto}
details.transcript{background:#fff;border-radius:18px;padding:6px 24px;box-shadow:0 2px 12px rgba(29,42,77,.08)}
details.transcript summary{cursor:pointer;font:700 19px var(--font-display);padding:16px 0}
details.transcript p{max-width:68ch}
table.files{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}
table.files td{padding:12px 16px;border-top:1px solid var(--line)}table.files tr:first-child td{border-top:0}
@media (prefers-reduced-motion:no-preference){.btn,ul.lessons a{transition:background .15s,box-shadow .15s}}
`;

const PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>`;

export function layout({ title, body, user, current }) {
  const nav = user
    ? `<nav class="top" aria-label="Course"><a href="/course"${current === "course" ? ' aria-current="page"' : ""}>Lessons</a><a href="/course/downloads"${current === "downloads" ? ' aria-current="page"' : ""}>Downloads</a><form method="post" action="/api/logout"><button class="btn ghost small" style="color:#fff;border-color:#fff">Log out</button></form></nav>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Learn How to House Sit</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#1D2A4D">
<link rel="icon" href="/assets/images/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="in"><a class="brand" href="/course">${PLANE}House Sit Hub</a>${nav}</div></header>
<main id="main">${body}</main></body></html>`;
}

export function loginPage({ message, email } = {}) {
  return layout({
    title: "Log in",
    body: `<div class="narrow"><h1>Log in to your course</h1>
<p class="muted">Enter the email you used to buy the course and we'll send you a login link. No password needed.</p>
${message ? `<p class="note" role="status">${esc(message)}</p>` : ""}
<form class="card" method="post" action="/api/login"><label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email" required value="${esc(email || "")}">
<button class="btn" type="submit">Email me a login link</button></form></div>`,
  });
}

export function confirmPage(token) {
  return layout({
    title: "Confirm login",
    body: `<div class="narrow"><h1>Welcome back</h1><p class="muted">Press the button to log in on this device.</p>
<form class="card" method="post" action="/auth/verify"><input type="hidden" name="token" value="${esc(token)}">
<button class="btn" type="submit">Log in</button></form></div>`,
  });
}

export function invalidLinkPage() {
  return layout({
    title: "Link expired",
    body: `<div class="narrow"><h1>That link has expired</h1><p>Login links work once and expire after 15 minutes. You can get a new one in a few seconds.</p><p><a class="btn" href="/login">Get a new link</a></p></div>`,
  });
}

export function dashboardPage({ user, course, done }) {
  const all = course.modules.flatMap((m) => m.lessons);
  const pct = all.length ? Math.round((all.filter((l) => done.has(l.id)).length / all.length) * 100) : 0;
  const next = all.find((l) => !done.has(l.id));
  const mods = course.modules
    .map((m) => {
      const c = m.lessons.filter((l) => done.has(l.id)).length;
      return `<section class="module" aria-labelledby="${m.id}"><h2 id="${m.id}">Module ${m.n}: ${esc(m.title)} <small>${c} of ${m.lessons.length} complete</small></h2><ul class="lessons">${m.lessons
        .map(
          (l) =>
            `<li><a href="/course/${m.id}/${l.slug}"><span class="tick${done.has(l.id) ? " on" : ""}" aria-hidden="true">${done.has(l.id) ? "&#10003;" : ""}</span><span>${l.n}. ${esc(l.title)}${done.has(l.id) ? '<span class="sr" style="position:absolute;left:-999px"> (complete)</span>' : ""}</span><span class="len">${l.minutes} min</span></a></li>`,
        )
        .join("")}</ul></section>`;
    })
    .join("");
  return layout({
    user,
    current: "course",
    title: "Your course",
    body: `<h1>Learn How to House Sit</h1>
<div class="card"><p style="margin-top:0"><strong>${pct}% complete</strong> <span class="muted">(${all.filter((l) => done.has(l.id)).length} of ${all.length} lessons)</span></p>
<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Course progress"><span style="width:${pct}%"></span></div>
<p style="margin-bottom:0">${next ? `<a class="btn" href="/course/${next.mod}/${next.slug}">${done.size ? "Continue" : "Start"}: ${esc(next.title)}</a>` : "You've finished every lesson. Well done!"}</p></div>
<p><a href="/course/downloads">Workbook and checklists</a></p>${mods}`,
  });
}

export function lessonPage({ user, course, lesson, mod, done, wistiaId, prev, next }) {
  const isDone = done.has(lesson.id);
  const video = wistiaId
    ? `<div class="video"><iframe src="https://fast.wistia.net/embed/iframe/${encodeURIComponent(wistiaId)}?seo=false" title="${esc(lesson.title)}" allow="autoplay; fullscreen" allowfullscreen></iframe></div>`
    : `<div class="video"><div class="soon"><p>The video for this lesson is on its way.<br>You can read the full transcript below.</p></div></div>`;
  return layout({
    user,
    current: "course",
    title: lesson.title,
    body: `<p class="crumbs"><a href="/course">All lessons</a> / Module ${mod.n}: ${esc(mod.title)}</p>
<h1>${lesson.n}. ${esc(lesson.title)}</h1>${video}
<div class="row"><form method="post" action="/api/progress"><input type="hidden" name="lesson" value="${lesson.id}"><input type="hidden" name="done" value="${isDone ? "0" : "1"}">
<button class="btn${isDone ? " ghost" : ""}" type="submit">${isDone ? "&#10003; Completed (undo)" : "Mark as complete"}</button></form>
<a class="push" href="/course/downloads">Workbook and checklists</a></div>
<details class="transcript" open><summary>Transcript</summary>${lesson.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</details>
<div class="row">${prev ? `<a class="btn ghost" href="/course/${prev.mod}/${prev.slug}">&larr; ${esc(prev.title)}</a>` : ""}${next ? `<a class="btn push" href="/course/${next.mod}/${next.slug}">Next: ${esc(next.title)} &rarr;</a>` : ""}</div>`,
  });
}

export function downloadsPage({ user, files }) {
  const groups = [...new Set(files.map((f) => f.group))];
  return layout({
    user,
    current: "downloads",
    title: "Downloads",
    body: `<h1>Workbook and checklists</h1><p class="muted">PDFs you can print or fill in on screen.</p>${groups
      .map(
        (g) => `<h2>${esc(g)}</h2><table class="files"><tbody>${files
          .filter((f) => f.group === g)
          .map((f) => `<tr><td>${esc(f.title)}</td><td style="text-align:right"><a href="/course/files/${encodeURIComponent(f.key)}" download>Download PDF</a></td></tr>`)
          .join("")}</tbody></table>`,
      )
      .join("")}`,
  });
}

export function messagePage(title, text, status = 200) {
  return { html: layout({ title, body: `<div class="narrow"><h1>${esc(title)}</h1><p>${esc(text)}</p><p><a href="/login">Log in</a></p></div>` }), status };
}

export function noAccessPage() {
  return layout({
    title: "No access",
    body: `<div class="narrow"><h1>We can't find an active purchase</h1><p>This email doesn't have access to the course. If you think this is a mistake, reply to your purchase email and we'll sort it out.</p></div>`,
  });
}

// ---------- Admin ----------
const day = (s) => (s ? new Date(s * 1000).toISOString().slice(0, 10) : "never");
const ADMIN_CSS = `<style>table.files th{text-align:left;padding:12px 16px;background:var(--sage)}.scroll{overflow-x:auto}.inline{display:inline;margin:0}.inline input[type=email]{width:auto;min-width:260px;margin:0 8px 0 0}</style>`;
const accessLabel = (active, purchases) => (active ? "Active" : purchases ? "Revoked or refunded" : "None");
const grantForm = (email) => `<form class="inline" method="post" action="/api/admin/grant"><input type="hidden" name="email" value="${esc(email)}"><button class="btn small" type="submit">Grant access</button></form>`;
const revokeForm = (id) => `<form class="inline" method="post" action="/api/admin/revoke"><input type="hidden" name="user_id" value="${id}"><button class="btn ghost small" type="submit">Revoke</button></form>`;
const noteHtml = (note) => (note ? `<p class="note" role="status">${esc(note)}</p>` : "");

export function adminPage({ user, rows, total, note }) {
  const activeCount = rows.filter((r) => r.active).length;
  const body = `${ADMIN_CSS}<h1>Learners</h1>${noteHtml(note)}
<p class="muted">${rows.length} accounts, ${activeCount} with active access.</p>
<div class="card" style="margin-bottom:24px"><form method="post" action="/api/admin/grant"><label for="ge">Grant access to an email</label><input id="ge" type="email" name="email" required autocomplete="off">
<button class="btn small" type="submit">Grant access</button></form><p class="muted" style="margin-bottom:0">No email is sent. They log in at /login with that address.</p></div>
<div class="scroll"><table class="files"><thead><tr><th>Email</th><th>Access</th><th>Progress</th><th>Last seen</th><th>Joined</th><th></th></tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr><td><a href="/admin/user/${r.id}">${esc(r.email)}</a></td><td>${accessLabel(r.active, r.purchases)}</td><td>${r.done} of ${total}</td><td>${day(r.last_seen)}</td><td>${day(r.created_at)}</td><td style="text-align:right">${r.active ? revokeForm(r.id) : grantForm(r.email)}</td></tr>`,
    )
    .join("")}</tbody></table></div>`;
  return layout({ user, current: "admin", title: "Learners", body });
}

export function adminUserPage({ user, learner, course, purchases, progress, note }) {
  const active = purchases.some((p) => p.status === "active");
  const all = course.modules.flatMap((m) => m.lessons);
  const done = all.filter((l) => progress.get(l.id)?.completed_at).length;
  const state = (id) => {
    const p = progress.get(id);
    return p?.completed_at ? `Completed ${day(p.completed_at)}` : p ? `Viewed ${day(p.last_viewed_at)}` : "Not started";
  };
  const body = `${ADMIN_CSS}<p class="crumbs"><a href="/admin">All learners</a></p><h1>${esc(learner.email)}</h1>${noteHtml(note)}
<p>Access: <strong>${accessLabel(active, purchases.length)}</strong> &middot; ${done} of ${all.length} lessons complete &middot; joined ${day(learner.created_at)}</p>
<div class="row">${active ? revokeForm(learner.id) : grantForm(learner.email)}</div>
<h2>Purchases</h2>${purchases.length ? `<table class="files"><tbody>${purchases.map((p) => `<tr><td>${day(p.created_at)}</td><td>${esc(p.source)}</td><td>${esc(p.status)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">None.</p>`}
${course.modules
    .map(
      (m) =>
        `<h2>Module ${m.n}: ${esc(m.title)}</h2><table class="files"><tbody>${m.lessons.map((l) => `<tr><td>${l.n}. ${esc(l.title)}</td><td style="text-align:right">${state(l.id)}</td></tr>`).join("")}</tbody></table>`,
    )
    .join("")}`;
  return layout({ user, current: "admin", title: learner.email, body });
}
