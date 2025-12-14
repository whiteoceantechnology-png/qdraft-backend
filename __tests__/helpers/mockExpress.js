/**
 * Mock Request and Response objects for controller testing
 */

/**
 * Create a mock Express request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
export function mockRequest(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    tenantId: options.tenantId || 1,
    get: (header) => options.headers?.[header.toLowerCase()],
    ...options,
  };
}

/**
 * Create a mock Express response object
 * @returns {Object} Mock response with jest spies
 */
export function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Create a mock Express next function
 * @returns {Function} Mock next function
 */
export function mockNext() {
  return jest.fn();
}

/**
 * Create a complete mock Express context
 * @param {Object} options - Request options
 * @returns {Object} { req, res, next }
 */
export function mockExpressContext(options = {}) {
  return {
    req: mockRequest(options),
    res: mockResponse(),
    next: mockNext(),
  };
}

export default {
  mockRequest,
  mockResponse,
  mockNext,
  mockExpressContext,
};
