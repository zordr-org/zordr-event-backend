#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2960d63810a42e878d2d1021b39ef135335d0f3abdc23c77561a9247fdc665f5/contract';
import endContract from '../../snapshots/2960d63810a42e878d2d1021b39ef135335d0f3abdc23c77561a9247fdc665f5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c83e34d89c313bfa8d2ad43f78065b73b1c3a2de5f05de3c0070d54b8a0f9a34/contract';
import startContract from '../../snapshots/c83e34d89c313bfa8d2ad43f78065b73b1c3a2de5f05de3c0070d54b8a0f9a34/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('branch', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('college', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('domain_email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sso_providers', 'text[]', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('year', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'user_sso_providers_elem_not_null_1a72fc3a',
            'array_position("sso_providers", NULL) IS NULL',
          ),
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
