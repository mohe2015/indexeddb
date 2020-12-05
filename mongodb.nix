# SPDX-FileCopyrightText: 2020 Moritz Hedtke <Moritz.Hedtke@t-online.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  fetchurl
, sconsPackages
, stdenv
, python38
, boost170
, curl
, gperftools
, libpcap
, libyamlcpp
, openssl
, pcre-cpp
, cyrus_sasl
, snappy
, zlib
, lzma
, wiredtiger
, mongoc
, abseil-cpp
, pkgconfig
, libunwind
, libstemmer
, zstd
, icu
, fmt
}:
let
python = python38.withPackages (ps: with ps; [ pyyaml cheetah3 psutil setuptools ]);
in stdenv.mkDerivation rec {
    version = "4.4.2";
    pname = "mongodb";
    
    src = fetchurl {
        url = "https://fastdl.mongodb.org/src/mongodb-src-r${version}.tar.gz";
        sha256 = "X5cKD2nGBNJQHuTfkgr6nWHsFvW2kfcecFhxoIsL/+U=";
    };
    
    nativeBuildInputs = [ pkgconfig sconsPackages.scons_latest ];
    
    buildInputs = [
        boost170
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
        wiredtiger
        mongoc
        abseil-cpp
        libunwind
        libstemmer
        zstd
        icu
        fmt
    ];
    
    postPatch = ''
    # fix environment variable reading
    substituteInPlace SConstruct \
        --replace "env = Environment(" "env = Environment(ENV = os.environ,"
    '';
    
    sconsFlags = [
        "--release"
        "--ssl"
        "--disable-warnings-as-errors"

        "--enable-free-mon=off"
        "--enable-http-client=off"
      # "--use-system-abseil-cpp" # doesnt work but is build input
        "--use-system-asio"
        "--use-system-boost"
        "--use-system-fmt"
      # "--use-system-google-benchmark" # also used by another package but not packaged
        "--use-system-icu"
      # "--use-system-intel_decimal128" # not packaged
      # "--use-system-kms-message" # not packaged
        "--use-system-pcre"
        "--use-system-snappy"
        "--use-system-stemmer"
        "--use-system-tcmalloc"
        "--use-system-libunwind"
        "--use-system-valgrind"
        "--use-system-wiredtiger"
        "--use-system-yaml"
        "--use-system-zlib"
        "--use-system-zstd"
      # "--use-system-mongo-c" # doesn't work but is build input
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
