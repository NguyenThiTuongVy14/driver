import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client;

export function connectWebSocket(
  topic: string,
  onMessage: (msg: IMessage) => void
) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('https://backend-springboot-latest.onrender.com/ws'),
    debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000000,
    onConnect: () => {
      console.log('[STOMP] Connected to topic:', topic);
      stompClient.subscribe(topic, onMessage);
    },
    onStompError: (frame) => {
      console.error('[STOMP ERROR]', frame);
    },
  });

  stompClient.activate();
}

export function disconnectWebSocket() {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    console.log('[STOMP] Disconnected');
  }
}
