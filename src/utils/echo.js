import { configureEcho } from '@laravel/echo-vue';

// window.Pusher = Pusher

// const echo = new Echo({
//     broadcaster: 'pusher',
//     key: 'local', // your key or dummy if Reverb
//     cluster: 'mt1',
//     wsHost: "foodyari.com",
//     wsPort: 443,
//     wssPort: 443,
//     forceTLS: false,
//     enabledTransports: ['ws', 'wss'],
//     disableStats: true,
// })

// echo = new window.Echo({
//     broadcaster: 'reverb',
//     key: null,
//     host: window.location.hostname + ':6001',
//     transports: ['websocket'],
//     auth: {
//         headers: {
//             Authorization: localStorage.getItem('auth_token') !== null ? 'Bearer ' + localStorage.getItem('auth_token') : ''
//         }
//     }
// });
// export default echo

// configureEcho({
//     broadcaster: "socket.io",
//     key:"my-app-key" ,
//     wsHost: window.location.hostname,
//     wsPort: 6001,
//     // wssPort: import.meta.env.VITE_REVERB_PORT,
//     forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
//     enabledTransports: ['ws', 'wss'],
// });

export default {};
