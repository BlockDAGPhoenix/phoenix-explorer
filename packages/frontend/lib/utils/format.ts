/**
 * Format utilities for displaying blockchain data
 */

export function formatAddress(address: string, length: number = 8): string {
  if (!address || !address.startsWith('0x')) {
    return address;
  }
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function formatHash(hash: string, length: number = 8): string {
  if (!hash || !hash.startsWith('0x')) {
    return hash;
  }
  return `${hash.slice(0, length + 2)}...${hash.slice(-length)}`;
}

export function formatNumber(value: bigint | string | number): string {
  const num = typeof value === 'bigint' ? value : BigInt(value.toString());
  return num.toLocaleString('en-US');
}

export function formatWeiToEther(wei: bigint | string): string {
  const weiBigInt = typeof wei === 'bigint' ? wei : BigInt(wei.toString());
  const ether = Number(weiBigInt) / 1e18;
  return ether.toFixed(6).replace(/\.?0+$/, '');
}

export function formatTimestamp(timestamp: bigint | string | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(timestamp: bigint | string | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  const now = Date.now();
  const diff = now - ts;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatGasPrice(gasPrice: bigint | string | undefined): string {
  if (!gasPrice) return 'N/A';
  const gwei = Number(BigInt(gasPrice.toString())) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

export function formatGasUsed(gasUsed: bigint | string | undefined, gasLimit: bigint | string): string {
  if (!gasUsed) return 'N/A';
  const used = Number(BigInt(gasUsed.toString()));
  const limit = Number(BigInt(gasLimit.toString()));
  const percentage = ((used / limit) * 100).toFixed(2);
  return `${formatNumber(used)} (${percentage}%)`;
}

