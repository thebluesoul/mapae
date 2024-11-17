// 비밀번호 표시 토글 기능
document.getElementById('togglePasswordButton').addEventListener('click', function () {
    const passwordField = document.getElementById('privateKeyPassword');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.textContent = 'Hide Password';
    } else {
        passwordField.type = 'password';
        this.textContent = 'Show Password';
    }
});

// 인증서 내용을 클립보드로 복사하는 기능
document.getElementById('copyCertButton').addEventListener('click', function () {
    const certContent = document.getElementById('certContent').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(certContent).then(function() {
            const copyButton = document.getElementById('copyCertButton');
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
            const copyButton = document.getElementById('copyCertButton');
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

// CSR 내용을 클립보드로 복사하는 기능
document.getElementById('copyCsrButton').addEventListener('click', function () {
    const csrContent = document.getElementById('csrContent').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(csrContent).then(function() {
            const copyButton = document.getElementById('copyCsrButton');
            copyButton.textContent = '복사함';
            setTimeout(function() {
                copyButton.textContent = 'Copy CSR Content';
            }, 5000);
        }, function() {
            alert('Failed to copy content.');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = csrContent;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            const copyButton = document.getElementById('copyCsrButton');
            copyButton.textContent = '복사함';
            setTimeout(function() {
                copyButton.textContent = 'Copy CSR Content';
            }, 5000);
        } catch (err) {
            alert('Failed to copy content.');
        }
        document.body.removeChild(textArea);
    }
});

// 인증서 생성시 공통으로 사용하는 옵션 섹션 토글 기능
function toggleOptionalSection() {
    const optionalSection = document.getElementById('optionalSection');
    const toggleButton = document.querySelector('button[onclick="toggleOptionalSection()"]');
    if (optionalSection.style.display === 'none' || optionalSection.style.display === '') {
        optionalSection.style.display = 'block';
        toggleButton.textContent = '접기';
    } else {
        optionalSection.style.display = 'none';
        toggleButton.textContent = '펼치기';
    }
}

// CN(Common Name) 타입 변경 시 처리 함수
function handleIdTypeChange() {
    const idType = document.querySelector('input[name="idType"]:checked').value;
    const idValueInput = document.getElementById('idValue');
    const sanSection = document.getElementById('sanSection');
    
    if (idType === 'email') {
        idValueInput.placeholder = 'Enter E-Mail';
        sanSection.style.display = 'none';
        idValueInput.value = 'testuser001@example.com';
    } else if (idType === 'userId') {
        idValueInput.placeholder = 'Enter UserID';
        sanSection.style.display = 'block';
        idValueInput.value = 'testuser001';
    }            
}

// SAN(Subject Alternative Name) 항목 추가 기능
function addSan() {
    const sanContainer = document.querySelector('.san-container');
    const sanItem = document.createElement('div');
    sanItem.className = 'san-item';
    sanItem.innerHTML = '<input type="text" class="form-control" placeholder="Enter SAN value(E-Mail)"><button type="button" class="btn btn-outline-primary-custom" onclick="removeSan(this)">삭제</button>';
    sanContainer.appendChild(sanItem);
}

// SAN 항목 삭제 기능
function removeSan(button) {
    const sanItem = button.parentElement;
    sanItem.remove();
}

// CA 서버 URL 표시 토글 기능
function toggleCaServerUrl() {
    const enrollmentMethod = document.querySelector('input[name="enrollmentMethod"]:checked').value;
    const caServerUrlGroup = document.getElementById('caServerUrlGroup');
    const downloadPrivateKey = document.getElementById('downloadPrivateKey');
    if (enrollmentMethod === 'onlineSCEP') {
        caServerUrlGroup.style.display = 'block';
        downloadPrivateKey.classList.remove('hidden');
    } else {
        caServerUrlGroup.style.display = 'none';
        downloadPrivateKey.classList.add('hidden');
    }
    updateOkButtonLabel();
}

// 확인 버튼 라벨 업데이트 함수
function updateOkButtonLabel() {
    const enrollmentMethod = document.querySelector('input[name="enrollmentMethod"]:checked').value;
    const okButton = document.getElementById('okButton');
    if (enrollmentMethod === 'fileBased') {
        okButton.textContent = 'CSR 생성';
    } else if (enrollmentMethod === 'onlineSCEP') {
        okButton.textContent = '발행 요청';
    }
}

// 전역 변수 선언
var csrPem;
var privateKey;
var publicKey;
var signedCert;
var rootCert;

// CSR 생성 함수
async function generateCSR() {
    // 입력 값 가져오기
    const certName = document.getElementById('certName').value;
    const idType = document.querySelector('input[name="idType"]:checked').value;
    const idValue = document.getElementById('idValue').value;
    const orgUnit = document.getElementById('orgUnit').value;
    const organization = document.getElementById('organization').value;
    const locality = document.getElementById('locality').value;
    const state = document.getElementById('state').value;
    const country = document.getElementById('country').value;
    const privateKeyPassword = document.getElementById('privateKeyPassword').value;
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const keySize = document.querySelector('input[name="keySize"]:checked').value;
    const profile = document.getElementById('profile').value;
    const enrollmentMethod = document.querySelector('input[name="enrollmentMethod"]:checked').value;

    const serverinfo = JSON.parse(localStorage.getItem('serverInfo'));
    const caServerUrl = document.getElementById('caServerUrl').value;

    if (!caServerUrl) {
        caServerUrl = serverinfo.cfsslServerUrl;
    }

    const sanItems = document.querySelectorAll('.san-item input');
    const altNames = Array.from(sanItems).map(item => item.value.trim()).filter(value => value);

    // Key-pair 생성
    let keys;
    if (keyType === 'rsa') {
        keys = forge.pki.rsa.generateKeyPair(Number(keySize));
    } else {
        keys = forge.pki.ed25519.generateKeyPair();
    }
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;

    // CSR 생성
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keys.publicKey;

    // CSR 필드 설정
    csr.setSubject([{
        name: 'commonName',
        value: idValue,
        type: forge.pki.oids.commonName,
        valueTagClass: forge.asn1.Type.UTF8
    }, {
        name: 'countryName',
        value: country,
        type: forge.pki.oids.countryName,
        valueTagClass: forge.asn1.Type.UTF8
    }, {
        shortName: 'ST',
        value: state,
        type: forge.pki.oids.stateOrProvinceName,
        valueTagClass: forge.asn1.Type.UTF8
    }, {
        name: 'localityName',
        value: locality,
        type: forge.pki.oids.localityName,
        valueTagClass: forge.asn1.Type.UTF8
    }, {
        name: 'organizationName',
        value: organization,
        type: forge.pki.oids.organizationName,
        valueTagClass: forge.asn1.Type.UTF8
    }, {
        shortName: 'OU',
        value: orgUnit,
        type: forge.pki.oids.organizationalUnitName,
        valueTagClass: forge.asn1.Type.UTF8 
    }]);

    // SAN 설정
    if (altNames.length > 0) {
        const sanExtensions = altNames.map(value => {
            if (value.includes('@')) {
                return { type: 1, value: value }; // email
            } else {
                return { type: 2, value: value }; // DNS name
            }
        });

        csr.setAttributes([{
            name: 'extensionRequest',
            extensions: [{
                name: 'subjectAltName',
                altNames: sanExtensions
            }]
        }]);
    }

    // CSR 서명
    csr.sign(keys.privateKey);

    // PEM 형식으로 변환
    csrPem = forge.pki.certificationRequestToPem(csr);

    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

    // 개인키 다운로드 링크 설정
    const downloadPrivateKey = document.getElementById('downloadPrivateKey');
    downloadPrivateKey.href = URL.createObjectURL(new Blob([privateKeyPem], { type: 'application/x-pem-file' }));
    downloadPrivateKey.download = `${certName}_private_key.pem`;

    if (enrollmentMethod === 'fileBased') {
        const csrBlob = new Blob([csrPem], { type: 'application/x-pem-file' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(csrBlob);
        downloadLink.download = `${certName}.csr`;
        downloadLink.textContent = 'Download CSR';

        document.getElementById('downloadLinks').appendChild(downloadLink);

        downloadLink.addEventListener('click', function() {
            document.getElementById('downloadLinks').removeChild(downloadLink);
        });

        alert('CSR 파일이 생성되었습니다.');
        document.getElementById('viewCsrButton').style.display = 'block';
        document.getElementById('viewCertButton').style.display = 'none';
        addDecoderLink(document.getElementById('viewCsrButton'));
    } else if (enrollmentMethod === 'onlineSCEP') {
        try {
            // const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));

            const infoRequest = {
                'label': "",
                'profile': "",
            };
            // const proxyApiInfo = `http://${serverInfo.nodeJsServer}/api/info`;
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

        // const proxyApiSign = `http://${serverInfo.nodeJsServer}/api/sign`;
        const csrRequest = {
            'certificate_request': csrPem,
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

        try {
            const response = await fetch(`/api/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proxyApiDataSign)
            });

            const responseData = await response.json();
            signedCert = responseData.result.certificate;

            console.info('signedCert=',signedCert);
            if (!signedCert || !rootCert || !keys.privateKey) {
                console.error('인증서 또는 개인키가 올바르지 않습니다.');
                return;
            }

            const certChain = [
                forge.pki.certificateFromPem(signedCert),
                forge.pki.certificateFromPem(rootCert)
            ];

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
            downloadLink.download = `${certName}.p12`;
            downloadLink.textContent = 'PKCS#12 파일 다운로드';

            document.getElementById('downloadLinks').appendChild(downloadLink);

            downloadLink.addEventListener('click', function() {
                document.getElementById('downloadLinks').removeChild(downloadLink);
            });

            document.getElementById('viewCertButton').style.display = 'block';
            document.getElementById('viewCsrButton').style.display = 'none';
            addDecoderLink(document.getElementById('viewCertButton'));
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const downloadRootCert = document.getElementById('downloadRootCert');
    const downloadSignedCert = document.getElementById('downloadSignedCert');
    if (rootCert) {
        downloadRootCert.href = URL.createObjectURL(new Blob([rootCert], { type: 'application/x-pem-file' }));
        downloadRootCert.download = `${certName}_root_certificate.pem`;
    }
    if (signedCert) {
        downloadSignedCert.href = URL.createObjectURL(new Blob([signedCert], { type: 'application/x-pem-file' }));
        downloadSignedCert.download = `${certName}_signed_certificate.pem`;
    }
}

// 서명된 인증서 보기 함수
function viewSignedCert() {
    const certContent = document.getElementById('certContent');
    certContent.textContent = signedCert;
    certContent.style.display = 'block';
    const copyButton = document.getElementById('copyCertButton');
    copyButton.style.display = 'block';
    certContent.parentElement.insertBefore(copyButton, certContent);
    
    // 서명된 인증서 다운로드 링크를 보이도록 설정
    const downloadLinks = document.getElementById('downloadLinks');
    downloadLinks.classList.remove('hidden');

    const downloadSignedCert = document.getElementById('downloadSignedCert');
    if (signedCert) {
        downloadSignedCert.href = URL.createObjectURL(new Blob([signedCert], { type: 'application/x-pem-file' }));
        downloadSignedCert.download = `signed_certificate.pem`;
    }

    // pemDownloadLinks가 존재하는지 확인
    const pemDownloadLinks = document.getElementById('pemDownloadLinks');
    if (pemDownloadLinks) {
        pemDownloadLinks.classList.remove('hidden');
        copyButton.insertAdjacentElement('afterend', pemDownloadLinks);
    } else {
        console.error('Element with id "pemDownloadLinks" not found.');
    }
}

// CSR PEM Contents 보기 함수
function viewCsr() {
    const csrContent = document.getElementById('csrContent');
    csrContent.textContent = csrPem;
    csrContent.style.display = 'block';
    const copyButton = document.getElementById('copyCsrButton');
    copyButton.style.display = 'block';
    csrContent.parentElement.insertBefore(copyButton, csrContent);
}

// 이벤트 리스너 추가
document.getElementById('viewCertButton').addEventListener('click', viewSignedCert);
document.getElementById('viewCsrButton').addEventListener('click', viewCsr);
document.querySelectorAll('input[name="enrollmentMethod"]').forEach(el => el.addEventListener('change', toggleCaServerUrl));

// 디코더 링크 추가 함수
function addDecoderLink(button) {
    const decoderLink = document.createElement('a');
    decoderLink.href = 'https://certlogik.com/decoder';
    decoderLink.target = '_blank';
    decoderLink.textContent = ' https://certlogik.com/decoder';
    button.parentElement.appendChild(decoderLink);
}

// 메뉴 클릭 시 초기 설정 함수
function onMenuClick() {
    console.log("클라이언트 인증서 발행 메뉴가 클릭되었습니다.");

    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    if (serverInfo) {
        document.getElementById('caServerUrl').value = serverInfo.cfsslServerUrl;
    }

    handleIdTypeChange();
    updateOkButtonLabel();
    toggleCaServerUrl();
}
