/**
 * Shared test fixtures and utilities for valuation integration tests
 */

export const validValuationRequest = {
  year: 2020,
  make: 'Honda',
  model: 'Accord',
  mileage: 45000,
  condition: 3,
  storeId: 'test-dealer-01',
  vin: 'JHCV12345JM123456',
};

export const invalidRequests = [
  {
    name: 'Missing year',
    payload: { ...validValuationRequest, year: undefined },
  },
  {
    name: 'Invalid condition (0)',
    payload: { ...validValuationRequest, condition: 0 },
  },
  {
    name: 'Invalid condition (6)',
    payload: { ...validValuationRequest, condition: 6 },
  },
  {
    name: 'Negative mileage',
    payload: { ...validValuationRequest, mileage: -100 },
  },
  {
    name: 'Missing make',
    payload: { ...validValuationRequest, make: '' },
  },
  {
    name: 'Empty model',
    payload: { ...validValuationRequest, model: '' },
  },
  {
    name: 'Missing storeId',
    payload: { ...validValuationRequest, storeId: '' },
  },
];

export const conditionFactors = [
  { rating: 5, expectedFactor: 1.0, name: 'Excellent' },
  { rating: 4, expectedFactor: 0.95, name: 'Very Good' },
  { rating: 3, expectedFactor: 0.9, name: 'Good' },
  { rating: 2, expectedFactor: 0.8, name: 'Fair' },
  { rating: 1, expectedFactor: 0.6, name: 'Poor' },
];
