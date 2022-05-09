import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication>();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    request(app.getHttpServer())
      .get('/')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toBe('Hello World');
      });
  });
});
