// Export the centralized Fake API
export { fakeApi } from './fakeApiSimulator';

// Keep legacy mock setup for compatibility
import Mock from '__fakeApi__/mock';
import './dataTable';
import './users';

Mock.onAny().passThrough();
