import { Test, TestingModule } from '@nestjs/testing';
import { PubSub } from 'graphql-subscriptions';
import { Connection, Repository } from 'typeorm';
import { AppResolver } from './app.resolver';
import { CoffeeService } from './coffee/coffee.service';
import { CoffeeRepository } from './coffee/repositories/coffee.repository';
import { FlavorRepository } from './coffee/repositories/flavor.repository';
import { PUB_SUB } from './common/common.constants';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

describe('AppResolver', () => {
  let resolver: AppResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppResolver,
        { provide: PUB_SUB, useValue: new PubSub() },
        {
          provide: Connection,
          useValue: {},
        },
        {
          provide: FlavorRepository,
          useValue: createMockRepository(),
        },
        {
          provide: CoffeeRepository,
          useValue: createMockRepository(),
        },
        CoffeeService,
      ],
    }).compile();

    resolver = module.get<AppResolver>(AppResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
