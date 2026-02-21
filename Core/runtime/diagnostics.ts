export type BootLevel = 'info' | 'warn' | 'error';

export type BootEvent = {
  at: string;
  stage: string;
  level: BootLevel;
  message: string;
  meta?: Record<string, unknown>;
};

const bootEvents: BootEvent[] = [];

export function logBoot(stage: string, message: string, level: BootLevel = 'info', meta?: Record<string, unknown>) {
  const event: BootEvent = {
    at: new Date().toISOString(),
    stage,
    level,
    message,
    meta,
  };

  bootEvents.push(event);

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  fn(`[boot:${stage}] ${message}`, meta ?? '');
}

export function getBootEvents() {
  return [...bootEvents];
}
