export const getHostname = () => 'http://localhost/easyway_yt/';
// export const getHostname = () => 'https://ytbook.in/';
export const getAssetUrl = (url) => getHostname() + url;
export const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function isDateString(val) {
    return typeof val === 'string' && !isNaN(Date.parse(val));
}

export const QUESTION_GROUPS = [
    { label: 'Previous Year', value: 'pyq', key: 'PYQ' },
    { label: 'Current Affairs', value: 'ca', key: 'CA' },
    { label: 'New Questions', value: 'npq', key: 'NPQ' },
    { label: 'Teacher Question', value: 'teacher_question', key: 'TQ' }
];
