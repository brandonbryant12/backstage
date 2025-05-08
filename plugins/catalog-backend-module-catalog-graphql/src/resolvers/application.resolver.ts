import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { ApplicationService } from '../services/application.service';

@Resolver('Application')
export class ApplicationResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query('applicationById')
  async getApplicationById(@Args('id') id: string) {
    return this.applicationService.findById(id);
  }

  // ── Field resolvers (one per field) ────────────────────────────────

  @ResolveField()
  id(@Parent() root: any) {
    return root.id;
  }

  @ResolveField()
  name(@Parent() root: any) {
    return root.name;
  }

  @ResolveField()
  description(@Parent() root: any) {
    return root.description;
  }
}