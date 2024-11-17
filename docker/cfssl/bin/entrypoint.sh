#!/bin/sh

set -x

ROOT_DIR="/etc/cfssl"
CA_KEY_PATH="${ROOT_DIR}/certs/ca-key.pem"
CA_CERT_PATH="${ROOT_DIR}/certs/ca.pem"
CONFIG_PATH="${ROOT_DIR}/conf/ca-config.json"

CA_CONF_DEFS="${ROOT_DIR}/conf.defs/ca-config.json.default"
CA_CSR_DEFS="${ROOT_DIR}/conf.defs/ca-csr.json.default"
OCSP_CSR_DEFS="${ROOT_DIR}/conf.defs/ocsp-csr.json.default"

CA_CSR_PATH="${ROOT_DIR}/conf/ca-csr.json"
CA_CERT_FILE_PREFIX="${ROOT_DIR}/certs/ca"
DB_CONF="${ROOT_DIR}/conf/mysql.conf"
DB_DEF_CONF="${ROOT_DIR}/conf.defs/mysql.conf.default"
ROOT_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"
CRL_CERT_PATH="${ROOT_DIR}/certs/crl.pem"

OCSP_KEY_PATH="${ROOT_DIR}/certs/ocsp-key.pem"
OCSP_CERT_PATH="${ROOT_DIR}/certs/ocsp.pem"
OCSP_CSR_JSON_PATH="${ROOT_DIR}/conf/ocsp-csr.json"

if [ ! -d ${ROOT_DIR}/certs ]; then
    mkdir -p ${ROOT_DIR}/certs
fi

if [ ! -d ${ROOT_DIR}/conf ]; then
    mkdir -p ${ROOT_DIR}/conf
    cp -f ${CA_CONF_DEFS} ${CONFIG_PATH}
    cp -f ${CA_CSR_DEFS} ${CA_CSR_PATH}
    cp -f ${OCSP_CSR_DEFS} ${OCSP_CSR_JSON_PATH}
    cp -f ${DB_DEF_CONF} ${DB_CONF}
fi

CFSSLADDRESS=`hostname -I | awk '{print $1}' 2>/dev/null`

# etc/cfssl/certs/ca-config.json 파일의 CRL/OCSP 주소를 정책서버주소로 치환
# CRL : http://172.29.99.42/crl.pem
# OCSP : http://172.29.99.42/ocsp
if grep -q "##CFSSLADDRESS##" "$CONFIG_PATH"; then
    sed -i "s|##CFSSLADDRESS##|$CFSSLADDRESS|" $CONFIG_PATH
fi

# etc/cfssl/certs/ca-csr.json 파일의 CN에 정책서버주소 추가
# CN : 172.29.99.42
if grep -q "##CFSSLADDRESS##" "$CA_CSR_PATH"; then
    sed -i "s|##CFSSLADDRESS##|$CFSSLADDRESS|" $CA_CSR_PATH
fi

# etc/cfssl/certs/ocsp-csr.json 파일의 CN에 정책서버주소 추가
# CN : OCSP Responder for 172.29.99.42
if grep -q "##CFSSLADDRESS##" "$OCSP_CSR_JSON_PATH"; then
    sed -i "s|##CFSSLADDRESS##|$CFSSLADDRESS|" $OCSP_CSR_JSON_PATH
fi

if [ ! -f "$CA_KEY_PATH" -o ! -f "$CA_CERT_PATH" ]; then
    echo "Root certificate or root private key is missing. Generating a new one."
    (cd ${ROOT_DIR}/certs; cfssl gencert -initca "$CA_CSR_PATH" | cfssljson -bare "$CA_CERT_FILE_PREFIX" -)
else
    echo "Root certificate and root private key already exist. Starting the server."
fi

# ${ROOT_DIR}/mysql.conf 파일내에 DB_PASS가 치환되었는지 확인함.
if grep -q "##DB_PASS##" "$DB_CONF"; then
    sed -i "s|##DB_PASS##|$MYSQL_ROOT_PASSWORD|" $DB_CONF
fi

if grep -q "##TABLESNAME##" "$DB_CONF"; then
    sed -i "s|##TABLESNAME##|$MYSQL_DATABASE|" $DB_CONF
fi

if grep -q "##DB_HOST##" "$DB_CONF"; then
    sed -i "s|##DB_HOST##|$MYSQL_HOST|" $DB_CONF
fi

# OCSP 인증서
if [ ! -f "$OCSP_CERT_PATH" -o ! -f "$OCSP_KEY_PATH" ]; then
    echo "OCSP certificate is missing. Generating a new one."
    (cd ${ROOT_DIR}/certs; cfssl gencert -ca="$CA_CERT_PATH" -ca-key="$CA_KEY_PATH" -config="$CONFIG_PATH" -profile=ocsp "$OCSP_CSR_JSON_PATH" | cfssljson -bare ocsp -)
else
    echo "OCSP certificate already exist. Starting the server."
fi

# cfssl 서버 실행
cfssl serve -loglevel=1 -address=0.0.0.0 -port=8889 -ca-key="$CA_KEY_PATH" -ca="$CA_CERT_PATH" -ca-bundle="$ROOT_CA_BUNDLE" -responder="$OCSP_CERT_PATH" -responder-key="$OCSP_KEY_PATH" -config="$CONFIG_PATH" -db-config="$DB_CONF"
