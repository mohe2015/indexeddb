

export type TestMigration<FROMVERSION extends number, TOVERSION extends number> = {
    fromVersion: FROMVERSION
    toVersion: TOVERSION
    baseSchema: TestSchemaWithoutMigration<TOVERSION>
    addedColumns: TestObjectStores
    removedColumns: TestObjectStores
}

export type TestObjectStores = { [a: string]: any; };

export type TestSchemaWithoutMigration<TOVERSION extends number> = {
    version: TOVERSION,
    objectStores: TestObjectStores
}

export type TestSchemaWithMigration<FROMVERSION extends number, TOVERSION extends number> = TestSchemaWithoutMigration<TOVERSION> & {
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