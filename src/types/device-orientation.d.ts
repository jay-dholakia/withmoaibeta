
// Extension for WebKit-specific device orientation properties
interface DeviceOrientationEvent extends Event {
  // Standard properties
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
  readonly absolute: boolean;
  
  // WebKit-specific properties
  readonly webkitCompassHeading?: number;
  readonly webkitCompassAccuracy?: number;
}

// Request permission to access device orientation events
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface Window {
  DeviceOrientationEvent: {
    prototype: DeviceOrientationEvent;
    new(type: string, eventInitDict?: DeviceOrientationEventInit): DeviceOrientationEvent;
    requestPermission?: () => Promise<"granted" | "denied">;
  }
}
