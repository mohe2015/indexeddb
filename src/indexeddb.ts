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

class IndexedDatabaseConnection implements DatabaseConnection {
  database<
    SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
  >(
    name: string,
    _schema: SCHEMA,
    _targetVersion: number,
    callback: (
      transaction: DatabaseTransaction<SCHEMA, keyof SCHEMA>,
      oldVersion: number,
    ) => Promise<void>,
  ): Promise<Database<SCHEMA>> {
    return new Promise((resolve, reject) => {
      const databaseOpenRequest = window.indexedDB.open(name, 1);
      databaseOpenRequest.addEventListener('success', () => {
        resolve(new IndexedDatabase<SCHEMA>(databaseOpenRequest.result));
      });
      databaseOpenRequest.addEventListener('error', () => {
        reject(databaseOpenRequest.error);
      });
      databaseOpenRequest.addEventListener('blocked', () => {
        reject(databaseOpenRequest.error);
      });
      databaseOpenRequest.addEventListener('upgradeneeded', async (event) => {
        if (databaseOpenRequest.transaction == null) throw new Error("no upgrade transaction")
        const database = new IndexedDatabase<SCHEMA>(databaseOpenRequest.result);
        const transaction = new IndexedDatabaseTransaction<SCHEMA, keyof SCHEMA>(
          databaseOpenRequest.transaction,
        );
        try {
          await callback(transaction, event.oldVersion);
          await transaction.done;
          resolve(database);
        } catch (error) {
          databaseOpenRequest.transaction.abort();
          reject(error);
        }
      });
    });
  }
}

class IndexedDatabase<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> implements Database<SCHEMA> {
  database: IDBDatabase;

  constructor(database: IDBDatabase) {
    this.database = database;
  }

  async transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(
    objectStores: ALLOWEDOBJECTSTORES[],
    mode: 'readonly' | 'readwrite',
    callback: (
      transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>,
    ) => Promise<void>,
  ): Promise<void> {
    const transaction = new IndexedDatabaseTransaction<
      SCHEMA,
      ALLOWEDOBJECTSTORES
    >(this.database.transaction(objectStores as string[], mode));
    try {
      await callback(transaction);
      await transaction.done;
    } catch (e) {
      transaction.transaction.abort();
      throw e;
    }
  }

  async close() {
    this.database.close();
  }
}

class IndexedDatabaseTransaction<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } },
  ALLOWEDOBJECTSTORES extends keyof SCHEMA
> implements DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {
  transaction: IDBTransaction;

  done: Promise<void>

  constructor(transaction: IDBTransaction) {
    this.transaction = transaction;

    // https://catchjs.com/Docs/AsyncAwait
    this.done = new Promise((resolve, reject) => {
      this.transaction.addEventListener('abort', () => {
        console.warn(transaction.error)
        resolve() // TODO FIXME this may be questionable
      })
      this.transaction.addEventListener('complete', () => {
        resolve(/*event*/)
      })
      this.transaction.addEventListener('error', (event) => {
        event.stopPropagation() // as the name implies this prevents propagation
        reject(transaction.error)
      })
    })
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
    return new IndexedDatabaseObjectStore(
      this.transaction.db.createObjectStore(name as string, {
      keyPath: primaryColumnName as string,
      autoIncrement: primaryColumn.type.postgresqlType == "SERIAL" // TODO FIXME
    }));

    // keyPath set (it's just a normal column)
    // autoincremennt sets column type to serial
    
    // keypath not set (for postgresql it's just an extra column)
    // maybe reserve a name for that? and abstract it away? with a special type?

    // DOTHIS: maybe just don't allow an unset keyPath?

    // https://golb.hplar.ch/2017/09/A-closer-look-at-IndexedDB.html
    // An out-of-line key is stored separately from the value. It has the advantage that the application can store not only JavaScript objects but also primitive data types like string and numbers as the value of the record.
  }

  async createColumn<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  >(name: NAME, columnName: C, column: DatabaseColumn<T>): Promise<void> {
    // do nothing
  }

  objectStore<NAME extends ALLOWEDOBJECTSTORES, C extends keyof SCHEMA[NAME]>(
    name: NAME,
  ): DatabaseObjectStore<SCHEMA[NAME], C> {
    return new IndexedDatabaseObjectStore(this.transaction.objectStore(name as string))
  }
}

function handleRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('error', (event) => {
      event.stopPropagation() // as the name implies this prevents propagation
      reject(request.error)
    })
    request.addEventListener('success', () => {
      resolve(request.result)
    })
  })
}

export class IndexedDatabaseObjectStoreOrIndex<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> implements DatabaseObjectStoreOrIndex<Type, C> {
  objectStoreOrIndex: IDBObjectStore | IDBIndex

  constructor(objectStoreOrIndex: IDBObjectStore | IDBIndex) {
    this.objectStoreOrIndex = objectStoreOrIndex
  }

  async get<COLUMNS extends keyof Type>(
    _columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined> {
    return await handleRequest(this.objectStoreOrIndex.get(key))
  }

  async count<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<number> {
    return await handleRequest(this.objectStoreOrIndex.count(key))
  }
  async getKey<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T']> {
    return await handleRequest(this.objectStoreOrIndex.getKey(key))
  }
  async getAll<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<TypeOfProps<Pick<Type, COLUMNS>>[]> {
    return await handleRequest(this.objectStoreOrIndex.getAll(key))
  }
  async getAllKeys<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]['type']['_T']): Promise<Type[C]['type']['_T'][]> {
    return await handleRequest(this.objectStoreOrIndex.getAllKeys(key))
  }
}

export class IndexedDatabaseObjectStore<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends IndexedDatabaseObjectStoreOrIndex<Type, C> implements DatabaseObjectStore<Type, C>  {
  objectStore: IDBObjectStore

  constructor(objectStore: IDBObjectStore) {
    super(objectStore)
    this.objectStore = objectStore
  }

  // TODO FIXME the database needs to know which columns are indexes
  async index(name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>> {
    return new IndexedDatabaseObjectStoreOrIndex(this.objectStore.index(name));
  }

  async add(value: TypeOfProps<Type>): Promise<void> {
    await handleRequest(this.objectStore.add(value))
  }

  async clear(): Promise<void> {
    await handleRequest(this.objectStore.clear())
  }

  async delete(key: Type[C]['type']['_T']): Promise<void> {
    await handleRequest(this.objectStore.delete(key))
  }

  async put(value: TypeOfProps<Type>): Promise<void> {
    await handleRequest(this.objectStore.put(value))
  }
}

export const create = (): IndexedDatabaseConnection => new IndexedDatabaseConnection();
