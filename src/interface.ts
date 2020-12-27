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

export interface DatabaseConnection {
  database<
    SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
  >(
    name: string,
    schema: SCHEMA,
    targetVersion: number,
    callback: (
      transaction: DatabaseTransaction<SCHEMA, keyof SCHEMA>,
      oldVersion: number,
    ) => Promise<void>,
  ): Promise<Database<SCHEMA>>;
}

export interface Database<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }
> {
  transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(
    objectStores: ALLOWEDOBJECTSTORES[],
    mode: 'readonly' | 'readwrite',
    callback: (
      transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>,
    ) => Promise<void>,
  ): Promise<void>;

  close(): Promise<void>;
}

export interface DatabaseTransaction<
  SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } },
  ALLOWEDOBJECTSTORES extends keyof SCHEMA
> {
  createObjectStore<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(
    name: NAME,
    primaryColumnName: C,
    primaryColumn: DatabaseColumn<T>,
  ): Promise<DatabaseObjectStore<SCHEMA[NAME], C>>;

  createColumn<
    NAME extends ALLOWEDOBJECTSTORES,
    T,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C, column: DatabaseColumn<T>): Promise<void>;

  objectStore<
    NAME extends ALLOWEDOBJECTSTORES,
    C extends keyof SCHEMA[NAME]
  >(name: NAME, columnName: C): DatabaseObjectStore<SCHEMA[NAME], C>;
}

export interface DatabaseObjectStoreOrIndex<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> {
  get<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined>;

  count(
    key: Type[C]['type']['_T'],
  ): Promise<number>;

  // TODO FIXME keyrange
  getKey<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<Type[C]['type']['_T']>;

  getAll<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<Array<TypeOfProps<Pick<Type, COLUMNS>>>>;

  getAllKeys<COLUMNS extends keyof Type>(
    columns: COLUMNS[],
    key: Type[C]['type']['_T'],
  ): Promise<Array<Type[C]['type']['_T']>>;

  // TODO FIXME openCursor, openKeyCursor
}

export interface DatabaseObjectStore<
  Type extends { [a: string]: DatabaseColumn<any> },
  C extends keyof Type
> extends DatabaseObjectStoreOrIndex<Type, C> {
  // TODO FIXME the database needs to know which columns are indexes
 index(name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>>;

  add(
    value: TypeOfProps<Type>
  ): Promise<void>

  clear(): Promise<void>

  delete(
    key: Type[C]['type']['_T'],
  ): Promise<void>;

  put(
    value: TypeOfProps<Type>
  ): Promise<void>
}
