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
GNU Affero General -Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.


SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>

SPDX-License-Identifier: AGPL-3.0-or-later
*/
import {
  Database,
  DatabaseColumn,
  DatabaseConnection,
  DatabaseObjectStore,
  DatabaseObjectStoreOrIndex,
  DatabaseTransaction,
  Type,
  TypeOfProps,
} from './interface';

class IndexedDatabaseConnection extends DatabaseConnection {
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
    return new Promise((resolve, reject) => {
      const databaseOpenRequest = window.indexedDB.open(name, 1);
      databaseOpenRequest.addEventListener('success', (event) => {
        resolve(new IndexedDatabase<SCHEMA>(databaseOpenRequest.result));
      });
      databaseOpenRequest.addEventListener('error', (event) => {
        reject(databaseOpenRequest.error);
      });
      databaseOpenRequest.addEventListener('blocked', (event) => {
        reject(databaseOpenRequest.error);
      });
      databaseOpenRequest.addEventListener('upgradeneeded', (event) => {
        let database = new IndexedDatabase<SCHEMA>(databaseOpenRequest.result);
        let transaction = new IndexedDatabaseTransaction<SCHEMA, keyof SCHEMA>(
          databaseOpenRequest.transaction!,
        );
        try {
          // TODO FIXME await?
          callback(transaction);
          resolve(database);
        } catch (error) {
          databaseOpenRequest.transaction!.abort();
          reject(error);
        }
      });
    });
  }
}

class IndexedDatabase<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> extends Database<SCHEMA> {
  database: IDBDatabase;

  constructor(database: IDBDatabase) {
    super();
    this.database = database;
  }

  async transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(
    objectStores: ALLOWEDOBJECTSTORES[],
    mode: 'readonly' | 'readwrite',
    callback: (
      transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>,
    ) => Promise<void>,
  ): Promise<void> {
    let transaction = new IndexedDatabaseTransaction<
      SCHEMA,
      ALLOWEDOBJECTSTORES
    >(this.database.transaction(objectStores as string[], mode));
    try {
      await callback(transaction);
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
> extends DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {
  transaction: IDBTransaction;

  constructor(transaction: IDBTransaction) {
    super();
    this.transaction = transaction;
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
    return new IndexedDatabaseObjectStoreOrIndex(
      this.transaction.db.createObjectStore(name as string, {
      keyPath: primaryColumnName as string,
      // TODO autoincrement
    }));
  }

  async createColumn<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C, column: DatabaseColumn<T>): Promise<void> {
    // do nothing
  }

  objectStore<NAME extends ALLOWEDOBJECTSTORES, C extends keyof SCHEMA[NAME]>(
    name: NAME,
  ): DatabaseObjectStore<SCHEMA[NAME], C> {
    return new IndexedDatabaseObjectStoreOrIndex(this.transaction.objectStore(name))
  }
}


export class IndexedDatabaseObjectStoreOrIndex<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends DatabaseObjectStoreOrIndex<Type, C> {

  objectStoreOrIndex: IDBObjectStore | IDBIndex

  constructor(objectStoreOrIndex: IDBObjectStore | IDBIndex) {
    super()
    this.objectStoreOrIndex = objectStoreOrIndex
  }

  async get<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined> {
    // TODO FIXME resolve IDBRequest
    this.objectStoreOrIndex.get(key)
  }
}

export class IndexedDatabaseObjectStore<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends IndexedDatabaseObjectStoreOrIndex<Type, C> {

  objectStore: IDBObjectStore

  constructor(objectStore: IDBObjectStore) {
    super(objectStore)
    this.objectStore = objectStore
  }

  // TODO FIXME the database needs to know which columns are indexes
  async index(name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>> {
    return new IndexedDatabaseObjectStoreOrIndex(this.objectStore.index(name));
  }
}


export const create = () => new IndexedDatabaseConnection();
