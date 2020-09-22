import type { DatabaseConnection } from "interface";

function create(uri?: string): Promise<DatabaseConnection>