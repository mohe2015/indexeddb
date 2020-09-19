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
*/

// removing all columns would remove the object store (especially removing the primary key)
export type DatabaseSchemaColumn = {
    //objectStore: string

    primaryKey?: boolean; // only one of this can be in a database but this simplifies merging
    autoIncrement?: boolean; // only one of this can be in a database but this simplifies merging
    //name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
}

function mergeObjectStores<A extends DatabaseObjectStores, B extends DatabaseObjectStores>(state: A, migration: B): A & B {
    let copy: DatabaseObjectStores = {}
    for (const [key, value] of Object.entries(state)) {
        copy[key] = value
    }
    for (const [key, value] of Object.entries(migration)) {
        copy[key] = Object.assign({}, state[key], value)
    }
    return copy as A & B
}

const objectMap = <T, Y>(obj: { [a: string]: T; }, mapFn: (value: T, key: string, index: number) => Y) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, mapFn(v, k, i)]
    )
  )

const objectFilter = <T>(obj: { [a: string]: T; }, filterFn: (value: T, key: string, index: number) => boolean) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([k, v], i) => filterFn(v, k, i)
    )
  )

function removeColumns<OBJECTSTORES extends DatabaseObjectStores, REMOVE extends RemoveColumns<OBJECTSTORES>>
                (objectStores: OBJECTSTORES, removeObjectStores: REMOVE): 
                {
                    [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], keyof REMOVE[K]>>
                } {
    return objectMap(objectStores, (value, key, index) => {
        let removeObjectStoreColumns = removeObjectStores[key]
        return objectFilter(value, (value, key, index) => {
            return removeObjectStoreColumns === undefined || removeObjectStoreColumns[key] === undefined
        })
    }) as { [K in keyof OBJECTSTORES]: Pick<OBJECTSTORES[K], Exclude<keyof OBJECTSTORES[K], keyof REMOVE[K]>>; }
}

// https://developers.google.com/closure/compiler/docs/api-tutorial3