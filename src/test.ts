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
/*
schema (empty)

-> migration (schema with migration)

-> newschema (old migration with old schema)

-> migration

-> newschema (old migration with old schema with old migration with old schema)
*/
export {}

interface TestSchema<VERSION extends number> {
    version: VERSION
}

interface TestMigration<FROMVERSION extends number, TOVERSION extends number> {
    schema: TestSchema<FROMVERSION>
    toVersion: TOVERSION
}

interface TestSchemaWithMigration<FROMVERSION extends number, TOVERSION extends number> extends TestSchema<TOVERSION> {
    migration: TestMigration<FROMVERSION, TOVERSION>
}

let schema1: TestSchema<1> = {
    version: 1
}

let migration1_2: TestMigration<1, 2> = {
    schema: schema1,
    toVersion: 2
}

let schema2: TestSchemaWithMigration<1, 2> = {
    migration: migration1_2,
    version: 2
}