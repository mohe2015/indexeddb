/*
@dev.mohe/indexeddb - Make a database interface available that works in the browser and in nodejs
Copyright (C) 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.


SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

SPDX-License-Identifier: AGPL-3.0-or-later
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
/* would love to be able to remove this eslint ignore */
import {
  Database,
  DatabaseColumn,
  DatabaseColumnType,
  DatabaseConnection,
  DatabaseObjectStore,
  DatabaseObjectStoreOrIndex,
  DatabaseTransaction,
  dbtypes,
  TypeOfProps,
} from './interface';
import postgres from 'postgres';

// pg and pg-promise have shitty promise support
// currently either use https://github.com/porsager/postgres or https://github.com/malthe/ts-postgres

class PostgresqlDatabaseConnection implements DatabaseConnection {
  async database<
    SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
  >(
    name: string,
    schema: SCHEMA,
    targetVersion: number,
    callback: (
      transaction: DatabaseTransaction<SCHEMA, keyof SCHEMA>,
      oldVersion: number,
    ) => Promise<void>,
  ): Promise<Database<SCHEMA>> {
    const pool = postgres({
      host: '/var/run/postgresql',
      database: name,
    });
    let oldVersion: number;
    const database = new PostgresqlDatabase<SCHEMA>(pool);
    await database.transaction(["migration_info"], "versionchange", async (transaction) => {
      transaction.createObjectStore("migration_info", "key", {
        columnType: DatabaseColumnType.PRIMARY_KEY,
        type: dbtypes.string,
      })
      transaction.createColumn("migration_info", "value", {
        columnType: DatabaseColumnType.PRIMARY_KEY,
        type: dbtypes.string
      })
      const result = await transaction.objectStore("migration_info", "key").get(["value"], "version")
      oldVersion = result?.value || 1
    })
    await database.transaction([], 'versionchange', async (transaction) => {
      await callback(transaction, oldVersion);
      await transaction.objectStore("migration_info" as never, "key").put({
        key: "version",
        value: targetVersion.toString()
      } as TypeOfProps<SCHEMA[never]>)
    });
    return database;
  }
}

class PostgresqlDatabase<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> implements Database<SCHEMA> {
  pool: postgres.Sql<Record<string, never>>;

  constructor(pool: postgres.Sql<Record<string, never>>) {
    this.pool = pool;
  }

  async transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(
    objectStores: ALLOWEDOBJECTSTORES[],
    mode: 'readonly' | 'readwrite' | 'versionchange',
    callback: (
      transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>,
    ) => Promise<void>,
  ): Promise<void> {
    await this.pool.begin(async (sql) => {
      await callback(new PostgresqlDatabaseTransaction(sql));
    });
  }

  async close() {
    await this.pool.end({ timeout: 0 });
  }
}

class PostgresqlDatabaseTransaction<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } },
  ALLOWEDOBJECTSTORES extends keyof SCHEMA
> implements DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {
  client: postgres.TransactionSql<Record<string, never>>;

  constructor(client: postgres.TransactionSql<Record<string, never>>) {
    this.client = client;
  }

  async createObjectStore<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(
    name: NAME,
    primaryColumnName: C,
    primaryColumn: DatabaseColumn<T>,
  ): Promise<DatabaseObjectStore<SCHEMA[NAME], C>> {
    await this.client`CREATE TABLE ${this.client(
      name as string,
    )} (${this.client(primaryColumnName as string)} ${this.client(
      primaryColumn.type.postgresqlType,
    )} PRIMARY KEY)`;
    return new PostgresqlDatabaseObjectStore<SCHEMA[NAME], C>(
      this.client,
      name as string,
      primaryColumnName,
    );
  }

  async createColumn<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C, column: DatabaseColumn<T>): Promise<void> {
    await this.client`ALTER TABLE ${this.client(
      name as string,
    )} ADD COLUMN ${this.client(columnName as string)} ${this.client(
      column.type.postgresqlType,
    )}`;
  }

  objectStore<NAME extends ALLOWEDOBJECTSTORES, C extends keyof SCHEMA[NAME]>(
    name: NAME,
    columnName: C,
  ): DatabaseObjectStore<SCHEMA[NAME], C> {
    return new PostgresqlDatabaseObjectStore(
      this.client,
      name as string,
      columnName,
    );
  }
}

export class PostgresqlObjectStoreOrIndex<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> implements DatabaseObjectStoreOrIndex<Type, C> {
  client: postgres.TransactionSql<Record<string, never>>;

  objectStoreName: string;
  columnName: C;

  constructor(
    client: postgres.TransactionSql<Record<string, never>>,
    objectStoreName: string,
    columnName: C,
  ) {
    this.client = client;
    this.objectStoreName = objectStoreName;
    this.columnName = columnName;
  }

  async count(key: Type[C]['type']['_T']): Promise<number> {
    const result = await this.client`SELECT COUNT(*) FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key}`;
    return result[0].count
  }

  async getKey<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T']> {
    const result = await this.client`SELECT ${this.columnName as string} FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key} LIMIT 1`;
    if (result.length > 0) {
      return result[0];
    } else {
      return undefined;
    }
  }

  async getAll<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<TypeOfProps<Pick<Type, COLUMNS>>[]> {
    const result = await this.client`SELECT ${this.client(
      columns as string[],
    )} FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key}`;
    return result as unknown as Array<TypeOfProps<Pick<Type, COLUMNS>>>;
  }

  async getAllKeys<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T'][]> {
    const result = await this.client`SELECT ${this.columnName as string} FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key}`;
    return result
  }

  async get<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined> {
    const result = await this.client`SELECT ${this.client(
      columns as string[],
    )} FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key} LIMIT 1`;
    if (result.length > 0) {
      return result[0] as TypeOfProps<Pick<Type, COLUMNS>>;
    } else {
      return undefined;
    }
  }
}

export class PostgresqlDatabaseObjectStore<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends PostgresqlObjectStoreOrIndex<Type, C> implements DatabaseObjectStore<Type, C> {
  constructor(
    client: postgres.TransactionSql<Record<string, never>>,
    objectStoreName: string,
    columnName: C,
  ) {
    super(client, objectStoreName, columnName);
  }
  
  async add(value: TypeOfProps<Type>): Promise<void> {
    await this.client`INSERT INTO ${this.client(this.objectStoreName)} (${Object.keys(value)}) VALUES ${Object.values(value)}`;
  }

  async clear(): Promise<void> {
    await this.client`DELETE FROM ${this.client(this.objectStoreName)}`
  }

  async delete(key: Type[C]['type']['_T']): Promise<void> {
    await this.client`DELETE FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key}`
  }
  
  async put(value: TypeOfProps<Type>): Promise<void> {
    await this.client`INSERT INTO ${this.client(this.objectStoreName)} (${Object.keys(value)}) VALUES ${Object.values(value)} ON CONFLICT DO UPDATE`;
  }

  // TODO FIXME the database needs to know which columns are indexes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  index(_name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>> {
    throw new Error('not implemented');
  }
}

export const create = (): PostgresqlDatabaseConnection => new PostgresqlDatabaseConnection();
