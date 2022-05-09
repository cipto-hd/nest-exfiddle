import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoffeeModule } from './coffee/coffee.module';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './config/app.config';
import { getConnectionOptions } from 'typeorm';
import { LoggingMiddleware } from './common/middlewares/logging.middleware';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PUB_SUB } from './common/common.constants';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [AppConfig],
    }),
    ConfigModule.forFeature(AppConfig),
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions(), {
          autoLoadEntities: true,
          synchronize: true,
        }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
        },
      },
    }),
    CoffeeModule,
    // CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    {
      provide: PUB_SUB,
      useValue:
        process.env.NODE_ENV == 'test' ? new PubSub() : new RedisPubSub(),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).exclude('graphql');
  }
}
