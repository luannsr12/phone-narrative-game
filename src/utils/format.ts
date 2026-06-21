/** Small presentation helpers shared across the phone UI. */

let idCounter = 0;
/** Monotonic, collision-free runtime id (avoids Math.random in render paths). */
export function uid(prefix = 'e'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/** "14:07" style clock from a timestamp. */
export function clock(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/** "10/06 14:07" style stamp for evidence/timeline metadata. */
export function stamp(ts: number): string {
  const d = new Date(ts);
  const dd = d.getDate().toString().padStart(2, '0');
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mo} ${clock(ts)}`;
}

/** "0:42" style duration from seconds. */
export function duration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** First-name presentation for contact lists. */
export function firstName(full: string): string {
  return full.split(' ')[0];
}

/** "R$ 1.250" / "R$ 12,90" style currency — centavos only shown when present. */
export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const totalCents = Math.abs(Math.round(n * 100));
  const cents = totalCents % 100;
  const digits = Math.floor(totalCents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return cents
    ? `${sign}R$ ${digits},${cents.toString().padStart(2, '0')}`
    : `${sign}R$ ${digits}`;
}
