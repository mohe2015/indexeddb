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
    };
}