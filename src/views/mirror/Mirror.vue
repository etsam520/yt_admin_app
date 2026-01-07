<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { API_BASE_URL, apiClient } from '@/service/apiService';
// import "@/utils/echo";
// import { useEcho } from '@laravel/echo-vue';
import mqtt from 'mqtt';

// import

const toast = useToast();

// State
const currentQuestion = ref({});
const mirrorKey = ref('');
const connectionStatus = ref('disconnected');
const currentQuestionIndex = ref(0);

// MQTT Message State
const mqttQuestionData = ref(null);
const currentLanguage = ref('en');
const selectedOption = ref(null);
const showAnswer = ref(true);
const showSolution = ref(true);
const timerActive = ref(false);
const currentQuestionTime = ref(30);

const messages = ref([]);
let client = null;

const statusMessages = {
    disconnected: 'Disconnected from digital board',
    connecting: 'Connecting to digital board...',
    connected: 'Connected to digital board successfully!'
};




// Connect
const connect = async () => {
    try {
        // const response = await apiClient.post(API_BASE_URL + 'mirror/connect', {
        //     mirror_key: mirrorKey.value
        // });

        // if (response.status !== 200) {
        //     throw new Error('Failed to connect to digital board');
        // }
        // console.log(response);

        connectionStatus.value = 'connected';
        establishMqttConnection(mirrorKey.value + '_current_question');
    } catch (error) {
        console.error('Error connecting to digital board:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to connect to digital board',
            life: 3000
        });
    }
};

// Disconnect
const disconnect = () => {
    connectionStatus.value = 'disconnected';
    currentQuestionIndex.value = 0;
    currentQuestion.value = {};
    mqttQuestionData.value = null;
    selectedOption.value = null;
    showAnswer.value = true;
    showSolution.value = true;
};



onMounted(() => {
    // Create a client instance
    var client = new Paho.MQTT.Client('mqtt.givni.in', 8884, 'clientId');

    console.log(client);

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    // connect the client
    client.connect({
        onSuccess: onConnect,
        userName: 'givnimqtt_client',
        password: '123456',

        useSSL: true,
        //reconnect : true,
        cleanSession: true,
        keepAliveInterval: 120
    });

    // called when the client connects
    function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log('onConnect');
        client.subscribe('test_topic');
        // client.subscribe(mirrorKey.value+"_current_question"); 

        //   message = new Paho.MQTT.Message("Hello");
        //   message.destinationName = "World";
        //   client.send(message);
    }

    // called when the client loses its connection
    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log('onConnectionLost:' + responseObject.errorMessage);
        }
    }
 
    // called when a message arrives
    function onMessageArrived(message) {
        console.log('onMessageArrived:' + message.payloadString);
        try {
            const data = JSON.parse(message.payloadString);
            handleMqttMessage(data);
        } catch (error) {
            console.error('Error parsing MQTT message:', error);
        }
    }
});

const establishMqttConnection = (topic) => {
    var client = new Paho.MQTT.Client('mqtt.givni.in', 8884, 'clientId');

    console.log(client);

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    // connect the client
    client.connect({
        onSuccess: onConnect,
        userName: 'givnimqtt_client',
        password: '123456',

        useSSL: true,
        //reconnect : true,
        cleanSession: true,
        keepAliveInterval: 120
    });

    // called when the client connects
    function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log('onConnect');
        client.subscribe(topic);
        // client.subscribe(mirrorKey.value+"_current_question"); 

        //   message = new Paho.MQTT.Message("Hello");
        //   message.destinationName = "World";
        //   client.send(message);
    }

    // called when the client loses its connection
    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log('onConnectionLost:' + responseObject.errorMessage);
        }
    }
 
    // called when a message arrives
    function onMessageArrived(message) {
        console.log('onMessageArrived:' + message.payloadString);
        try {
            const data = JSON.parse(message.payloadString);
            handleMqttMessage(data);
        } catch (error) {
            console.error('Error parsing MQTT message:', error);
        }
    }
};

// Handle MQTT Message
const handleMqttMessage = (data) => {
    console.log('Processing MQTT message:', data);
    
    // Update the question data from MQTT
    mqttQuestionData.value = data;
    
    // Set current question from MQTT data
    if (data.currentQuestion) {
        currentQuestion.value = data.currentQuestion;
        currentQuestionIndex.value = data.currentIndex || 0;
        selectedOption.value = data.selectedOption;
        timerActive.value = data.timerActive || false;
        currentQuestionTime.value = data.currentQuestionTime || 30;
        currentLanguage.value = data.currentLanguage || 'en';
    }
    
    toast.add({
        severity: 'success',
        summary: 'Question Updated',
        detail: 'New question received from digital board',
        life: 3000
    });
};

// Language toggle
const toggleLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'en' ? 'hi' : 'en';
};

// Get question text based on current language
const getQuestionText = (question) => {
    if (!question || !question.question || !question.question.text) return '';
    return question.question.text[currentLanguage.value] || question.question.text.en || '';
};

// Get solution text based on current language
const getSolutionText = (question) => {
    if (!question || !question.solution || !question.solution.text) return '';
    return question.solution.text[currentLanguage.value] || question.solution.text.en || '';
};

// Get option text based on current language
const getOptionText = (option) => {
    if (!option || !option.text) return '';
    return option.text[currentLanguage.value] || option.text.en || '';
};

// Manual toggle functions
const toggleShowAnswer = () => {
    showAnswer.value = !showAnswer.value;
};

const toggleShowSolution = () => {
    showSolution.value = !showSolution.value;
};

</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-4" id="mirror-screen">
        <div class="w-full max-w-6xl h-screen">
            <div class="flex flex-col h-full rounded-xl overflow-hidden">
                <!-- Header -->
                <div class="glass-effect rounded-t-xl p-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-white">Digital Board Mirror</h1>
                        <p class="text-indigo-200">{{ connectionStatus === 'connected' ? `Connected with key: ${mirrorKey}` : 'Connect to your digital board using your mirror key' }}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <span
                                class="connection-dot"
                                :class="{
                                    'connected-dot': connectionStatus === 'connected',
                                    'disconnected-dot': connectionStatus === 'disconnected',
                                    'connecting-dot': connectionStatus === 'connecting'
                                }"
                            ></span>
                            <span class="text-white font-medium">{{ statusMessages[connectionStatus] }}</span>
                        </div>
                        <!-- Disconnect button when connected -->
                        <button
                            v-if="connectionStatus === 'connected'"
                            @click="disconnect"
                            class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center transition"
                        >
                            <i class="fas fa-power-off mr-2"></i> Disconnect
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="flex-1 p-6 overflow-auto">
                    <!-- Connection Panel - Only show when not connected -->
                    <div v-if="connectionStatus !== 'connected'" class="max-w-md mx-auto">
                        <div class="glass-effect rounded-xl p-6 flex flex-col">
                            <h2 class="text-xl font-semibold text-white mb-4 flex items-center"><i class="fas fa-key mr-2 text-indigo-300"></i> Connection</h2>

                            <div class="mb-6">
                                <label for="mirrorKey" class="block text-sm font-medium text-indigo-200 mb-2"> Mirror Key </label>
                                <div class="relative">
                                    <input
                                        type="text"
                                        id="mirrorKey"
                                        v-model="mirrorKey"
                                        placeholder="Enter your mirror key"
                                        :disabled="connectionStatus === 'connecting'"
                                        class="w-full bg-gray-800 bg-opacity-50 border border-gray-700 text-white py-3 px-4 pr-12 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    />
                                    <i class="fas fa-key absolute right-4 top-3.5 text-gray-400"></i>
                                </div>
                            </div>

                            <div class="flex space-x-4 mt-auto">
                                <button
                                    @click="connect"
                                    :disabled="!mirrorKey || connectionStatus === 'connecting'"
                                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i class="fas fa-plug mr-2"></i> 
                                    {{ connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Board' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Content Panel - Full width when connected -->
                    <div v-else class="glass-effect rounded-xl p-6 flex flex-col h-full">
                        <div class="flex-1 flex flex-col">

                                <!-- Language Toggle and Controls -->
                                <div class="mb-4 flex justify-between items-center">
                                    <h2 class="text-xl font-semibold text-white flex items-center">
                                        <i class="fas fa-blackboard mr-2 text-indigo-300"></i> 
                                        Digital Board
                                    </h2>
                                    <div class="flex space-x-2">
                                        <button 
                                            @click="toggleLanguage" 
                                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition"
                                        >
                                            <i class="fas fa-language mr-2"></i> 
                                            {{ currentLanguage === 'en' ? 'हिंदी' : 'English' }}
                                        </button>
                                        <button 
                                            @click="toggleShowAnswer" 
                                            class="px-4 py-2 rounded-lg font-medium flex items-center transition"
                                            :class="showAnswer ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'"
                                        >
                                            <i class="fas fa-check-circle mr-2"></i> 
                                            Answer
                                        </button>
                                        <button 
                                            @click="toggleShowSolution" 
                                            class="px-4 py-2 rounded-lg font-medium flex items-center transition"
                                            :class="showSolution ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'"
                                        >
                                            <i class="fas fa-lightbulb mr-2"></i> 
                                            Solution
                                        </button>
                                    </div>
                                </div>

                                <!-- Question Info -->
                                <div class="mb-4 flex justify-between text-sm text-indigo-200" v-if="mqttQuestionData">
                                    <span>Question {{ (mqttQuestionData.currentIndex || 0) + 1 }}</span>
                                    <span>Subject: {{ mqttQuestionData.currentQuestion?.subject_name || 'N/A' }}</span>
                                    <span>Chapter: {{ mqttQuestionData.currentQuestion?.chapter_name || 'N/A' }}</span>
                                </div>

                                <!-- Question Display -->
                                <div class="mb-6 bg-gray-800 bg-opacity-50 rounded-xl p-5">
                                    <h3 class="text-lg font-medium text-indigo-300 mb-3 flex items-center">
                                        <i class="fas fa-question-circle mr-2"></i> 
                                        Current Question
                                        <span class="ml-auto text-sm" v-if="timerActive">
                                            <i class="fas fa-clock mr-1"></i> {{ currentQuestionTime }}s
                                        </span>
                                    </h3>
                                    <transition name="slide-fade" mode="out-in">
                                        <p key="questionText" class="text-white text-lg">
                                            {{ currentQuestion.id ? getQuestionText(currentQuestion) : 'No question available' }}
                                        </p>
                                    </transition>
                                </div>

                                <!-- Options Display -->
                                <div class="mb-6 bg-gray-800 bg-opacity-50 rounded-xl p-5" v-if="currentQuestion.options">
                                    <h3 class="text-lg font-medium text-indigo-300 mb-3 flex items-center">
                                        <i class="fas fa-list mr-2"></i> Options
                                    </h3>
                                    <div class="space-y-3">
                                        <div 
                                            v-for="(option, index) in currentQuestion.options" 
                                            :key="index"
                                            class="p-3 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600 hover:border-indigo-500 transition"
                                            :class="{
                                                'border-green-500 bg-green-500 bg-opacity-20': showAnswer && String.fromCharCode(65 + index) === currentQuestion.answer,
                                                'border-indigo-500 bg-indigo-500 bg-opacity-20': selectedOption === String.fromCharCode(65 + index)
                                            }"
                                        >
                                            <div class="flex items-center">
                                                <span class="text-indigo-300 font-medium mr-3">{{ String.fromCharCode(65 + index) }}.</span>
                                                <span class="text-white">{{ getOptionText(option) }}</span>
                                                <i v-if="showAnswer && String.fromCharCode(65 + index) === currentQuestion.answer" 
                                                   class="fas fa-check-circle text-green-400 ml-auto"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-4 text-center" v-if="showAnswer">
                                        <span class="text-green-400 font-medium">
                                            <i class="fas fa-check mr-2"></i>
                                            Correct Answer: {{ currentQuestion.answer }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Solution Display -->
                                <div class="bg-gray-800 bg-opacity-50 rounded-xl p-5 flex-1 mb-6" v-if="showSolution">
                                    <h3 class="text-lg font-medium text-indigo-300 mb-3 flex items-center">
                                        <i class="fas fa-lightbulb mr-2"></i> Solution
                                    </h3>
                                    <transition name="slide-fade" mode="out-in">
                                        <p key="solutionText" class="text-white">
                                            {{ currentQuestion.id ? getSolutionText(currentQuestion) : 'No solution available' }}
                                        </p>
                                    </transition>
                                </div>

                                <!-- Connection Info -->
                                <div class="bg-gray-800 bg-opacity-50 rounded-xl p-4 mt-auto" v-if="mqttQuestionData">
                                    <div class="flex items-center justify-between text-sm text-indigo-200">
                                        <span class="flex items-center">
                                            <i class="fas fa-key mr-2"></i>
                                            Mirror Key: {{ mqttQuestionData.mirror_key }}
                                        </span>
                                        <span class="flex items-center">
                                            <i class="fas fa-hashtag mr-2"></i>
                                            Set ID: {{ mqttQuestionData.set_id }}
                                        </span>
                                        <span class="flex items-center">
                                            <i class="fas fa-question mr-2"></i>
                                            Question ID: {{ mqttQuestionData.question_id }}
                                        </span>
                                    </div>
                                </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="glass-effect rounded-b-xl p-4 text-center">
                    <p class="text-indigo-200 text-sm">Digital Board Mirror &copy; 2023</p>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
#mirror-screen {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    font-family: 'Inter', sans-serif;
    overflow: hidden;
}
.glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
.glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}
.connection-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 8px;
}
.connected-dot {
    background-color: #10b981;
    box-shadow: 0 0 10px #10b981;
}
.disconnected-dot {
    background-color: #ef4444;
    box-shadow: 0 0 10px #ef4444;
}
.connecting-dot {
    background-color: #f59e0b;
    box-shadow: 0 0 10px #f59e0b;
    animation: pulse 1.5s infinite;
}
@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
    100% {
        opacity: 1;
    }
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
    opacity: 0;
}
.slide-fade-enter-active {
    transition: all 0.3s ease;
}
.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter,
.slide-fade-leave-to {
    transform: translateX(10px);
    opacity: 0;
}
</style>
