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
import { Database, DatabaseColumn, DatabaseConnection, DatabaseObjectStore, DatabaseTransaction } from "./interface";
import PG from 'pg';

class PostgresqlDatabaseConnection extends DatabaseConnection {
    
    async database<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }>(name: string, schema: SCHEMA, targetVersion: number, callback: (database: Database<SCHEMA>) => void): Promise<Database<SCHEMA>> {
        // TODO FIXME version
        let pool = new PG.Pool({
            host: "/var/run/postgresql",
            database: name
        })
        pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err)
        })
        let client = await pool.connect()
        try {
            await client.query('BEGIN');

            let database = new PostgresqlDatabase<SCHEMA>(pool);
            callback(database);

            await client.query('COMMIT')
        } catch (e) {
          await client.query('ROLLBACK');
          console.error(e);
          throw e
        } finally {
          client.release()
        }
    }
}

class PostgresqlDatabase<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> extends Database<SCHEMA> {
    
    pool: PG.Pool

    constructor(pool: PG.Pool) {
        super()
        this.pool = pool
    }
    
    transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(objectStores: ALLOWEDOBJECTSTORES[], mode: "readonly" | "readwrite"): Promise<DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>> {
        throw new Error("Method not implemented.");
    }

}

class PostgresqlDatabaseTransaction<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }, ALLOWEDOBJECTSTORES extends keyof SCHEMA> extends DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {
    objectStore<NAME extends ALLOWEDOBJECTSTORES>(name: NAME): DatabaseObjectStore<SCHEMA[NAME]> {
        throw new Error("Method not implemented.");
    }
}