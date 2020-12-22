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

import PG from 'pg';
import {
  Database,
  DatabaseConnection,
  DatabaseSchemaObjectStore,
  DatabaseObjectStores,
  DatabaseSchemaWithMigration,
  DatabaseSchemaWithoutMigration,
  ExcludeStrict,
  ExtractStrict,
  OmitStrict,
  WithoutKeysOf,
  DatabaseTransaction,
  DatabaseObjectStore,
  DatabaseCursor,
  DatabaseObjectStoreOrIndex,
} from './interface.js';
import { getOutstandingMigrations } from './utils.js';

export class PostgresqlDatabaseConnection extends DatabaseConnection {

  constructor() {
    super();
  }

  static async create(uri: string): Promise<PostgresqlDatabaseConnection> {
    return new PostgresqlDatabaseConnection();
  }

  async close() {
  }

  async database<
    FROMVERSION extends number,
    TOVERSION extends number,
    OLDOBJECTSTORES extends DatabaseObjectStores,
    REMOVED extends DatabaseObjectStores,
    ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
    AFTERREMOVED extends {
      [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<
        OLDOBJECTSTORES[K],
        keyof REMOVED[K]
      >;
    } &
      {
        [K in ExcludeStrict<
          keyof OLDOBJECTSTORES,
          keyof REMOVED
        >]: OLDOBJECTSTORES[K];
      },
    OLDSCHEMA extends DatabaseSchemaWithoutMigration<
      FROMVERSION,
      OLDOBJECTSTORES
    >,
    SCHEMA extends DatabaseSchemaWithMigration<
      FROMVERSION,
      TOVERSION,
      OLDOBJECTSTORES,
      REMOVED,
      ADDED,
      AFTERREMOVED,
      OLDSCHEMA
    >
  >(
    name: string,
    schema: SCHEMA,
  ): Promise<
    Database<
      FROMVERSION,
      TOVERSION,
      OLDOBJECTSTORES,
      REMOVED,
      ADDED,
      AFTERREMOVED,
      OLDSCHEMA,
      SCHEMA
    >
  > {
    let pool = new PG.Pool({
      host: "/var/run/postgresql",
      database: name
    })
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err)
    })
   
    let client = await pool.connect()
    try {
      await client.query('BEGIN');

      await client.query('CREATE TABLE IF NOT EXISTS _config (key VARCHAR, value VARCHAR)');
    
      let result = await client.query(`SELECT value FROM _config WHERE key = 'version' LIMIT 1`);
      const [row = {value: 1}] = result.rows
      const version = row.value
      console.log(version)

      if (version < schema.version) {
        let migrations = getOutstandingMigrations(schema, version);

        // this should be really similar to the one in browser.ts
        for (const migration of migrations) {
          console.log('running migration: ', migration);
          for (const [objectStoreName, objectStore] of Object.entries(
            migration.removedColumns,
          )) {
            for (const [columnName, column] of Object.entries(objectStore)) {
              if ('primaryKeyOptions' in column) {
                console.log('delete object store: ', objectStoreName);

                // TODO FIXME document that the migrations are subject to sql injection
                await client.query(`DROP TABLE ${objectStoreName}`)
              } else if ('indexOptions' in column) {
                console.log(
                  `delete index: ${objectStoreName}.${columnName}`,
                );
                await client.query(`DROP INDEX ${objectStoreName}_${columnName}`)
              } else {
                console.log(
                  `delete column (removing data!): ${objectStoreName}.${columnName}`,
                );
                await client.query(`ALTER TABLE ${objectStoreName} DROP COLUMN ${columnName}`)
              }
            }
          }
          for (const [objectStoreName, objectStore] of Object.entries<
            DatabaseSchemaObjectStore
          >(migration.addedColumns)) {
            for (const [columnName, column] of Object.entries(objectStore)) {
              if ('primaryKeyOptions' in column) {
                console.log(
                  `create object store: ${objectStoreName}`,
                  column.primaryKeyOptions,
                );
                if (column.primaryKeyOptions.autoIncrement) {
                  if (columnName !== '_id') {
                    throw new Error(
                      'mongodb only supports autoincrement primary keys named _id',
                    );
                  }
                } else {
                  // TODO FIXME type
                  await client.query(`CREATE TABLE ${objectStoreName} (${columnName} INTEGER PRIMARY KEY)`)
                }
              } else if ('indexOptions' in column) {
                console.log(
                  `add index without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                  column.indexOptions,
                );
                await client.query(`CREATE ${column.indexOptions.unique ? "UNIQUE" : ""} INDEX ${objectStoreName}_${columnName} ON ${objectStoreName} (${columnName})`)
              } else {
                console.log(
                  `add column without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                );
                // TODO FIXME type
                await client.query(`ALTER TABLE ${objectStoreName} ADD COLUMN ${columnName} BSON`)
              }
            }
          }
        }
      }

      //await migrations.updateOne(
      //  { key: 'version' },
      //  { $set: { value: schema.version } },
      //  { upsert: true, session },
      //);
      /*} catch (error) {
        if (error instanceof MongoDB.MongoError) {
          console.log("mongodb error while migrating ", error)
        } else {
          console.log("unknown error while migrating ", error)
        }
        console.log("aborting transaction...")
        await session.abortTransaction()
      }*/
        
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e);
      throw e
    } finally {
      client.release()
    }
    return new PostgresqlDatabase(pool);
  }
}

export class PostgresqlDatabase<
  FROMVERSION extends number,
  TOVERSION extends number,
  OLDOBJECTSTORES extends DatabaseObjectStores,
  REMOVED extends DatabaseObjectStores,
  ADDED extends WithoutKeysOf<OLDOBJECTSTORES>,
  AFTERREMOVED extends {
    [K in ExtractStrict<keyof OLDOBJECTSTORES, keyof REMOVED>]: OmitStrict<
      OLDOBJECTSTORES[K],
      keyof REMOVED[K]
    >;
  } &
    {
      [K in ExcludeStrict<
        keyof OLDOBJECTSTORES,
        keyof REMOVED
      >]: OLDOBJECTSTORES[K];
    },
  OLDSCHEMA extends DatabaseSchemaWithoutMigration<
    FROMVERSION,
    OLDOBJECTSTORES
  >,
  SCHEMA extends DatabaseSchemaWithMigration<
    FROMVERSION,
    TOVERSION,
    OLDOBJECTSTORES,
    REMOVED,
    ADDED,
    AFTERREMOVED,
    OLDSCHEMA
  >
> extends Database<
  FROMVERSION,
  TOVERSION,
  OLDOBJECTSTORES,
  REMOVED,
  ADDED,
  AFTERREMOVED,
  OLDSCHEMA,
  SCHEMA
> {
  pool: PG.Pool;

  constructor(pool: PG.Pool) {
    super();
    this.pool = pool;
  }

  async transaction(objectStores: string[], mode: "readonly" | "readwrite"): Promise<DatabaseTransaction> {
    return new PostgresqlTransaction()
  }

  // TODO FIXME add to interface
  async close() {
    await this.pool.end()
  }
}

export class PostgresqlTransaction extends DatabaseTransaction {
  done: Promise<void>

  constructor() {
    super()
    this.done = (async () => {})()
  }
  
  objectStore(name: string): PostgresqlObjectStore {
    return new PostgresqlObjectStore()
  }
}

export class PostgresqlObjectStore extends DatabaseObjectStore {

  constructor() {
    super()
  }

  async add(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async clear(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async delete(key: IDBValidKey): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async index(name: string): Promise<DatabaseObjectStoreOrIndex> {
    throw new Error('Method not implemented.');
  }

  async put(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async count(key?: IDBValidKey): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async get(key: IDBValidKey): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async getKey(key: IDBValidKey): Promise<string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAll(key?: IDBValidKey, count?: number): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getAllKeys(key?: IDBValidKey, count?: number): Promise<IDBValidKey[]> {
    throw new Error('Method not implemented.');
  }

  async openCursor(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): Promise<DatabaseCursor> {
    throw new Error('Method not implemented.');
  }

  async openKeyCursor(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): Promise<IDBCursor | null> {
    throw new Error('Method not implemented.');
  }
}

export const create = PostgresqlDatabaseConnection.create;
