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
import type {
  Database,
  DatabaseColumn,
  DatabaseConnection,
  DatabaseObjectStore,
  DatabaseObjectStoreOrIndex,
  DatabaseTransaction,
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
    ) => Promise<void>,
  ): Promise<Database<SCHEMA>> {
    const pool = postgres({
      host: '/var/run/postgresql',
      database: name,
    });
    const database = new PostgresqlDatabase<SCHEMA>(pool);
    await database.transaction([], 'versionchange', callback);
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

  count<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<number> {
    throw new Error('Method not implemented.');
  }
  getKey<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T']> {
    throw new Error('Method not implemented.');
  }
  getAll<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<TypeOfProps<Pick<Type, COLUMNS>>[]> {
    throw new Error('Method not implemented.');
  }
  getAllKeys<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T'][]> {
    throw new Error('Method not implemented.');
  }

  async get<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined> {
    const result = await this.client`SELECT ${this.client(
      columns as string[],
    )} FROM ${this.client(this.objectStoreName)} WHERE ${
      this.columnName as string
    } = ${key}`;
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
  
  add(key: Type[C]['type']['_T'], value: TypeOfProps<Type>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  clear(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(key: Type[C]['type']['_T']): Promise<void> {
    throw new Error('Method not implemented.');
  }
  put(key: Type[C]['type']['_T'], value: TypeOfProps<Type>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  count<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<number> {
    throw new Error('Method not implemented.');
  }
  getKey<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T']> {
    throw new Error('Method not implemented.');
  }
  getAll<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<TypeOfProps<Pick<Type, COLUMNS>>[]> {
    throw new Error('Method not implemented.');
  }
  getAllKeys<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T'][]> {
    throw new Error('Method not implemented.');
  }

  // TODO FIXME the database needs to know which columns are indexes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  index(_name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>> {
    throw new Error('not implemented');
  }
}

export const create = (): PostgresqlDatabaseConnection => new PostgresqlDatabaseConnection();
