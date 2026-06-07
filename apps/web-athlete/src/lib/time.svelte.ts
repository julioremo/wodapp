class Clock {
  now = $state(new Date());

  constructor() {
    // Standard JS way to check if we are in the browser
    if (typeof window !== "undefined") {
      setInterval(() => {
        this.now = new Date();
      }, 1000);
    }
  }
}

export const globalClock = new Clock();
