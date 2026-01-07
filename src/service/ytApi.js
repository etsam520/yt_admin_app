import apiService from './apiService';

// async loadSubjects() {
//             try {
//                 const response = await apiClient.get('/admin/category-by-depth-index', {
//                     params: { depth_index: 'subject' }
//                 });
//                 this.subjects = response.data.data.map((subject) => ({
//                     ...subject,
//                     has_chapters: subject.children && subject.children.length > 0
//                 }));
//             } catch (error) {
//                 this.showError('Failed to load subjects', error);
//             }
//         },
