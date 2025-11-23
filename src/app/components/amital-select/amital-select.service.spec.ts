import { AmitalSelectService } from './amital-select.service';

describe('AmitalSelectService Tests', () => {
  let service: AmitalSelectService;

  beforeEach(() => {
    service = new AmitalSelectService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
