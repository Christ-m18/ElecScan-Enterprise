import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { ProxyMiddleware } from './proxy/proxy.middleware.js';

@Module({ controllers: [HealthController] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
