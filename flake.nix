{
  # https://github.com/NixOS/nix/issues/3803
  description = "indexeddb";
  
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      yarn = pkgs.yarn.override { nodejs = pkgs.nodejs-14_x; };
      overlay = self: super:
      {
        mongodb-4_4 = let
          buildMongoDB = super.callPackage (nixpkgs + /pkgs/servers/nosql/mongodb/mongodb.nix) {
            sasl = super.cyrus_sasl;
            boost = super.boost169;
            inherit (super.darwin.apple_sdk.frameworks) CoreFoundation Security;
            inherit (super.darwin) cctools;
          };
        in buildMongoDB {
          version = "4.4.1";
          sha256 = "Wi7nhsdfGFRfYs0hvLekfe5c1xuzV+BmZUKD8ZnNh1E=";
          patches =
            [ (nixpkgs + /pkgs/servers/nosql/mongodb/forget-build-dependencies-4-2.patch) ]
            ++ super.stdenv.lib.optionals super.stdenv.isDarwin [ (nixpkgs + /pkgs/servers/nosql/mongodb/asio-no-experimental-string-view-4-2.patch) ];
        };
      };
      pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
            overlays = [ overlay ];
      };
    in
    {
      devShell.${system} = pkgs.mkShell {
        buildInputs = [
          yarn
          pkgs.nodejs-14_x
          pkgs.nodePackages.npm-check-updates
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
                networking.firewall.allowedTCPPorts = [ 80 27017 ];

                # Enable a web server.
                services.httpd = {
                    enable = true;
                    adminAddr = "Moritz.Hedtke@t-online.de";
                };
                
                services.mongodb = {
                    enable = true;
                    # https://docs.mongodb.com/manual/core/transactions/#transactions-create-collections-indexes 4.4 required
                    package = pkgs.mongodb-4_4;
                    bind_ip = "0.0.0.0"; # dangerous?
                };
            })
        ];
    };
    };
}

# nix build .#nixosConfigurations.container.config.system.build.toplevel
# sudo nixos-container create idb-mongodb --flake .
# sudo nixos-container start idb-mongodb
# curl http://$(nixos-container show-ip idb-mongodb)
# sudo nixos-container update idb-mongodb 
# sudo nixos-container update idb-mongodb --update-input nixpkgs --commit-lock-file
