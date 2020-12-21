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

import { Pool } from 'pg';
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
    let pool = new Pool({
      host: "/var/run/postgresql",
      database: name
    })
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err)
    })
   
    let client = await pool.connect()
    try {
      await client.query('BEGIN');

      let migrations = await client.query('CREATE TABLE _config IF NOT EXISTS (key VARCHAR, value VARCHAR)');
    
      let result = await client.query('SELECT value FROM _config WHERE key = "version" LIMIT 1');
      const [{version = 1}] = result.rows
      console.log(version)

      if (version < schema.version) {
        let migrations = getOutstandingMigrations(schema, version);

        // this could should be really similar to the one in browser.ts
        for (const migration of migrations) {
          console.log('running migration: ', migration);
          for (const [objectStoreName, objectStore] of Object.entries(
            migration.removedColumns,
          )) {
            for (const [columnName, column] of Object.entries(objectStore)) {
              if ('primaryKeyOptions' in column) {
                console.log('delete object store: ', objectStoreName);
                // @ts-expect-error
                await database.dropCollection(objectStoreName, { session });
              } else if ('indexOptions' in column) {
                console.log(
                  `delete index without removing data: ${objectStoreName}.${columnName}`,
                );
                //await database
                //  .collection(objectStoreName)
                //  .dropIndex(columnName, { session });
              } else {
                //if (!(await database.collections()).some(collection => collection.collectionName === objectStoreName)) {
                //  throw new Error(`tried deleting column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`)
                //}
                console.log(
                  `delete column without removing data ${objectStoreName}.${columnName}`,
                );
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
                 n//await database.createCollection(objectStoreName, {
                  //  session,
                  //});
                  //await database
                  //  .collection(objectStoreName)
                  //  .createIndex(columnName, { unique: true, session });
                }
              } else if ('indexOptions' in column) {
                console.log(
                  `add index without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                  column.indexOptions,
                );
                //await database
                //  .collection(objectStoreName)
                //  .createIndex(columnName, {
                //    unique: column.indexOptions.unique,
                //    session,
                //  });
              } else {
                //if (!(await database.collections()).some(collection => collection.collectionName === objectStoreName)) {
                //  throw new Error(`tried adding column ${objectStoreName}.${columnName} but object store ${objectStoreName} does not exist!`)
                //}
                console.log(
                  `add column without adding data [WARNING: no default value can break database queries]: ${objectStoreName}.${columnName}`,
                );
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
  pool: Pool;

  constructor(pool: Pool) {
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
