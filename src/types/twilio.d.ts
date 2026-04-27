/**
 * Minimal type declarations for the Twilio Voice JavaScript SDK v1.14
 * loaded from CDN: https://sdk.twilio.com/js/client/v1.14/twilio.js
 */

declare namespace Twilio {
  interface DeviceOptions {
    /* empty — SDK v1.14 Device constructor accepts a token string directly */
  }

  interface Connection {
    /* represents an active call connection */
  }

  type DeviceEvent =
    | "ready"
    | "error"
    | "connect"
    | "disconnect"
    | "incoming"
    | "cancel"
    | "offline"
    | "incoming";

  class Device {
    constructor(token: string, options?: DeviceOptions);

    /** Register an event handler */
    on(event: "ready", handler: () => void): void;
    on(event: "error", handler: (error: { message: string; code?: number }) => void): void;
    on(event: "connect", handler: (connection?: Connection) => void): void;
    on(event: "disconnect", handler: (connection?: Connection) => void): void;
    on(event: "incoming", handler: (connection: Connection) => void): void;
    on(event: "cancel", handler: () => void): void;
    on(event: "offline", handler: () => void): void;
    on(event: string, handler: (...args: unknown[]) => void): void;

    /** Initiate an outbound call */
    connect(params?: Record<string, string>): Connection;

    /** Disconnect all active connections */
    disconnectAll(): void;

    /** Destroy the device instance and clean up */
    destroy(): void;
  }
}

/** Global Twilio namespace exposed by the CDN script */
declare const Twilio: typeof Twilio;

/** Augment window so TypeScript knows Twilio may live there */
declare global {
  interface Window {
    Twilio?: typeof Twilio;
  }
}

export {};

