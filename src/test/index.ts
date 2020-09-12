import type { DatabaseColumns, DatabaseSchema, DatabaseSchemaColumn, Migration } from "../interface.js";
import { migrate } from "../interface.js";
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
*/
// @ts-check

import { create } from "../browser";
import type { IsExact, IsNever } from "@dev.mohe/conditional-type-checks";
import type { magicNeverToEmpty, dictionaryIntersection } from '../interface'

// {} is okay, nonempty object is not okayj, never is okay

type a = Pick<never, keyof {}>
type b = Pick<{}, keyof {}>
type c = Pick<{test: null}, keyof {test: null}>


async function run() {
    try {
        let databaseConnection = await create("localhost");

        let objectStores = {
            test: {
                namee: {
                    keyPath: "name",
                },
                valuee: {
                    keyPath: "value",
                }
            },
        } as const

        let baseSchema = {
            version: 1,
            objectStores
        } as const

        let addedColumns = {
            test: {
                name: {
                    keyPath: "name",
                },
                value: {
                    keyPath: "value",
                }
            },
            adf: {

            }
        } as const

        let removedColumns = {} as const

        let aa: magicNeverToEmpty<dictionaryIntersection<typeof objectStores, typeof addedColumns>, keyof (typeof objectStores) & keyof (typeof addedColumns)> = true
        
        let migration1: Migration<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, true, true, 1, 2>  = {
            noDuplicateColumnsAlwaysFalse: true,
            noNonexistentRemovesAlwaysTrue: true,
            fromVersion: 1,
            toVersion: 2,
            baseSchema,
            addedColumns,
            removedColumns,
        } as const
        
        let migration2 = {
            noDuplicateColumnsAlwaysFalse: false,
            noNonexistentRemovesAlwaysTrue: true,
            fromVersion: 2,
            toVersion: 3,
            baseSchema: migrate<typeof objectStores, typeof baseSchema, typeof addedColumns, typeof removedColumns, true, true, 1, 2, typeof migration1>(migration1),
            addedColumns: {},
            removedColumns: {"test": {"name": null}}
        } as const
        
        let migration3 = {
            noDuplicateColumnsAlwaysFalse: false,
            noNonexistentRemovesAlwaysTrue: true,
            fromVersion: 3,
            toVersion: 4,
            baseSchema: migrate(migration2),
            addedColumns: {
                "test": {
                    "valuee": {
                        keyPath: "name",
                    }
                }
            },
            removedColumns: {}
        } as const

        let result = migrate(migration3)

        //let a: keyof (typeof result["columns"]) = null

       // let database = await databaseConnection.database("blub", result, [migration1, migration2, migration3])
        //console.log(database)

    } catch (error) {
        console.error(error)
        alert(error)
    }

}

run()