export const ADMIN_WALLETS = [
    "0x7888798d682A14872b0F9E6A0203abA0F70f82a4", // Derived from your .env PRIVATE_KEY
];

export const isUserAdmin = (address: string | undefined): boolean => {
    if (!address) return false;
    return ADMIN_WALLETS.some(admin => admin.toLowerCase() === address.toLowerCase());
};
