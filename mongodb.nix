{ fetchurl, sconsPackages, stdenv, python38, boost169, curl, gperftools, libpcap, libyamlcpp, openssl, pcre-cpp, cyrus_sasl, snappy, zlib, lzma }:
let
python = python38.withPackages (ps: with ps; [ pyyaml cheetah3 psutil setuptools ]);
boost = boost169.override { enableShared = false; enabledStatic = true; };
in stdenv.mkDerivation rec {
    version = "4.4.1";
    pname = "mongodb";
    
    src = fetchurl {
        url = "https://fastdl.mongodb.org/src/mongodb-src-r${version}.tar.gz";
        sha256 = "Wi7nhsdfGFRfYs0hvLekfe5c1xuzV+BmZUKD8ZnNh1E=";
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
        #"--rocksdb" # Don't have this packaged yet
     #   "--wiredtiger=on"
     #   "--js-engine=mozjs"
     #   "--use-sasl-client"
        "--disable-warnings-as-errors"
        #"VARIANT_DIR=nixos" # Needed so we don't produce argument lists that are too long for gcc / ld
    ] ++ map (lib: "--use-system-${lib}") ["boost" "pcre" "snappy" "yaml" "zlib"];

    #preBuild = ''
    #sconsFlags+=" CC=$CC"
    #sconsFlags+=" CXX=$CXX"
    #'';
    
    buildPhase = ''
    echo skip build phase
    '';

    prefixKey = "DESTDIR=";

    installTargets = [ "install-mongod" ];
    
    postInstall = ''
        rm -f "$out/bin/install_compass" || true
    '';

    doInstallCheck = true;
    installCheckPhase = ''
        runHook preInstallCheck
        "$out/bin/mongod" --version
        runHook postInstallCheck
    '';

  enableParallelBuilding = true;

  hardeningEnable = [ "pie" ];
}
