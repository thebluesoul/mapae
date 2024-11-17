USE MAPAEDB;

-- certificates 테이블 생성
CREATE TABLE certificates (
  serial_number            varbinary(128) NOT NULL,
  authority_key_identifier varbinary(128) NOT NULL,
  ca_label                 varbinary(128),
  status                   varbinary(128) NOT NULL,
  reason                   int,
  expiry                   timestamp NULL DEFAULT NULL,
  revoked_at               timestamp NULL,
  pem                      varbinary(4096) NOT NULL,
  issued_at                timestamp NULL DEFAULT NULL,
  not_before               timestamp NULL DEFAULT NULL,
  metadata                 JSON,
  sans                     JSON,
  common_name              TEXT,
  PRIMARY KEY(serial_number, authority_key_identifier)
);

-- ocsp_responses 테이블 생성
CREATE TABLE ocsp_responses (
  serial_number            varbinary(128) NOT NULL,
  authority_key_identifier varbinary(128) NOT NULL,
  body                     varbinary(4096) NOT NULL,
  expiry                   timestamp NULL DEFAULT NULL,
  PRIMARY KEY(serial_number, authority_key_identifier)
);

