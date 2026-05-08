import { EventEmitter } from "events";

// This mimics RabbitMQ for a single-process environment
// In a real microservice setup, these would publish to a message broker like RabbitMQ
class SahyogEventBus extends EventEmitter {
  publish(event: string, data: any) {
    console.log(`[Event Published]: ${event}`, data);
    this.emit(event, data);
  }

  subscribe(event: string, callback: (data: any) => void) {
    this.on(event, callback);
  }
}

export const eventBus = new SahyogEventBus();

// Event Types constants
export const EVENTS = {
  TASK_CREATED: "TASK_CREATED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_MOVED: "TASK_MOVED",
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
};
