import { setActivePinia, createPinia } from 'pinia';
import { useExcuseStore } from '../src/stores/excuse';
import api from '../src/services/api';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    }
  };
});

describe('Excuse Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const store = useExcuseStore();
    expect(store.excuseRequests).toEqual([]);
    expect(store.submitting).toBe(false);
    expect(store.submitted).toBe(false);
    expect(store.fieldErrors).toEqual({});
  });

  it('fetches excuse requests successfully', async () => {
    const store = useExcuseStore();
    const mockData = [{ id: 1, reason: 'Sick' }];
    
    // @ts-ignore
    api.get.mockResolvedValueOnce({ data: { data: mockData } });

    await store.fetchExcuseRequests();

    expect(api.get).toHaveBeenCalledWith('/excuse-requests');
    expect(store.excuseRequests).toEqual(mockData);
  });

  it('handles fetch error by setting empty array', async () => {
    const store = useExcuseStore();
    
    // @ts-ignore
    api.get.mockRejectedValueOnce(new Error('Network Error'));

    await store.fetchExcuseRequests();

    expect(store.excuseRequests).toEqual([]);
  });

  it('submits an excuse successfully', async () => {
    const store = useExcuseStore();
    
    // @ts-ignore
    api.post.mockResolvedValueOnce({ status: 201 });

    const payload = {
      attendance_record_id: 123,
      reason: 'Medical appointment',
      attachment: new File([''], 'test.png', { type: 'image/png' })
    };

    await store.submitExcuse(payload);

    expect(store.submitting).toBe(false);
    expect(store.submitted).toBe(true);
    expect(store.fieldErrors).toEqual({});
    expect(api.post).toHaveBeenCalledTimes(1);
    
    // Check that formData was passed correctly
    // @ts-ignore
    const callArgs = api.post.mock.calls[0];
    expect(callArgs[0]).toBe('/excuse-requests');
    expect(callArgs[1] instanceof FormData).toBe(true);
    expect(callArgs[2]).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  });

  it('handles submission validation error (422)', async () => {
    const store = useExcuseStore();
    const errorResponse = {
      response: {
        status: 422,
        data: {
          errors: { reason: ['Reason is required'] }
        }
      }
    };
    
    // @ts-ignore
    api.post.mockRejectedValueOnce(errorResponse);

    await store.submitExcuse({ attendance_record_id: 123, reason: '' });

    expect(store.submitting).toBe(false);
    expect(store.submitted).toBe(false);
    expect(store.fieldErrors).toEqual({ reason: ['Reason is required'] });
  });

  it('resets the store state', () => {
    const store = useExcuseStore();
    
    store.submitted = true;
    store.fieldErrors = { reason: ['Error'] };
    store.submittedLabel = 'test';
    
    store.reset();
    
    expect(store.submitted).toBe(false);
    expect(store.fieldErrors).toEqual({});
    expect(store.submittedLabel).toBe('');
  });
});
