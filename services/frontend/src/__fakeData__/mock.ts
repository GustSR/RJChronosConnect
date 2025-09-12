// Mock system using axios adapters - compatible with Uko template dependencies
import axios from '@shared/lib/utils/axios';

// Store mock handlers
const mockHandlers: Record<string, Record<string, (config: any) => any>> = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {}
};

// Custom axios adapter for mocking
const mockAdapter = (config: any) => {
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || '';
  const handler = mockHandlers[method]?.[url];
  
  console.log(`Mock adapter: ${method} ${url}`, { 
    hasHandler: !!handler,
    availableHandlers: Object.keys(mockHandlers[method] || {})
  });
  
  if (handler) {
    console.log('Mock handler found, processing...');
    
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        try {
          const [status, data] = handler(config);
          console.log('Mock response generated:', { status, data });
          
          if (status >= 400) {
            const error = new Error(data.message || 'Request failed');
            // @ts-expect-error - adding response properties to error
            error.response = {
              data,
              status,
              statusText: status >= 500 ? 'Internal Server Error' : 'Client Error',
              headers: {},
              config
            };
            reject(error);
          } else {
            resolve({
              data,
              status,
              statusText: 'OK',
              headers: {},
              config
            });
          }
        } catch (err) {
          console.error('Mock handler error:', err);
          const error = new Error('Mock handler failed');
          // @ts-expect-error - adding response properties to error
          error.response = {
            data: { message: 'Internal server error' },
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            config
          };
          reject(error);
        }
      }, 100); // Small delay to simulate network
    });
  }
  
  console.log('No mock handler, using default adapter');
  // Use default adapter for non-mocked requests
  return axios.defaults.adapter!(config);
};

// Set the mock adapter
axios.defaults.adapter = mockAdapter;

// Mock implementation that registers handlers
const createMockMethod = (method: string) => (url: string) => ({
  reply: (handler: (config: any) => [number, any]) => {
    mockHandlers[method][url] = handler;
    console.log(`Mock ${method} ${url} registered and active`);
    return handler;
  }
});

const Mock = {
  onGet: createMockMethod('GET'),
  onPost: createMockMethod('POST'),  
  onPut: createMockMethod('PUT'),
  onDelete: createMockMethod('DELETE'),
  onAny: () => ({ 
    passThrough: () => {
      console.log('Mock passThrough - using adapter');
    } 
  })
};

export default Mock;
