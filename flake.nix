{
  # https://github.com/NixOS/nix/issues/3803
  description = "indexeddb";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      yarn = pkgs.yarn.override { nodejs = pkgs.nodejs-14_x; };
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
            [ ({ pkgs, ... }: {
                boot.isContainer = true;

                # Let 'nixos-version --json' know about the Git revision
                # of this flake.
                system.configurationRevision = nixpkgs.lib.mkIf (self ? rev) self.rev;

                # Network configuration.
                networking.useDHCP = false;
                networking.firewall.allowedTCPPorts = [ 80 ];

                # Enable a web server.
                services.httpd = {
                    enable = true;
                    adminAddr = "[email protected]";
                };
                
                services.mongodb = {
                    enable = true;
                    
                };
            })
        ];
    };
    };
}

# nix build /path/to/my-flake#nixosConfigurations.container.config.system.build.toplevel
# nixos-container create flake-test --flake /path/to/my-flake
#  nixos-container start flake-test
# curl http://$(nixos-container show-ip homepage)
# nixos-container update flake-test --update-input nixpkgs --commit-lock-file
