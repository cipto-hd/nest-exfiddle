import { Inject } from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  ObjectType,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { PubSub } from 'graphql-subscriptions';
import { CoffeeService } from './coffee/coffee.service';
import { PUB_SUB } from './common/common.constants';

@ObjectType()
class GreetingOutput {
  @Field()
  message: string;
}

/* @ArgsType()
class MessageArg {
  @Field({ defaultValue: 'Hello Word!' })
  @IsOptional()
  content: string;
} */

@InputType()
class MessageInput {
  @Field()
  @IsOptional()
  content: string;
}

@Resolver()
export class AppResolver {
  constructor(
    private readonly coffeeService: CoffeeService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => String)
  async check() {
    const coffee =
      process.env.NODE_ENV == 'test'
        ? await this.coffeeService.create({
            name: 'Test Coffee',
            brand: 'Brand',
            flavors: ['falvor01', 'flavor02'],
          })
        : {
            name: 'Check Coffee',
          };

    return coffee.name;
  }

  @Query(() => String)
  sayHello(
    // @Args() messageArg?: MessageArg,
    @Args({
      nullable: true,
      name: 'messageInput',
      defaultValue: { content: 'Hello World!' },
    })
    messageInput?: MessageInput,
  ): string {
    this.pubSub.publish('helloSaid', {
      // helloSaid: { message: messageArg.content },
      helloSaid: { message: messageInput.content },
    });

    // return messageArg.content;
    return messageInput.content;
  }

  @Subscription(() => GreetingOutput)
  helloSaid() {
    return this.pubSub.asyncIterator('helloSaid');
  }
}
