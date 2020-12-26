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
export {};

// there will not be migration support at first. instead I will try to implement an
// unified interface to do the migration (which is only possible when opening the database because of indexeddb)

// inspired by https://github.com/gcanti/io-ts

// https://v8.dev/blog/fast-async info about async

export class Type<T> {
  _T!: T;
  postgresqlType: string;

  constructor(postgresqlType: string) {
    this.postgresqlType = postgresqlType;
  }
}

export type Any = Type<any>

export enum DatabaseColumnType {
  DEFAULT,
  INDEX,
  PRIMARY_KEY,
}

export type DatabaseColumn<T> = {
  type: Type<T>;
  columnType: DatabaseColumnType;
};

export const dbtypes = {
  string: new Type<string>('TEXT'),
  number: new Type<number>('INTEGER'),
};

// TODO FIXME generalize
export type TypeOf<O extends Any> = O['_T'];
export type TypeOfProps<O extends { [a: string]: DatabaseColumn<any> }> = {
  [k in keyof O]: TypeOf<O[k]['type']>;
};
export type TypeOfTypeOfProps<
  O extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> = { [k in keyof O]: TypeOfProps<O[k]> };

export abstract class DatabaseConnection {
  abstract database<
    SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
  >(
    name: string,
    schema: SCHEMA,
    targetVersion: number,
    callback: (
      transaction: DatabaseTransaction<SCHEMA, keyof SCHEMA>,
    ) => Promise<void>,
  ): Promise<Database<SCHEMA>>;
}

export abstract class Database<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> {
  abstract transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(
    objectStores: ALLOWEDOBJECTSTORES[],
    mode: 'readonly' | 'readwrite',
    callback: (
      transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>,
    ) => Promise<void>,
  ): Promise<void>;

  abstract close(): Promise<void>;
}

export abstract class DatabaseTransaction<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } },
  ALLOWEDOBJECTSTORES extends keyof SCHEMA
> {
  abstract createObjectStore<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(
    name: NAME,
    primaryColumnName: C,
    primaryColumn: DatabaseColumn<T>,
  ): Promise<DatabaseObjectStore<SCHEMA[NAME], C>>;

  abstract createColumn<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C, column: DatabaseColumn<T>): Promise<void>;

  abstract objectStore<
    NAME extends ALLOWEDOBJECTSTORES,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C): DatabaseObjectStore<SCHEMA[NAME], C>;
}

export abstract class DatabaseObjectStoreOrIndex<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> {
  abstract get<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined>;
}

export abstract class DatabaseObjectStore<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends DatabaseObjectStoreOrIndex<Type, C> {
  // TODO FIXME the database needs to know which columns are indexes
  abstract index(name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>>;
}
