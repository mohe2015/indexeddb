# SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
{ fetchurl, sconsPackages, stdenv, python38, boost169, curl, gperftools, libpcap, libyamlcpp, openssl, pcre-cpp, cyrus_sasl, snappy, zlib, lzma }:
let
python = python38.withPackages (ps: with ps; [ pyyaml cheetah3 psutil setuptools ]);
boost = boost169.override { enableShared = false; enabledStatic = true; };
in stdenv.mkDerivation rec {
    version = "4.4.2";
    pname = "mongodb";
    
    src = fetchurl {
        url = "https://fastdl.mongodb.org/src/mongodb-src-r${version}.tar.gz";
        sha256 = "X5cKD2nGBNJQHuTfkgr6nWHsFvW2kfcecFhxoIsL/+U=";
    };
    
    nativeBuildInputs = [ sconsPackages.scons_latest ];
    
    buildInputs = [
        boost
        curl
        gperftools
        libpcap
        libyamlcpp
        openssl
        pcre-cpp
        python
        cyrus_sasl
        snappy
        zlib
        lzma
    ];
    
    # TODO FIXME add forget-build-dependencies patch
    
    postPatch = ''
    # fix environment variable reading
    substituteInPlace SConstruct \
        --replace "env = Environment(" "env = Environment(ENV = os.environ,"
    '';
    
    sconsFlags = [
        "--release"
        "--ssl"
        "--disable-warnings-as-errors"
    ] ++ map (lib: "--use-system-${lib}") ["boost" "pcre" "snappy" "yaml" "zlib"];
    
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
