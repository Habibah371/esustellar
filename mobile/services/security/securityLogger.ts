import { logger } from '../logger';

export function logSecurityEvent(message: string) {
  logger.warn('Security', message);

  // Future production extension:
  // send logs to backend monitoring service
}
