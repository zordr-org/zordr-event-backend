#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2960d63810a42e878d2d1021b39ef135335d0f3abdc23c77561a9247fdc665f5/contract';
import startContract from '../../snapshots/2960d63810a42e878d2d1021b39ef135335d0f3abdc23c77561a9247fdc665f5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c1e9dd2bef6ef0ee27331a1343c5efb7b6a53a03bf45d0b35bf32c9af851fe47/contract';
import endContract from '../../snapshots/c1e9dd2bef6ef0ee27331a1343c5efb7b6a53a03bf45d0b35bf32c9af851fe47/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'organizer', column: 'id' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'user',
        constraint: 'user_sso_providers_elem_not_null_1a72fc3a',
      }),
      this.dropColumn({ schema: 'public', table: 'user', column: 'password_hash' }),
      this.dropColumn({ schema: 'public', table: 'user', column: 'sso_providers' }),
      this.createTable({
        schema: 'public',
        table: 'adminEmployee',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('failedLoginCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lockedUntil', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('twoFactorEnabled', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('twoFactorSecret', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'auditLog',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('entityId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entityType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'refreshToken',
        columns: [
          col('adminId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'organizer',
        column: col('userId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-organizer-userId', {
        check: () => placeholder('backfill-organizer-userId:check'),
        run: () => placeholder('backfill-organizer-userId:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'organizer', column: 'userId' }),
      this.dataTransform(endContract, 'typechange-event-organizerId', {
        check: () => placeholder('typechange-event-organizerId:check'),
        run: () => placeholder('typechange-event-organizerId:run'),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'event',
        column: 'organizerId',
        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),
      this.dataTransform(endContract, 'typechange-organizer-id', {
        check: () => placeholder('typechange-organizer-id:check'),
        run: () => placeholder('typechange-organizer-id:run'),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'organizer',
        column: 'id',
        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),
      this.addUnique({
        schema: 'public',
        table: 'adminEmployee',
        constraint: 'adminEmployee_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'organizer',
        constraint: 'organizer_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'refreshToken',
        constraint: 'refreshToken_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refreshToken',
        index: 'refreshToken_adminId_idx_530179db',
        columns: ['adminId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organizer',
        foreignKey: {
          name: 'organizer_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refreshToken',
        foreignKey: {
          name: 'refreshToken_adminId_fkey',
          columns: ['adminId'],
          references: { schema: 'public', table: 'adminEmployee', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
