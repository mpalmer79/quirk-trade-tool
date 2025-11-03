import { describe, it, expect, vi } from 'vitest';
import { authenticate } from '../../middleware/auth';
import { authService } from '../../services/auth-service';

vi.mock('../../services/auth-service');

const mockRequest = (overrides = {}) => ({
  headers: {},
  user: undefined,
  ...overrides,
} as any);

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => vi.fn();

describe('Auth Middleware - Critical', () => {
  it('should authenticate valid JWT token', () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const res = mockResponse();
    const next = mockNext();

    vi.mocked(authService.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'test@quirk.com',
      role: 'admin',
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject missing authorization header', () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'unauthorized' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    });
    const res = mockResponse();
    const next = mockNext();

    vi.mocked(authService.verifyToken).mockReturnValue(null);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
