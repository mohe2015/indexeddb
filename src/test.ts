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
export {}

// correct
interface TestSchema<VERSION extends number, OBJECTSTORES extends any> {
    version: VERSION
    objectStores: OBJECTSTORES
}

// correct
interface TestMigration<FROMVERSION extends number, TOVERSION extends number, OBJECTSTORES extends any, ADD extends any, SCHEMA extends TestSchema<FROMVERSION, OBJECTSTORES>> {
    fromSchema: SCHEMA
    toVersion: TOVERSION
    add: ADD
}

// correct
interface TestSchemaWithMigration<FROMVERSION extends number, TOVERSION extends number, OBJECTSTORES extends any, ADD extends any, OLDSCHEMA extends TestSchema<FROMVERSION, OBJECTSTORES>> extends TestSchema<TOVERSION, OBJECTSTORES & ADD> {
    fromMigration: TestMigration<FROMVERSION, TOVERSION, OBJECTSTORES, ADD, OLDSCHEMA>
}

let schema1: TestSchema<1, {}> = {
    version: 1,
    objectStores: {}
}

let migration1_2: TestMigration<1, 2, {}, {test: {}}, typeof schema1> = {
    fromSchema: schema1,
    toVersion: 2,
    add: {test: {}}
}

let schema2: TestSchemaWithMigration<1, 2, {}, {test: {}}, typeof schema1> = {
    fromMigration: migration1_2,
    version: 2,
    objectStores: {test: {}}
}

let migration2_3: TestMigration<2, 3, {test: {}}, {jojo: {}}, typeof schema2> = {
    fromSchema: schema2,
    toVersion: 3,
    add: {jojo: {}}
}

let schema3: TestSchemaWithMigration<2, 3, {test: {}}, {jojo: {}}, typeof schema2> = {
    fromMigration: migration2_3,
    version: 3,
    objectStores: {test: {}, jojo: {}}
}

let schema = schema3.fromMigration.fromSchema

if ("fromMigration" in schema) {
    schema.fromMigration.fromSchema.objectStores
}