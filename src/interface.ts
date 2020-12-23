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
export {}

// there will not be migration support at first. instead I will try to implement an
// unified interface to do the migration (which is only possible when opening the database because of indexeddb)


// inspired by https://github.com/gcanti/io-ts

class Type<T> {
    _T!: T;
}

export interface Any extends Type<any> {}

export type DatabaseColumn<T> = {
    type: Type<T>,
    index?: boolean
}

const dbtypes = {
    string: new Type<string>(),
    number: new Type<number>(),
};

let users = {
    name: {
        type: dbtypes.string,
    },
    age: {
        type: dbtypes.number,
    },
}

let posts = {
    title: {
        type: dbtypes.string,
    },
    content: {
        type: dbtypes.string
    },
}

// TODO FIXME generalize
type TypeOf<O extends Any> = O['_T'];
type TypeOfProps<O extends { [a: string]: DatabaseColumn<any> }> = { [k in keyof O]: TypeOf<O[k]["type"]> };
type TypeOfTypeOfProps<O extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> = { [k in keyof O]: TypeOfProps<O[k]> };

type Users = TypeOfProps<typeof users>

// LOL

const objectStores = {
    users,
    posts
}

type ObjectStores = TypeOfTypeOfProps<typeof objectStores>

let a: ObjectStores = {} as ObjectStores;

a.users.age

export abstract class DatabaseConnection {

    abstract database<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }>(name: string, schema: SCHEMA, targetVersion: number, callback: (transaction: DatabaseTransaction<SCHEMA, any>) => void): Promise<Database<SCHEMA>>
}

export abstract class Database<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> {

    abstract transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(objectStores: ALLOWEDOBJECTSTORES[], mode: "readonly" | "readwrite", callback: (transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>) => void): Promise<void>
}

export abstract class DatabaseTransaction<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }, ALLOWEDOBJECTSTORES extends keyof SCHEMA> {

    abstract createObjectStore<NAME extends ALLOWEDOBJECTSTORES>(name: string, options: IDBObjectStoreParameters): Promise<DatabaseObjectStore<SCHEMA[NAME]>>

    abstract objectStore<NAME extends ALLOWEDOBJECTSTORES>(name: NAME): DatabaseObjectStore<SCHEMA[NAME]>
}

export abstract class DatabaseObjectStoreOrIndex<Type extends { [a: string]: DatabaseColumn<any> }> {

    abstract get<COLUMNS extends keyof Type>(columns: COLUMNS[]): TypeOfProps<Pick<Type, COLUMNS>>;
}

export abstract class DatabaseObjectStore<Type extends { [a: string]: DatabaseColumn<any> }> extends DatabaseObjectStoreOrIndex<Type> {

    // TODO FIXME the database needs to know which columns are indexes
    abstract index(name: string): Promise<DatabaseObjectStoreOrIndex<Type>>
}

let connection: DatabaseConnection = null!;

let database = await connection.database("test", objectStores, 1, (transaction) => {
    
});

await database.transaction(["users", "users"], "readonly", (transaction) => {

    let objectStore = transaction.objectStore("users")

    let value = objectStore.get(["name"])

    value.name
});
