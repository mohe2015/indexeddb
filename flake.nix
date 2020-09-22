{
  description = "indexeddb";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShell.${system} = pkgs.mkShell {
        buildInputs = [
          pkgs.yarn
          pkgs.nodejs-14_x
          pkgs.nodePackages.npm-check-updates
        ];
      };
    };
}
