export default function formattedAddress(address: string, variant: 'default' | 'compact' = 'default'): string {
    if (address.length <= 10) return address;
        
    if (variant === 'compact') {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
        
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
}