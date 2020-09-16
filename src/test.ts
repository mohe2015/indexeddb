

export type TestMigration<FROMVERSION extends number, TOVERSION extends number> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<FROMVERSION>
    addedColumns: TestObjectStores
    removedColumns: TestObjectStores
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<VERSION extends number> = {
    version: VERSION,
    objectStores: TestObjectStores
}

export type TestSchemaWithMigration<VERSION extends number, FROMVERSION extends number, TOVERSION extends number> = TestSchemaWithoutMigration<VERSION> & {
    migration: TestMigration<FROMVERSION, TOVERSION> | null
}

let initialSchema: TestSchemaWithoutMigration<1> = {
    version: 1,
    objectStores: {}
}

let migration: TestMigration<1, 2> = {
    fromVersion: initialSchema.version,
    toVersion: 2,
    baseSchema: initialSchema,
    addedColumns: {},
    removedColumns: {},
}

function migrate<FROMVERSION extends number, TOVERSION extends number>(migration: TestMigration<FROMVERSION, TOVERSION>): TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION> {
    let schema: TestSchemaWithMigration<TOVERSION, FROMVERSION, TOVERSION> = {
        migration,
        version: migration.toVersion,
        objectStores: migration.addedColumns
    }
    return schema
}