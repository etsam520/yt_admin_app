import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Initialize auth store early if needed

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },

            children: [
                {
                    path: '',
                    name: 'dashboard1',
                    component: () => import('@/views/Dashboardcopy.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboardcopy.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/admin/profile/Profile.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings-demo',
                    name: 'settings-demo',
                    component: () => import('@/views/SettingsDemo.vue'),
                    meta: { requiresAuth: false }
                },
                {
                    path: '/profile/edit',
                    name: 'ProfileEdit',
                    component: () => import('@/views/admin/profile/ProfileEdit.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/admin/users/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/trade-groups',
                    name: 'trade-groups',
                    component: () => import('@/views/admin/tradeNodes/Nod.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path: 'categories',
                    name: 'categories',
                    component: () => import('@/views/admin/categories/QuestionCategories.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'build-subject',
                    name: 'SubjectBuilder',
                    component: () => import('@/views/admin/categoryBuilder/SubjectBuilder.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'build-chapter',
                    name: 'ChapterBuilder',
                    component: () => import('@/views/admin/categoryBuilder/ChapterBuilder.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'build-topic',
                    name: 'TopicBuilder',
                    component: () => import('@/views/admin/categoryBuilder/TopicBuilder.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path: '/q_questions',
                    name: 'q_questions',
                    component: () => import('@/views/admin/categories/QueQuestion.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/trade-groups-rearrange/:nodeId',
                    name: 'trade-groups-rearrange',
                    component: () => import('@/views/admin/tradeNodes/NodeRearrange.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/courses',
                    name: 'courses',
                    component: () => import('@/views/admin/course/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/graph',
                    name: 'graph',
                    component: () => import('@/views/admin/tradeNodes/trv/NodeGraph.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/courses/:id/:title',
                    name: 'directories',
                    component: () => import('@/views/admin/courseDirectory/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/orgaizations',
                    name: 'orgaizations',
                    component: () => import('@/views/admin/organisation/OrganisationList.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path: '/question-bank-pyq',
                    name: 'question-bank-pyq',
                    component: () => import('@/views/admin/questionbank_pyq/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/question-bank-npq',
                    name: 'question-bank-npq',
                    component: () => import('@/views/admin/questionbank_npq/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/question-bank-ca',
                    name: 'question-bank-ca',
                    component: () => import('@/views/admin/questionbank_currentaffairs/Index.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path : 'teacher-question-bank-npq',
                    name : 'teacher-question-bank-npq',
                    component : () => import('@/views/admin/questionbank_npq_teacher/Index.vue'),
                    meta: { requiresAuth: true }
                },
                // {
                //     path: '/question-set',
                //     name: 'question-set',
                //     component: () => import('@/views/admin/questionSet/SetTable.vue'),
                //     meta: { requiresAuth: true }
                // },

                {
                    path: '/question-set',
                    name: 'question-set',
                    component: () => import('@/views/admin/questionSet/FolderDashboard.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path: '/admin/pdf-maker',
                    name: 'pdf-maker',
                    component: () => import('@/views/admin/PdfMaker.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path: '/logout',
                    name: 'logout',
                    beforeEnter: (to, from, next) => {
                        const authStore = useAuthStore();
                        authStore.logout();
                        next({ name: 'login' });
                    },
                    meta: { requiresAuth: true }
                },

                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/digital-board/sets/:id',
            name: 'digital-board-sets',
            component: () => import('@/views/admin/digitalBoard/DisplaySet.vue')
        },
        {
            path: '/digital-board/excalidraw-demo',
            name: 'excalidraw-demo',
            component: () => import('@/views/admin/digitalBoard/ExcalidrawDemo.vue')
        },
        {
            path: '/digital-board/rboard',
            name: 'rboard',
            component: () => import('@/views/admin/digitalBoard/RealBoard/RBoardDemo.vue')
        },
        {
            path: '/digital-board/final/sets/:id',
            name: 'final',
            component: () => import('@/views/admin/digitalBoard/finalBoard/FinalBoard.vue')
        },
        {
            path: '/digital-board/mirror',
            name: 'mirror',
            component: () => import('@/views/mirror/Mirror.vue')
        },
     
        {
            path: '/mqd',
            name: 'mqd',
            component: () => import('@/views/RealTimeDashboard.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: { guestOnly: true } // Only accessible when not authenticated
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },
        {
            path: '/modern-digital-board/sets/:id',
            name: 'modern-digital-board',
            component: () => import('@/components/ModernDigitalBoard.vue'),
            meta: { requiresAuth: true }
        }
    ]
});
// router.beforeEach((to, from, next) => {
//     const authStore = useAuthStore();

//     const loggedIn = authStore.isAuthenticated;

//     // Case 1: User is not logged in and tries to access a protected page
//     if (to.meta.requiresAuth && !loggedIn) {
//         next({ name: 'login', query: { redirect: to.fullPath } }); // Redirect to login, store intended path
//     }
//     // Case 2: User is logged in and tries to access the login page
//     else if (to.name === 'login' && loggedIn) {
//         next({ name: 'dashboard' }); // Redirect to dashboard
//     }
//     // Case 3: User is logged in or accessing a public page
//     else {
//         next(); // Proceed to the route
//     }
// });

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token');

    if (to.meta.requiresAuth && !token) {
        next({ path: '/auth/login', query: { redirect: to.fullPath } });
    } else if (to.meta.guestOnly && token) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router;
