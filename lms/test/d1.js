// Minimal in-memory stand-in for Cloudflare D1, backed by Node's built-in SQLite, so the real SQL and
// migration are tested. Needs Node 22.13 or newer. No packages to install.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

export function makeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
  const stmt = (sql, args = []) => {
    const st = db.prepare(sql);
    const reader = /^\s*(select|with)\b/i.test(sql) || /\breturning\b/i.test(sql);
    return {
      bind: (...a) => stmt(sql, a),
      first: async () => {
        if (reader) return st.get(...args) ?? null;
        st.run(...args);
        return null;
      },
      all: async () => ({ results: reader ? st.all(...args) : [] }),
      run: async () => {
        if (reader) return { results: st.all(...args), meta: { changes: 0 } };
        return { meta: { changes: Number(st.run(...args).changes) } };
      },
    };
  };
  return { prepare: (sql) => stmt(sql), batch: async (list) => Promise.all(list.map((s) => s.run())), _raw: db };
}
