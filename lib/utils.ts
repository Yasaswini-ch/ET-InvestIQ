export function formatCompactINR(value: number) {
  if (Math.abs(value) >= 10000000) {
    return `Rs${(value / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `Rs${(value / 100000).toFixed(1)}L`;
  }

  return `Rs${value.toLocaleString("en-IN")}`;
}

export function formatINR(value: number) {
  return `Rs${value.toLocaleString("en-IN")}`;
}
