import { Inject } from '@nestjs/common';

export function getRepositoryToken(entity: any, dataSourceName?: string): string {
  const entityName = typeof entity === 'function' ? entity.name : entity;
  return dataSourceName ? `${dataSourceName}_${entityName}Repository` : `${entityName}Repository`;
}

export function InjectRepository(entity: any, dataSourceName?: string) {
  return Inject(getRepositoryToken(entity, dataSourceName));
}

export class TypeOrmModule {
  static forRoot(options?: any) {
    return { module: TypeOrmModule, providers: [], exports: [] };
  }
  static forFeature(entities?: any[], dataSourceName?: string) {
    return { module: TypeOrmModule, providers: [], exports: [] };
  }
}
