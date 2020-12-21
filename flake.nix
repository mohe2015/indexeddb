# SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  # https://github.com/NixOS/nix/issues/3803
  description = "indexeddb";
  
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
      };
    in
    {
      devShell.${system} = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs-15_x
          pkgs.nodePackages.npm-check-updates
          pkgs.reuse
        ];
      };
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        inherit system;
        modules =
            [ ({ ... }: {
                boot.isContainer = true;

                # Let 'nixos-version --json' know about the Git revision
                # of this flake.
                system.configurationRevision = nixpkgs.lib.mkIf (self ? rev) self.rev;

                # Network configuration.
                networking.useDHCP = false;
                networking.firewall.allowedTCPPorts = [ 27017 ];

                services.mongodb = {
                    enable = true;
                    # https://docs.mongodb.com/manual/core/transactions/#transactions-create-collections-indexes 4.4 required
                    package = pkgs.callPackage ./mongodb.nix {};
                    bind_ip = "0.0.0.0"; # dangerous?

                    # Transaction numbers are only allowed on a replica set member or mongos
                    replSetName = "rs01";

                    #enableAuth = true;
                    #initialRootPassword = "password"; # https://github.com/NixOS/nixpkgs/pull/99037

                    initialScript = pkgs.writeText "my-file"
                      ''
                      rs.initiate()
                      '';
                };
            })
        ];
    };
    };
}

# nix build --keep-failed --print-build-logs .#nixosConfigurations.container.config.system.build.toplevel
# sudo nixos-container create idb-mongodb --flake .
# sudo nixos-container start idb-mongodb
# curl http://$(nixos-container show-ip idb-mongodb)
# sudo nixos-container update idb-mongodb
# sudo nixos-container update idb-mongodb --update-input nixpkgs --commit-lock-file
