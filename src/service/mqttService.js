import mqtt from 'mqtt';

class MqttService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connect('mqtt.givni.in:');
    }

    connect(brokerUrl, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.client = mqtt.connect(brokerUrl, {
                    clientId: 'vue_client_' + Math.random().toString(16).substr(2, 8),
                    clean: true,
                    connectTimeout: 4000,
                    reconnectPeriod: 1000,
                    ...options
                });

                this.client.on('connect', () => {
                    console.log('MQTT Connected to:', brokerUrl);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve(this.client);
                });

                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message);
                });

                this.client.on('error', (error) => {
                    console.error('MQTT Error:', error);
                    reject(error);
                });

                this.client.on('close', () => {
                    console.log('MQTT Connection closed');
                    this.isConnected = false;
                });

                this.client.on('reconnect', () => {
                    this.reconnectAttempts++;
                    console.log(`MQTT Reconnecting... Attempt ${this.reconnectAttempts}`);

                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        this.disconnect();
                    }
                });
            } catch (error) {
                console.error('MQTT Connection failed:', error);
                reject(error);
            }
        });
    }

    subscribe(topic, callback, qos = 0) {
        if (!this.isConnected) {
            console.error('Not connected to MQTT broker');
            return false;
        }

        this.client.subscribe(topic, { qos }, (error) => {
            if (error) {
                console.error('Subscribe error:', error);
                return;
            }
            console.log('Subscribed to:', topic);
        });

        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, []);
        }
        this.subscriptions.get(topic).push(callback);

        return true;
    }

    unsubscribe(topic, callback = null) {
        if (this.subscriptions.has(topic)) {
            if (callback) {
                const callbacks = this.subscriptions.get(topic);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
                if (callbacks.length === 0) {
                    this.subscriptions.delete(topic);
                    this.client.unsubscribe(topic);
                }
            } else {
                this.subscriptions.delete(topic);
                this.client.unsubscribe(topic);
            }
        }
    }

    publish(topic, message, qos = 0, retain = false) {
        if (!this.isConnected) {
            console.error('Not connected to MQTT broker');
            return false;
        }

        const payload = typeof message === 'object' ? JSON.stringify(message) : message;

        this.client.publish(topic, payload, { qos, retain }, (error) => {
            if (error) {
                console.error('Publish error:', error);
            }
        });

        return true;
    }

    handleMessage(topic, message) {
        if (this.subscriptions.has(topic)) {
            try {
                const parsedMessage = this.tryParseJson(message.toString());
                const callbacks = this.subscriptions.get(topic);

                callbacks.forEach((callback) => {
                    callback(parsedMessage, topic);
                });
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }
    }

    tryParseJson(str) {
        try {
            return JSON.parse(str);
        } catch {
            return str.toString();
        }
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
            this.subscriptions.clear();
            console.log('MQTT Disconnected');
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

export default new MqttService();
