/**
 * aiUsage.js — per-IST-day call counter (whole backend + per admin user). In memory: a restart resets it, which is
 * fine as a cost/abuse guard because Google's free tier also enforces its own per-project daily quota (429).
 */
const istDay = (d) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);

export function createUsageCounter({ now = () => new Date() } = {}) {
  let day = null;
  let total = 0;
  let perUser = new Map();
  const roll = () => {
    const d = istDay(now());
    if (d !== day) { day = d; total = 0; perUser = new Map(); }
  };
  return {
    /** Reserve one call. → { ok: true } | { ok: false, scope: "day" | "user" } */
    take(user, { dailyLimit, userDailyLimit }) {
      roll();
      const u = perUser.get(user) || 0;
      if (total >= dailyLimit) return { ok: false, scope: "day" };
      if (u >= userDailyLimit) return { ok: false, scope: "user" };
      total += 1;
      perUser.set(user, u + 1);
      return { ok: true };
    },
    /** Give a reserved call back (the request never reached Google, e.g. no key). */
    refund(user) {
      roll();
      total = Math.max(0, total - 1);
      perUser.set(user, Math.max(0, (perUser.get(user) || 1) - 1));
    },
    stats(user) {
      roll();
      return { day, usedToday: total, usedByYouToday: perUser.get(user) || 0 };
    },
  };
}
