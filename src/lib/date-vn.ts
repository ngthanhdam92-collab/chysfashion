/**
 * Date helpers that always operate in Vietnam timezone (UTC+7).
 * Use these on the server — never rely on `new Date().getDate()` etc.
 * which returns UTC values and will be off before 07:00 VN time.
 */

const TZ = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" in Vietnam timezone */
export function todayStrVN(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "YYYY-MM-DD" for any Date, interpreted in Vietnam timezone */
export function dayKeyVN(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "YYYY-MM" for any Date, interpreted in Vietnam timezone */
export function monthKeyVN(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 7);
}

/**
 * Returns a Date object pointing to midnight of `date` in Vietnam timezone.
 * e.g. 2026-07-13 00:00:00 +07:00 → 2026-07-12 17:00:00 UTC
 */
export function startOfDayVN(date?: Date): Date {
  const ymd = (date ?? new Date()).toLocaleDateString("en-CA", { timeZone: TZ });
  return new Date(ymd + "T00:00:00+07:00");
}
