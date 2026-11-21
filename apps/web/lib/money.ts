const formatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
/** API monetary amounts are integer Iranian rials. Display only; Go computes totals. */
export const toman = (rial: number) => formatter.format(rial / 10);
export const number = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const orderStatus: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  cancelled: "لغوشده",
  expired: "مهلت تمام‌شده",
};
