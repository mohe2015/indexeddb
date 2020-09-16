export type TestMigration<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION>
    addedColumns: ADDED
    removedColumns: REMOVED
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<VERSION extends number> = {
    version: VERSION,
    objectStores: TestObjectStores
}

export type TestSchemaWithMigration<VERSION extends number, FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores> = TestSchemaWithoutMigration<VERSION> & {
    migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED> | null
}

let initialSchema: TestSchemaWithoutMigration<1> = {
    version: 1,
    objectStores: {}
}

let migration: TestMigration<1, 2, {}, {}> = {
    fromVersion: initialSchema.version,
    toVersion: 2,
    baseSchema: initialSchema,
    addedColumns: {},
    removedColumns: {},
}

function migrate<FROMVERSION extends number, TOVERSION extends number, ADDED extends TestObjectStores, REMOVED extends TestObjectStores>(migration: TestMigration<FROMVERSION, TOVERSION, ADDED, REMOVED>): TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION, ADDED, REMOVED> {
    return {
        migration,
        version: migration.toVersion,
        objectStores: migration.addedColumns
    }
}

let migrationResult = migrate(migration)