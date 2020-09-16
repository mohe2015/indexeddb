export type TestMigration<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION, OBJECTSTORES>
    addedColumns: ADDED
    removedColumns: REMOVED
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<VERSION extends number, OBJECTSTORES extends TestObjectStores> = {
    version: VERSION,
    objectStores: OBJECTSTORES
}

export type TestSchemaWithMigration<VERSION extends number, FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores> = TestSchemaWithoutMigration<VERSION, OBJECTSTORES & ADDED> & {
    migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES> | null
}

let initialSchema: TestSchemaWithoutMigration<1, {}> = {
    version: 1,
    objectStores: {}
}

let addedColumns = {
    users: {
        name: {

        },
        password: {

        }
    }
}

let migration: TestMigration<1, 2, typeof addedColumns, {}, {}> = {
    fromVersion: initialSchema.version,
    toVersion: 2,
    baseSchema: initialSchema,
    addedColumns,
    removedColumns: {},
}

function migrate<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores, OBJECTSTORES extends TestObjectStores>(migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES>): TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, ADDED, REMOVED, OBJECTSTORES> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: Object.assign({}, migration.baseSchema.objectStores, migration.addedColumns) as OBJECTSTORES & ADDED // TODO FIXME this is actually a wrong implementation
    }
}

let migrationResult = migrate(migration)