const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
const fs = require('fs');
const forge = require('node-forge');
const { exec } = require('child_process');
const path = require('path');
const router = express.Router();

// 루트 인증서 및 개인 키 저장 경로
const ROOT_CERT_PATH = path.join(__dirname, '../data/root_cert.pem');
const ROOT_KEY_PATH = path.join(__dirname, '../data/root_key.pem');

// 도커 컨테이너 환경인 경우 conf 생성 폴더
const userConfsDir = '/disk/sys/conf/user-confs';
const defaultConfsDir = '/disk/sys/conf/default-confs';

// 일반 환경인 경우, conf 생성 폴더
const tmpDir = '/tmp';

// 루트 인증서 및 개인 키를 저장하는 API 엔드포인트 추가
router.post('/api/import-root-cert', (req, res) => {
    console.log('[api/import-root-cert] Request received len:', JSON.stringify(req.body).length);
    const { rootCertPem, rootKeyPem } = req.body;

    try {
        // 루트 인증서 저장
        fs.writeFileSync(ROOT_CERT_PATH, rootCertPem);
        // 루트 개인 키 저장
        fs.writeFileSync(ROOT_KEY_PATH, rootKeyPem);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 루트 인증서 및 개인 키를 파일 업로드 방식으로 저장하는 API 엔드포인트 추가
router.post('/api/import-root-cert-file', (req, res) => {
    console.log('[api/import-root-cert-file] Request received len:', JSON.stringify(req.body).length);
    if (!req.files || !req.files.rootCertFile || !req.files.rootKeyFile) {
        return res.status(400).json({ success: false, error: 'Files are missing' });
    }

    const rootCertFile = req.files.rootCertFile;
    const rootKeyFile = req.files.rootKeyFile;

    try {
        // 루트 인증서 저장
        rootCertFile.mv(ROOT_CERT_PATH);
        // 루트 개인 키 저장
        rootKeyFile.mv(ROOT_KEY_PATH);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/api/certificates', (req, res) => {
    console.log('[api/certificates] Request received len:', JSON.stringify(req.body).length);
    const { host, port, user, password, database, page = 1, limit = 20 } = req.body;
    const offset = (page - 1) * limit;
    const db = mysql.createConnection({
        host,
        user,
        password,
        database,
        port
    });

    db.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err.stack);
            res.status(500).send('Failed to connect to database');
            return;
        }

        const query = `
            SELECT
                serial_number,
                authority_key_identifier,
                status,
                reason,
                expiry,
                pem
            FROM certificates
            LIMIT ? OFFSET ?
        `;
        db.query(query, [limit, offset], (error, results) => {
            if (error) {
                console.error('Error fetching certificates:', error);
                res.status(500).send('Failed to fetch certificates');
                return;
            }
            const transformedResults = results.map(row => ({
                serial_number: row.serial_number.toString('utf8'),
                authority_key_identifier: row.authority_key_identifier.toString('utf8'),
                status: row.status.toString('utf8'),
                expiry: row.expiry,
                reason: row.reason,
                pem: row.pem.toString('utf8')
            }));
            res.json(transformedResults);
        });
    });
});

// 데이터베이스 연결 설정
router.post('/api/database-connect', (req, res) => {
    console.log('[api/database-connect] Request received len:', JSON.stringify(req.body).length);
    const { host, port, user, password } = req.body;
    const db = mysql.createConnection({
        host,
        user,
        password,
        database: 'ALDER',
        port
    });

    db.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err.stack);
            res.status(500).send('Failed to connect to database');
            return;
        }

        const query = `
            SELECT
                serial_number,
                authority_key_identifier,
                ca_label,
                status,
                reason,
                expiry,
                revoked_at,
                pem,
                issued_at,
                not_before,
                metadata,
                sans,
                common_name
            FROM certificates
        `;
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching certificates:', error);
                res.status(500).send('Failed to fetch certificates');
                return;
            }

            // Buffer 데이터를 문자열로 변환
            const transformedResults = results.map(row => ({
                serial_number: row.serial_number.toString('utf8'),
                authority_key_identifier: row.authority_key_identifier.toString('utf8'),
                ca_label: row.ca_label ? row.ca_label.toString('utf8') : '',
                status: row.status.toString('utf8'),
                reason: row.reason,
                expiry: row.expiry,
                revoked_at: row.revoked_at,
                pem: row.pem.toString('utf8'),
                issued_at: row.issued_at.toString('utf8'),
                not_before: row.not_before.toString('utf8'),
                metadata: row.metadata.toString('utf8'),
                sans: row.sans.toString('utf8'),
                common_name: row.common_name.toString('utf8')
            }));

            res.json(transformedResults);
        });
    });
});

// 인증서 폐기 API
router.post('/api/revoke-certificate', (req, res) => {
    console.log('[api/v1/cfssl/revoke] Request received len:', JSON.stringify(req.body).length);
    const { revocationCert, caServer } = req.body;
    const options = {
        url: `${caServer}/api/v1/cfssl/revoke`,
        method: 'POST',
        data: revocationCert,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    axios.request(options)
        .then(response => {
            res.status(response.status).send(response.data);
        })
        .catch(error => {
            console.error("Error in Axios request:", error.message);
            res.status(500).send({ success: false, error: error.message });
        });
});

// proxy/api/v1/cfssl/info : 루트 인증서 다운로드
router.post('/api/info', (req, res) => {
    console.log('[proxy/api/v1/cfssl/info] Request received len:', JSON.stringify(req.body).length);
    // console.log('[proxy/api/v1/cfssl/info] Request received len:', JSON.stringify(req.body));
    const { caServer, info } = req.body;
    const options = {
        url: `${caServer}/api/v1/cfssl/info`,
        method: 'POST',
        data: { info },
        headers: {
            'Content-Type': 'application/json',
        },
    };

    console.log("Sending Axios request with options:", options);

    axios.request(options)
        .then(response => {
            res.status(response.status).send(response.data);
        })
        .catch(error => {
            console.error("Axios request failed:", error.message);
            res.status(500).send(error.message);
        });
});

// proxy/api/v1/cfssl/sign : 서명된 인증서 다운로드
router.post('/api/sign', (req, res) => {
    console.log('[proxy/api/v1/cfssl/sign] Request received len:', JSON.stringify(req.body).length);
    const { caServer, csr } = req.body;

    let parsedCsrRequest;

    // csr의 타입을 체크하여 JSON 문자열인 경우 JavaScript 객체로 변환
    // csr를 json 문자열로 변경하면서 줄바꿈이 포함되었다.
    // 줄바꿈 특수문자("\r\n", "\n") 제거하지 않고 json 문자열을 Json 객체로 
    // 변환하여 처리한다.
    if (typeof csr === 'string') {
        try {
            parsedCsrRequest = JSON.parse(csr);
        } catch (e) {
            console.error('Invalid JSON string:', e);
            return res.status(400).send('Invalid CSR JSON string');
        }
    } else {
        parsedCsrRequest = csr;
    }

    const options = {
        url: `${caServer}/api/v1/cfssl/sign`,
        method: 'POST',
        data: parsedCsrRequest,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    axios.request(options)
        .then(response => {
            res.status(response.status).send(response.data);
        })
        .catch(error => {
            console.error("Error in Axios request:", error.message);
            res.status(500).send({ success: false, error: error.message });
        });
});

// api/crl : CRL 인증서 다운로드
router.post('/api/crl', (req, res) => {
    console.log('[api/crl] Request received len:', JSON.stringify(req.body).length);
    const { caServer } = req.body;

    console.info("caServer=", caServer);
    const options = {
        url: `${caServer}/api/v1/cfssl/crl`,
        method: 'GET',
        json: {}
    };

    axios.request(options)
        .then(response => {
            const body = response.data;

            if (body.success && body.result) {
                // Base64 디코딩 및 OpenSSL 명령어를 사용하여 처리
                const base64Crl = body.result;

                // 쉘 명령어를 통해 CRL 변환
                const cmd = `echo ${base64Crl} | base64 -d | openssl crl -inform DER -out /tmp/crl.der.pem`;

                exec(cmd, (err, stdout, stderr) => {
                    if (err) {
                        console.error("Error executing OpenSSL command:", err);
                        res.status(500).send({ success: false, errors: err.message });
                        return;
                    }

                    // 변환된 PEM 데이터를 파일에서 읽어 클라이언트로 전송
                    fs.readFile('/tmp/crl.der.pem', 'utf8', (readErr, pemData) => {
                        if (readErr) {
                            console.error("Error reading PEM file:", readErr);
                            res.status(500).send({ success: false, errors: readErr.message });
                            return;
                        }

                        res.status(200).send({ success: true, result: pemData });
                    });
                });
            } else {
                // body.errors에서 오류 메시지를 가져옴
                const errorMessage = body.errors && body.errors.length > 0
                    ? body.errors.map(err => err.message).join(', ')
                    : 'Unknown error occurred';
                console.error("Error in API response:", errorMessage);
                res.status(500).send({ success: false, errors: errorMessage });
            }
        })
        .catch(error => {
            console.error("Error in Axios request:", error.message);
            res.status(500).send({ success: false, errors: error.message });
        });
});

// api/crlinfo : CRL 인증서 정보를 전송합니다.
router.post('/api/crlinfo', (req, res) => {
    console.log('[api/crlinfo] Request received len:', JSON.stringify(req.body).length);
    const { crlpem } = req.body;

    // 쉘 명령어를 통해 CRL 변환
    const cmd = `echo "${crlpem}" | openssl crl -noout -text -inform PEM`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error("Error executing OpenSSL command:", err);
            res.status(500).send({ success: false, errors: err.message });
            return;
        }

        if (stderr) {
            console.error("OpenSSL stderr:", stderr);
            res.status(500).send({ success: false, errors: stderr });
            return;
        }

        res.status(200).send({ success: true, result: stdout });
    });
});

// OCSP 서명용 인증서를 생성하는 API 엔드포인트 추가
router.post('/api/generate-ocsp-cert', (req, res) => {
    console.log('[api/generate-ocsp-cert] Request received len:', JSON.stringify(req.body).length);
    const { caCertPem, caKeyPem, commonName } = req.body;

    try {
        // CA 인증서 및 키를 로드
        const caCert = forge.pki.certificateFromPem(caCertPem);
        const caKey = forge.pki.privateKeyFromPem(caKeyPem);

        // OCSP 서명용 인증서 생성
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();
        cert.serialNumber = new Date().getTime().toString();
        cert.publicKey = keys.publicKey;
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        const attrs = [
            { name: 'commonName', value: commonName },
            { name: 'organizationName', value: 'My Organization' },
            { name: 'countryName', value: 'KR' }
        ];
        cert.setSubject(attrs);
        cert.setIssuer(caCert.subject.attributes);
        cert.setExtensions([
            { name: 'basicConstraints', cA: false },
            { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true, keyEncipherment: true, dataEncipherment: true },
            { name: 'extKeyUsage', serverAuth: true, clientAuth: true, ocspSigning: true },
            { name: 'authorityKeyIdentifier', keyIdentifier: true, authorityCertIssuer: true, serialNumber: true }
        ]);

        // 서명
        cert.sign(caKey, forge.md.sha256.create());

        // PEM 형식으로 변환
        const certPem = forge.pki.certificateToPem(cert);
        const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

        res.json({ success: true, certPem, keyPem });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// 루트CA의 CSR 항목
router.post('/api/root-csr', (req, res) => {
    console.log('[api/root-csr] Request received len:', JSON.stringify(req.body).length);
    const { subject, file } = req.body;

    try {
        const jsonString = JSON.stringify(subject, null, 2);

        const targetDir = fs.existsSync(userConfsDir) ? userConfsDir : tmpDir;
        const filePath = path.join(targetDir, path.basename(file));
        
        // csr_file_path='/disk/sys/conf/userconfs/ca-csr.json.update'
        // csr_file_path='/tmp/ca-csr.json.update'
        // Write JSON string to ca-csr.json file
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                console.error('Error writing file', err);
                res.status(500).send(err);
                return;
            }
            res.json({ success: true, path: filePath, csrData: jsonString });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// cfssl의 ca-config.default 로드
router.post('/api/defaultConf', (req, res) => {
    console.log('[api/defaultConf] Request received len:', JSON.stringify(req.body).length);
    const { file, info } = req.body;

    // Determine the correct directory
    const targetDir = fs.existsSync(defaultConfsDir) ? defaultConfsDir : tmpDir;
    const filePath = path.join(targetDir, path.basename(file));
    
    // const configFilePath = '/tmp/ca-config.json.default';
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return res.status(500).json({ error: 'Could not read config file', details: err.message });
        }
        
        try {
            const jsonData = JSON.parse(data);
            res.json({ success: true, path: filePath, confData: jsonData });
        } catch (parseError) {
            console.error('Error parsing config file:', parseError);
            res.status(500).json({ error: 'Could not parse config file', details: parseError.message });
        }
    });
});

router.post('/api/gen-ca-config-json', (req, res) => {
    console.log('[api/gen-ca-config-json] Request received len:', JSON.stringify(req.body).length);
    const { file, info } = req.body;

    try {
        const jsonString = JSON.stringify(info, null, 2);

        // Determine the correct directory
        const targetDir = fs.existsSync(userConfsDir) ? userConfsDir : tmpDir;
        const filePath = path.join(targetDir, path.basename(file));

        // Write JSON string to ca-csr.json file
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                console.error('Error writing file', err);
                res.status(500).send(err);
                return;
            }
            res.json({ success: true, file: filePath, Data: jsonString });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
