{ lib, ... }:
{
        services.postgresql = {
                enable = true;
                ensureDatabases = [ "indexeddb" ];
                ensureUsers = [
                        {
                                name = "indexeddb";
                                ensurePermissions = {
                                        "DATABASE indexeddb" = "ALL PRIVILEGES";
                                };
                        }
                ];
        };

        users.users.indexeddb = {
                isSystemUser = true;
        };
}