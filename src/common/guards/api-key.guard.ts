import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { AppConfig } from 'src/config/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.get(IS_PUBLIC, context.getHandler());
    if (isPublic) return true;

    const request: Request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;

    return authHeader === this.appConfig.apiKey;
  }
}
