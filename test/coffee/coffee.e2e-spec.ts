import { Test, TestingModule } from '@nestjs/testing';
import { CoffeeModule } from 'src/coffee/coffee.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { WrapResponseInterceptor } from 'src/common/interceptors/wrap-response.interceptor';
import { TimeoutInterceptor } from 'src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { CreateCoffeeDto } from 'src/coffee/dtos/create-coffee.dto';
import { UpdateCoffeeDto } from 'src/coffee/dtos/update-coffee.dto';
import { FlavorEntity } from 'src/coffee/entities/flavor.entity';
import supertest from 'supertest';

describe('[Feature] Coffee (e2e) - /coffeees', () => {
  let app: INestApplication;
  let createdCoffee, testClient: supertest.SuperTest<supertest.Test>;

  const coffee = {
    name: 'Shipwreck Roast',
    brand: 'Buddy brew',
    flavors: ['chocolate', 'vanilla'],
  };

  const expectedCoffee = expect.objectContaining({
    ...coffee,
    flavors: expect.arrayContaining(
      coffee.flavors.map((name) => expect.objectContaining({ name })),
    ),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CoffeeModule,
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

    testClient = supertest(app.getHttpServer());

    createdCoffee = (
      await testClient.post('/coffees').send(coffee as CreateCoffeeDto)
    ).body.data;
  });

  afterAll(async () => {
    app.close();
  });

  describe('Create [POST /]', () => {
    it('should return the created coffee on success', async () => {
      try {
        const res = await testClient
          .post('/coffees')
          .send(coffee as CreateCoffeeDto)
          .expect(HttpStatus.CREATED);

        expect(res.body).toEqual(
          expect.objectContaining({ data: expectedCoffee }),
        );
      } catch (error) {
        console.log(error);
      }
    });
  });

  describe('GetAll [GET /]', () => {
    it('should return an array of coffee', async () => {
      try {
        const res = await testClient.get('/coffees').expect(HttpStatus.OK);

        expect(res.body).toEqual(
          expect.objectContaining({
            data: expect.arrayContaining([expectedCoffee]),
          }),
        );
      } catch (error) {
        console.log(error);
      }
    });
  });

  describe('GetOne [GET /:id]', () => {
    it('shoudl return coffee on success', async () => {
      try {
        const res = await testClient
          .get(`/coffees/${createdCoffee.id}`)
          .expect(HttpStatus.OK);

        expect(res.body).toEqual(
          expect.objectContaining({ data: expectedCoffee }),
        );
      } catch (error) {
        console.log(error);
      }
    });
  });

  describe('Update [PATCH /:id]', () => {
    it('should return coffee with updated data', async () => {
      const newFlavors = ['yes', 'vanilla'];
      let mergedFlavors: string[] = [];
      mergedFlavors = createdCoffee.flavors.map(
        (flavor: FlavorEntity) => flavor.name,
      );

      newFlavors.map((flavor) => {
        !mergedFlavors.includes(flavor) && mergedFlavors.push(flavor);
      });

      try {
        const res = await testClient
          .patch(`/coffees/${createdCoffee.id}`)
          .send({ flavors: newFlavors } as UpdateCoffeeDto)
          .expect(HttpStatus.OK);

        expect(res.body).toEqual(
          expect.objectContaining({
            data: expect.objectContaining({
              ...coffee,
              flavors: expect.arrayContaining(
                mergedFlavors.map((flavor: string) =>
                  expect.objectContaining({ name: flavor }),
                ),
              ),
            }),
          }),
        );
      } catch (error) {
        console.log(error);
      }
    });
  });

  describe('Delete [DELETE /:id]', () => {
    it('should return the deleted coffee on success', async () => {
      try {
        const res = await testClient
          .delete(`/coffees/${createdCoffee.id}`)
          .expect(HttpStatus.OK);

        expect(res.body).toEqual(
          expect.objectContaining({ data: expectedCoffee }),
        );
      } catch (error) {
        console.log(error);
      }
    });

    it('should return the NotfoundException after deleted', async () => {
      try {
        testClient.get(`/coffees/${createdCoffee.id}`);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toEqual(
          `Coffee with ID #${createdCoffee.id} was not found`,
        );
      }
    });
  });
});
