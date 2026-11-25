
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  describe('getHealth', () => {
    it('should return healthy status', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('notification-api');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.getHealth();

      expect(
        Number.isNaN(Date.parse(result.timestamp)),
      ).toBe(false);
    });
  });
});
