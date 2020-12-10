# SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
{ fetchurl, sconsPackages, stdenv, python38 }:
let
python = python38.withPackages (ps: with ps; [ pyyaml cheetah3 psutil setuptools ]);
in stdenv.mkDerivation rec {
    version = "4.4.2";
    pname = "mongodb";
    
    src = fetchurl {
        url = "https://fastdl.mongodb.org/src/mongodb-src-r${version}.tar.gz";
        sha256 = "X5cKD2nGBNJQHuTfkgr6nWHsFvW2kfcecFhxoIsL/+U=";
    };
    
    nativeBuildInputs = [ sconsPackages.scons_latest ];
    
    buildInputs = [];
        
    postPatch = ''
    # fix environment variable reading
    substituteInPlace SConstruct \
        --replace "env = Environment(" "env = Environment(ENV = os.environ,"
    '';
    
    sconsFlags = [
        "--release"
        "--ssl"
        "--disable-warnings-as-errors"
    ];
    
    buildPhase = ''
    echo skip build phase
    '';

    prefixKey = "DESTDIR=";

    installTargets = [ "install-core" ];

    doInstallCheck = true;
    installCheckPhase = ''
        runHook preInstallCheck
        "$out/bin/mongod" --version
        runHook postInstallCheck
    '';

  enableParallelBuilding = true;

  hardeningEnable = [ "pie" ];
}
