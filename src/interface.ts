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

// inspired by https://github.com/gcanti/io-ts

class Type<T> {
    _T!: T
}

export interface Any extends Type<any> {}

const dbtypes = {
    string: new Type<string>(),
    number: new Type<number>(),
};

// what we want:

// creating and deleting objectStores, columns, indexes (one by one?)
// I'm not sure about the migration support, it complicated things a lot
// 

let testUser = {
    name: dbtypes.string,
    age: dbtypes.number
}

type TypeOf<O extends Any> = O['_T'];
type TypeOfProps<O extends { [a: string]: Any }> = { [k in keyof O]: TypeOf<O[k]> };

type User = TypeOfProps<typeof testUser>

// LOL