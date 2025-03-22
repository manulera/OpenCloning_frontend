import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrimerDetails } from './usePrimerDetails';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';

vi.mock('../../hooks/useBackendRoute');
vi.mock('../../hooks/useHttpClient');

describe('usePrimerDetails', () => {
  const mockSequence = 'ATCG';
  const mockSequence2 = 'ATCGC';
  const mockPrimerDetails = { melting_temperature: 50, gc_content: 0.25 };
  const mockUrl = () => '/mock/primer/details';

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('should cache primer details after first fetch', async () => {
    // Mock backend route and http client
    useBackendRoute.mockReturnValue(mockUrl);
    const mockHttpClient = {
      get: vi.fn().mockResolvedValue({ data: mockPrimerDetails }),
    };
    useHttpClient.mockReturnValue(mockHttpClient);

    // First call should fetch from backend
    const firstResult = await usePrimerDetails(mockSequence);
    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(mockPrimerDetails);

    // Second call should use cached result
    const secondResult = await usePrimerDetails(mockSequence);
    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    expect(secondResult).toEqual(mockPrimerDetails);
  });

  it('should throw error on connection failure', async () => {
    // Mock backend route and http client with error
    useBackendRoute.mockReturnValue(mockUrl);
    const mockError = new Error('Network Error');
    const mockHttpClient = {
      get: vi.fn().mockRejectedValue(mockError),
    };
    useHttpClient.mockReturnValue(mockHttpClient);

    // Expect the error to be thrown
    await expect(usePrimerDetails(mockSequence2)).rejects.toThrow('Network Error');
  });
});
