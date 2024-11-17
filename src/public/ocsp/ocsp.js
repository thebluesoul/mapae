function onMenuClick() {
    console.log("OCSP(Online Certificate Status Protocol) 메뉴가 클릭되었습니다.");

    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    const subjectTemplate = JSON.parse(localStorage.getItem('subjectTemplate'));
}

async function saveOCSPConfig() {
    const ocspResponder = document.getElementById('ocspResponder').value;
    const ocspRejectUnknown = document.getElementById('ocspRejectUnknown').checked;
    const ocspRejectUnreachable = document.getElementById('ocspRejectUnreachable').checked;

    // Save OCSP configuration to server or local storage
    localStorage.setItem('ocspConfig', JSON.stringify({
        ocspResponder,
        ocspRejectUnknown,
        ocspRejectUnreachable
    }));

    alert('OCSP configuration saved successfully!');
}

async function checkOCSP() {
    const certificatePem = document.getElementById('certificatePem').value;
    const issuerPem = document.getElementById('issuerPem').value;

    const ocspConfig = JSON.parse(localStorage.getItem('ocspConfig'));
    const ocspResponder = ocspConfig.ocspResponder;

    try {
        const response = await fetch('/api/ocsp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                certificate: certificatePem,
                issuer: issuerPem,
                ocspResponder
            })
        });

        const ocspResult = await response.json();
        const ocspResultContent = document.getElementById('ocspResultContent');
        const ocspResultDiv = document.getElementById('ocspResult');

        if (ocspResult.success) {
            ocspResultContent.textContent = JSON.stringify(ocspResult.result, null, 2);
        } else {
            ocspResultContent.textContent = `Error: ${ocspResult.error}`;
        }

        ocspResultDiv.style.display = 'block';
    } catch (error) {
        console.error('OCSP request error:', error);
        alert('OCSP request failed.');
    }
}

async function generateOCSPCert() {

    console.info("generateOCSPCert()");

    const commonName = document.getElementById('commonName').value;
    const subjectTemplate = JSON.parse(localStorage.getItem('subjectTemplate'));
    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    const caServerUrl = serverInfo.cfsslServerUrl;

    console.info("generateOCSPCert() cn=", commonName);
    // ocsp key-pairs
    // subjectTemplate.KeyType 에 따라서 분기 필요함.
    // rsa만 처리함.
    keys = forge.pki.rsa.generateKeyPair(Number(subjectTemplate.KeySize));

    // ocsp csr 생성
    const ocspCsr = forge.pki.createCertificationRequest();
    
    ocspCsr.publicKey = keys.publicKey;

    ocspCsr.setSubject(
        [
            {
                name: 'commonName',
                value: commonName,
                type: forge.pki.oids.commonName,
                valueTagClass: forge.asn1.Type.UTF8
            }, 
            {
                name: 'countryName',
                value: subjectTemplate.C
            }, 
            {
                shortName: 'ST',
                value: subjectTemplate.ST
            },
            {
                name: 'localityName',
                value: subjectTemplate.L
            }, 
            {
                name: 'organizationName',
                value: subjectTemplate.O
            },
            {
                shortName: 'OU',
                value: subjectTemplate.OU
            }
        ]
    );

    ocspCsr.sign(keys.privateKey);

    ocspCsrPem = forge.pki.certificationRequestToPem(ocspCsr);

    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

    // 개인키 다운로드 링크 설정
    const downloadPrivateKey = document.getElementById('downloadPrivateKey');
    downloadPrivateKey.href = URL.createObjectURL(new Blob([privateKeyPem], { type: 'application/x-pem-file' }));
    downloadPrivateKey.download = `${commonName}_private_key.pem`;

    // ocsp 인증서 발행
    const profile = "ocsp"
    const proxyApiSign = 'http://localhost:3000/api/sign';
    const csrRequest = {
        'certificate_request': ocspCsrPem,
        'hosts': null,
        'profile': profile,
        'crl_override': "",
        'label': "",
        'NotBefore': "",
        'NotAfter': "",
        'ReturnPrecert': false,
        'metadata': null,
    };

    const proxyApiDataSign = {
            csr: csrRequest,
            caServer: caServerUrl
        };

    var signedOcspCert;
    try {
        const response = await fetch(`/api/sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proxyApiDataSign)
        });

        const responseData = await response.json();
        signedOcspCert = responseData.result.certificate;
    } catch (error) {
        console.error('Error:', error);
    }

    console.info("signedOcspCert=", signedOcspCert);
    document.getElementById('OcspCertContent').textContent = signedOcspCert;

    // ocsp 인증서 view pem, file 다운로드

    // 루트 인증서 발행
    try {
        const infoRequest = {
            'label': "",
            'profile': "",
        };

        const enrollmentRequest = {
            info: infoRequest,
            caServer: caServerUrl
        };

        const resp = await fetch(`/api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollmentRequest)
        })

        if (!resp.ok) {
            throw new Error('Network response was not ok');
        }

        const respData = await resp.json();
        rootCert = respData.result.certificate;
    } catch (error) {
        console.error('Error:', error);
    }

    console.info("rootCert=", rootCert);

    const certChain = [
        forge.pki.certificateFromPem(signedOcspCert),
        forge.pki.certificateFromPem(rootCert)
    ];

    const privateKeyPassword = subjectTemplate.Pkcs12PassWord;
    const privateKey = keys.privateKey;

    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        privateKey,
        certChain,
        privateKeyPassword,
        {algorithm: '3des'}
    );
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Blob = new Blob([forge.util.binary.raw.decode(p12Der)], { type: 'application/x-pkcs12' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(p12Blob);
    downloadLink.download = `${commonName}.p12`;
    downloadLink.textContent = 'PKCS#12 파일 다운로드';

    document.getElementById('downloadLinks').appendChild(downloadLink);

    downloadLink.addEventListener('click', function() {
        document.getElementById('downloadLinks').removeChild(downloadLink);
    });

    document.getElementById('viewSignedOCSP').style.display = 'block';
    addDecoderLink(document.getElementById('viewSignedOCSP'));

    const downloadRootCert = document.getElementById('downloadSignedOcspCert');
    const downloadSignedCert = document.getElementById('downloadOcspForRootCert');
    if (rootCert) {
        downloadRootCert.href = URL.createObjectURL(new Blob([rootCert], { type: 'application/x-pem-file' }));
        downloadRootCert.download = `${commonName}_root_certificate.pem`;
    }
    if (signedOcspCert) {
        downloadSignedCert.href = URL.createObjectURL(new Blob([signedOcspCert], { type: 'application/x-pem-file' }));
        downloadSignedCert.download = `${commonName}_signed_certificate.pem`;
    }
}

// 서명된 OCSP 인증서 보기 함수
function viewSignedOCSP() {
    const certContent = document.getElementById('OcspCertContent');
    // certContent.textContent = signedCert;
    certContent.style.display = 'block';
    const copyButton = document.getElementById('copyOcspCertButton');
    copyButton.style.display = 'block';
    certContent.parentElement.insertBefore(copyButton, certContent);

    // 서명된 인증서 다운로드 링크를 보이도록 설정
    const downloadLinks = document.getElementById('downloadLinks');
    downloadLinks.classList.remove('hidden');

    const downloadSignedCert = document.getElementById('downloadSignedOcspCert');
    if (signedCert) {
        downloadSignedCert.href = URL.createObjectURL(new Blob([signedCert], { type: 'application/x-pem-file' }));
        downloadSignedCert.download = `signed_certificate.pem`;
    }

    // pemDownloadLinks가 존재하는지 확인
    const OcspPemDownloadLinks = document.getElementById('OcspPemDownloadLinks');
    if (OcspPemDownloadLinks) {
        OcspPemDownloadLinks.classList.remove('hidden');
        copyButton.insertAdjacentElement('afterend', OcspPemDownloadLinks);
    } else {
        console.error('Element with id "OcspPemDownloadLinks" not found.');
    }
}

// 디코더 링크 추가 함수
function addDecoderLink(button) {
    const decoderLink = document.createElement('a');
    decoderLink.href = 'https://certlogik.com/decoder';
    decoderLink.target = '_blank';
    decoderLink.textContent = ' https://certlogik.com/decoder';
    button.parentElement.appendChild(decoderLink);
}

// 인증서 내용을 클립보드로 복사하는 기능
document.getElementById('copyOcspCertButton').addEventListener('click', function () {
    const certContent = document.getElementById('OcspCertContent').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(certContent).then(function() {
            const copyButton = document.getElementById('copyOcspCertButton');
            copyButton.textContent = '복사함';
            setTimeout(function() {
                copyButton.textContent = 'Copy PEM Content';
            }, 5000);
        }, function() {
            alert('Failed to copy content.');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = certContent;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            const copyButton = document.getElementById('copyOcspCertButton');
            copyButton.textContent = '복사함';
            setTimeout(function() {
                copyButton.textContent = 'Copy PEM Content';
            }, 5000);
        } catch (err) {
            alert('Failed to copy content.');
        }
        document.body.removeChild(textArea);
    }
});

document.getElementById('generateOcspCertButton').addEventListener('click', generateOCSPCert);
document.getElementById('viewSignedOCSP').addEventListener('click', viewSignedOCSP);
