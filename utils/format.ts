export const formatCurrency = (amount: number, currency: string, options?: { minimumFractionDigits?: number }) => {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.minimumFractionDigits ?? 2,
  }).format(amount);
};

export const formatShortCurrency = (amount: number, currency: string) => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ${currency}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
};

export const maskAddress = (address: string, visible = 4) => {
  if (address.length <= visible * 2) return address;
  return `${address.slice(0, visible)}••••${address.slice(-visible)}`;
};
