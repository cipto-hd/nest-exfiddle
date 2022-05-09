import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Protocol = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    console.log('Protocol decorator data: ', data);
    const request: Request = context.switchToHttp().getRequest<Request>();

    return request.protocol;
  },
);
