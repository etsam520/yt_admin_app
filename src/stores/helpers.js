export async function getUser() {
    try {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
        const user = localStorage.getItem('user');

        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
    }
}
