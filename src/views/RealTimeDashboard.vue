<script>
import mqttService from '@/service/mqttService';

export default {
    name: 'RealTimeDashboard',
    data() {
        return {
            isConnected: false,
            publishTopic: 'test/topic',
            publishMessage: 'Hello MQTT!',
            subscribeTopic: 'test/topic',
            receivedMessages: [],
            subscriptions: {},
            brokerUrl: 'ws://mqtt.givni.in:8883/mqtt' // WebSocket URL for browser
        };
    },
    computed: {
        connectionStatus() {
            return this.isConnected ? 'Connected' : 'Disconnected';
        },
        connectionClass() {
            return this.isConnected ? 'connected' : 'disconnected';
        }
    },
    async mounted() {
        await this.connectToBroker();
    },
    beforeUnmount() {
        mqttService.disconnect();
    },
    methods: {
        async connectToBroker() {
            try {
                await mqttService.connect(this.brokerUrl);
                this.isConnected = true;

                // Subscribe to connection events
                mqttService.client.on('close', () => {
                    this.isConnected = false;
                });

                mqttService.client.on('reconnect', () => {
                    this.isConnected = false;
                });
            } catch (error) {
                console.error('Failed to connect to MQTT broker:', error);
                this.isConnected = false;
            }
        },

        publishMessage() {
            if (this.publishTopic && this.publishMessage) {
                const success = mqttService.publish(this.publishTopic, this.publishMessage);

                if (success) {
                    console.log('Message published successfully');
                }
            }
        },

        subscribeToTopic() {
            if (this.subscribeTopic) {
                const success = mqttService.subscribe(this.subscribeTopic, (message, topic) => {
                    this.handleIncomingMessage(message, topic);
                });

                if (success) {
                    this.$set(this.subscriptions, this.subscribeTopic, true);
                }
            }
        },

        unsubscribe(topic) {
            mqttService.unsubscribe(topic);
            this.$delete(this.subscriptions, topic);

            // Remove messages from this topic
            this.receivedMessages = this.receivedMessages.filter((msg) => msg.topic !== topic);
        },

        handleIncomingMessage(message, topic) {
            const timestamp = new Date().toLocaleTimeString();
            this.receivedMessages.unshift({
                topic,
                content: typeof message === 'object' ? JSON.stringify(message) : message,
                timestamp
            });

            // Keep only last 50 messages
            if (this.receivedMessages.length > 50) {
                this.receivedMessages.pop();
            }
        }
    }
};
</script>

<template>
    <div class="real-time-dashboard">
        <div class="connection-status" :class="connectionClass">
            {{ connectionStatus }}
        </div>

        <div class="controls">
            <input v-model="publishTopic" placeholder="Topic" class="input" />
            <input v-model="publishMessage" placeholder="Message" class="input" />
            <button @click="publishMessage" :disabled="!isConnected" class="btn">Publish</button>

            <input v-model="subscribeTopic" placeholder="Subscribe to topic" class="input" />
            <button @click="subscribeToTopic" :disabled="!isConnected" class="btn">Subscribe</button>
        </div>

        <div class="messages">
            <h3>Received Messages:</h3>
            <div v-for="(message, index) in receivedMessages" :key="index" class="message-item">
                <strong>{{ message.topic }}:</strong> {{ message.content }}
                <small>{{ message.timestamp }}</small>
            </div>
        </div>

        <div class="subscriptions">
            <h3>Active Subscriptions:</h3>
            <div v-for="(topic, index) in Object.keys(subscriptions)" :key="index" class="subscription-item">
                {{ topic }}
                <button @click="unsubscribe(topic)" class="btn-small">Unsubscribe</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.real-time-dashboard {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.connection-status {
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
}

.connected {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.disconnected {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.controls {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
}

.input {
    margin: 5px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 200px;
}

.btn {
    margin: 5px;
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.btn-small {
    padding: 4px 8px;
    font-size: 12px;
    margin-left: 10px;
}

.messages,
.subscriptions {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
}

.message-item,
.subscription-item {
    padding: 8px;
    margin: 5px 0;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.message-item small {
    color: #6c757d;
    margin-left: 10px;
}
</style>
