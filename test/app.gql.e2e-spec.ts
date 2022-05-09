import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { TimeoutInterceptor } from 'src/common/interceptors/timeout.interceptor';
import { WrapResponseInterceptor } from 'src/common/interceptors/wrap-response.interceptor';
import { AppModule } from 'src/app.module';
import request from 'supertest';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

const sleep = async (ms) => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe('AppModule GraphQL (e2e)', () => {
  let app: INestApplication;
  const message = 'Salam';

  const baseTest = () => request(app.getHttpServer()).post('/graphql');
  const publicTest = (query: string) => baseTest().send({ query });
  // const privateTest = (query: string) =>
  //   baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          database: 'nestjs_fiddle_test',
          username: 'postgres',
          password: 'bismillah',
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication>();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalInterceptors(
      new WrapResponseInterceptor(),
      new TimeoutInterceptor(),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  describe('Query', () => {
    it('should response with string from DB', async () => {
      const query = `
        query {
          check
        }
      `;

      const expectedResponse = {
        data: {
          check: expect.any(String),
        },
      };

      const res = await publicTest(query);

      expect(res.body).toEqual(expectedResponse);
      // check if string is indeed from DB
      expect(res.body.data.check).toBe('Test Coffee'); //data fron DB
    });

    /**
     * Subscription
     */
    it('Subscription', async () => {
      /** Subscribe first, subscribe for helloSaid event */
      const subscriptionQuery = `
        subscription {
          helloSaid {
            message
          }
        }
      `;

      await (async () => {
        let result, unsubscribe;
        const gqlClient = createClient({
          url: 'ws://localhost:3000/graphql',
          webSocketImpl: WebSocket,
        });

        await new Promise((resolve, reject) => {
          unsubscribe = gqlClient.subscribe(
            {
              query: subscriptionQuery,
            },
            {
              next: (data) => {
                result = data;
                console.log(data);
                expect(data).toEqual({
                  data: {
                    helloSaid: { message: expect.any(String) },
                  },
                });
              },
              error: (error) => {
                console.log(error);
                reject(error);
              },
              complete: () => {
                console.log('subscription complete ');
                unsubscribe();
                resolve(result);
              },
            },
          );
        });
      })();
      await sleep(500);
    });

    it('should response with default message', async () => {
      const query = `
        query {
          sayHello
        }
      `;

      const expectedResponse = {
        data: {
          sayHello: 'Hello World!',
        },
      };

      /** Query to publish helloSaid event */
      const res = await publicTest(query);

      expect(res.body).toEqual(expectedResponse);
    });

    it('should response with custom message', async () => {
      const query = `
          query {
            sayHello(messageInput: {content: "${message}"})
          }
        `;

      const expectedResponse = {
        data: {
          sayHello: message,
        },
      };

      /** Query to publish helloSaid event */
      const res = await publicTest(query);

      expect(res.body).toEqual(expectedResponse);
    });
  });
});
