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
import { Database, DatabaseColumn, DatabaseConnection, DatabaseObjectStore, DatabaseObjectStoreOrIndex, DatabaseTransaction, TypeOfProps } from "./interface.js";
import PG from 'pg';

class PostgresqlDatabaseConnection extends DatabaseConnection {
    
    async database<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }>(name: string, schema: SCHEMA, targetVersion: number, callback: (transaction: DatabaseTransaction<SCHEMA, keyof SCHEMA>) => Promise<void>): Promise<Database<SCHEMA>> {
        let pool = new PG.Pool({
            host: "/var/run/postgresql",
            database: name
        })
        pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err)
        })
        let database = new PostgresqlDatabase<SCHEMA>(pool);
        await database.transaction([], "versionchange", callback);
        return database
    }
}

class PostgresqlDatabase<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }> extends Database<SCHEMA> {
    
    pool: PG.Pool

    constructor(pool: PG.Pool) {
        super()
        this.pool = pool
    }
    
    async transaction<ALLOWEDOBJECTSTORES extends keyof SCHEMA>(objectStores: ALLOWEDOBJECTSTORES[], mode: "readonly" | "readwrite" | "versionchange", callback: (transaction: DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES>) => Promise<void>): Promise<void> {
        let client = await this.pool.connect()
        try {
            await client.query('BEGIN');
            await callback(new PostgresqlDatabaseTransaction(client));
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

class PostgresqlDatabaseTransaction<SCHEMA extends { [a: string]: { [b: string]: DatabaseColumn<any> } }, ALLOWEDOBJECTSTORES extends keyof SCHEMA> extends DatabaseTransaction<SCHEMA, ALLOWEDOBJECTSTORES> {

    client: PG.PoolClient

    constructor(client: PG.PoolClient) {
        super()
        this.client = client
    }

    async createObjectStore<NAME extends ALLOWEDOBJECTSTORES, T, C extends keyof SCHEMA[NAME]>(name: NAME, primaryColumnName: C, primaryColumn: DatabaseColumn<T>): Promise<DatabaseObjectStore<SCHEMA[NAME], C>> {
        await this.client.query(`CREATE TABLE ${name} (${primaryColumnName} ${primaryColumn.type.postgresqlType} PRIMARY KEY`);
        return new PostgresqlDatabaseObjectStore<SCHEMA[NAME], C>(this.client, name as string, primaryColumnName)
    }

    objectStore<NAME extends ALLOWEDOBJECTSTORES, C extends keyof SCHEMA[NAME]>(name: NAME): DatabaseObjectStore<SCHEMA[NAME], C> {
        throw new Error("Not implemented")
        // TODO FIXME
        //return new PostgresqlDatabaseObjectStore(this.client, name as string, "")
    }
}

export class PostgresqlObjectStoreOrIndex<Type extends { [a: string]: DatabaseColumn<any> }, C extends keyof Type> extends DatabaseObjectStoreOrIndex<Type, C> {

    client: PG.PoolClient
    
    objectStoreName: string
    columnName: C

    constructor(client: PG.PoolClient, objectStoreName: string, columnName: C) {
        super()
        this.client = client
        this.objectStoreName = objectStoreName
        this.columnName = columnName
    }

    async get<COLUMNS extends keyof Type>(columns: COLUMNS[], key: Type[C]["type"]["_T"]): Promise<TypeOfProps<Pick<Type, COLUMNS>> | undefined> {
        let result = await this.client.query(`SELECT ${columns.join(", ")} FROM ${this.objectStoreName} WHERE ${this.columnName} = $1`, [key])
        if (result.rows.length > 0) {
            return result.rows[0]
        } else {
            return undefined
        }
    }
}

export class PostgresqlDatabaseObjectStore<Type extends { [a: string]: DatabaseColumn<any> }, C extends keyof Type> extends PostgresqlObjectStoreOrIndex<Type, C> {


    constructor(client: PG.PoolClient, objectStoreName: string, columnName: C) {
        super(client, objectStoreName, columnName)
    }

    // TODO FIXME the database needs to know which columns are indexes
    index(name: string): Promise<DatabaseObjectStoreOrIndex<Type, C>> {
        throw new Error("not implemented")
    }
}


export const create = () => new PostgresqlDatabaseConnection();