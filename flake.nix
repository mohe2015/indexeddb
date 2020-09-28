{
  # https://github.com/NixOS/nix/issues/3803
  description = "indexeddb";
  
  inputs.nixpkgs.url = "git+file:///etc/nixos/nixpkgs";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      yarn = pkgs.yarn.override { nodejs = pkgs.nodejs-14_x; };
      overlay = self: super:
      {
        mongodb-4_4 = super.callPackage ./mongodb.nix {};
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
