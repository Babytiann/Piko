type EventMap = {
  'budget-updated': { monthly_budget: number; weekly_budget: number };
};

type Listener<T> = (payload: T) => void;

class AppEventEmitter {
  private listeners: {
    [K in keyof EventMap]?: Listener<EventMap[K]>[];
  } = {};

  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    const list = this.listeners[event];
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const list = this.listeners[event];
    if (!list) return;
    list.slice().forEach((l) => l(payload));
  }
}

export const appEvents = new AppEventEmitter();
