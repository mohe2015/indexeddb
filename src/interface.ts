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

const dbtypes = {
    string: new Type<string>(),
    number: new Type<number>(),
};

let users = {
    name: dbtypes.string,
    age: dbtypes.number
}

// TODO FIXME generalize
type TypeOf<O extends Any> = O['_T'];
type TypeOfProps<O extends { [a: string]: Any }> = { [k in keyof O]: TypeOf<O[k]> };
type TypeOfTypeOfProps<O extends { [a: string]: { [b: string]: Any } }> = { [k in keyof O]: TypeOfProps<O[k]> };

type Users = TypeOfProps<typeof users>

// LOL

const objectStores = {
    users
}

type ObjectStores = TypeOfTypeOfProps<typeof objectStores>

let a: ObjectStores = {} as ObjectStores;

a.users.age