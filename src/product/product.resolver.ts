import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import ProductLoaders from 'src/product/loaders/product.loaders';
import { User } from 'src/users/models/users.model';
import { Product } from './models/product.model';
import { ProductService } from './product.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(
    private productService: ProductService,
    private productLoaders: ProductLoaders,
  ) {}

  @Query(() => Product)
  async product(@Args('id', { type: () => Int }) id: number) {
    const product = await this.productService.findProduct(id);
    return product;
  }
  // add Index and RelationId for fetch this relation
  @ResolveField('author', () => User)
  async getOwner(@Parent() buylist: Product) {
    const { authorId } = buylist;
    return this.productLoaders.batchAuthors.load(authorId);
  }
}