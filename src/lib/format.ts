export const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", {
  style: "currency", currency, maximumFractionDigits: 0, notation: value >= 10000000 ? "compact" : "standard",
}).format(value);
export const number = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export const shortDate = (value: Date | string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
export const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
