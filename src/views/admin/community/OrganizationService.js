const API_URL = 'http://your-api-url/organizations';

export default {
    async getAll() {
        const response = await fetch(API_URL);
        return await response.json();
    },

    async get(id) {
        const response = await fetch(`${API_URL}/${id}`);
        return await response.json();
    },

    async create(organization) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(organization)
        });
        return await response.json();
    },

    async update(id, organization) {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(organization)
        });
        return await response.json();
    },

    async delete(id) {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
    }
};
