import { Request } from '@nestjs/common';

export const mockRequestObject = () => {
  return { headers: {}, body: {}, query: {}, params: {} } as unknown as Request;
};
