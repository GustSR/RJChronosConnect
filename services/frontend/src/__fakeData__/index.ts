// Export the centralized Fake API
export { fakeDataService } from './fakeApiSimulator';

// Keep legacy mock setup for compatibility
import Mock from '__fakeData__/mock';
import './dataTable';
import './users';

Mock.onAny().passThrough();
