var csrPem;
var privateKey;
var publicKey;
var signedCert;
var rootCert;

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

function handleProfileChange() {
    const profile = document.getElementById('profile').value;
    const idValueInput = document.getElementById('idValue');
    const sanSection = document.getElementById('sanSection');

    if (profile === 'server') {
        idValueInput.placeholder = 'Enter Domain Name';
        sanSection.style.display = 'block';
        idValueInput.value = 'genians.example.com';
    } else {
        idValueInput.placeholder = 'Enter E-Mail or UserID';
        sanSection.style.display = 'none';
        idValueInput.value = '';
    }
}

function addSan() {
    const sanContainer = document.querySelector('.san-container');
    const sanTypeSelect = document.getElementById('sanTypeSelect');
    const sanValueInput = document.getElementById('sanValueInput');

    const selectedType = sanTypeSelect.value;
    const enteredValue = sanValueInput.value.trim();

    if (!enteredValue) {
        return;
    }

    // Prefix를 추가
    const prefixMap = {
        dns: 'dns:',
        ip: 'ip:',
        uri: 'uri:',
        email: 'email:'
    };

    const prefixedValue = `${prefixMap[selectedType]}${enteredValue}`;

    // SAN 항목 추가
    const sanItem = document.createElement('div');
    sanItem.className = 'san-item d-flex align-items-center mb-2';

    sanItem.innerHTML = `
        <span class="mr-2">${selectedType.toUpperCase()}:</span>
        <input type="text" class="form-control mr-2" value="${prefixedValue}" disabled>
        <button type="button" class="btn btn-outline-danger btn-sm remove-san">-</button>
    `;
    sanItem.querySelector('.remove-san').addEventListener('click', () => sanItem.remove());
    sanContainer.appendChild(sanItem);

    // 입력 필드 초기화
    sanValueInput.value = '';
}

function removeSan(button) {
    const sanItem = button.parentElement;
    sanItem.remove();
}

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

function updateOkButtonLabel() {
    const enrollmentMethod = document.querySelector('input[name="enrollmentMethod"]:checked').value;
    const okButton = document.getElementById('okButton');
    if (enrollmentMethod === 'fileBased') {
        okButton.textContent = 'CSR 생성';
    } else if (enrollmentMethod === 'onlineSCEP') {
        okButton.textContent = '발행 요청';
    }
}

async function generateCSR() {
    const certName = document.getElementById('certName').value;
    const profile = document.getElementById('profile').value;
    const idValue = document.getElementById('idValue').value;
    const orgUnit = document.getElementById('orgUnit').value;
    const organization = document.getElementById('organization').value;
    const locality = document.getElementById('locality').value;
    const state = document.getElementById('state').value;
    const country = document.getElementById('country').value;
    const privateKeyPassword = document.getElementById('privateKeyPassword').value;
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const keySize = document.querySelector('input[name="keySize"]:checked').value;
    const enrollmentMethod = document.querySelector('input[name="enrollmentMethod"]:checked').value;
    const caServerUrl = document.getElementById('caServerUrl').value;

    // SAN 컨테이너에 추가된 모든 입력 필드 값을 가져옵니다.
    const sanItems = document.querySelectorAll('.san-container .san-item input');
    const altNames = Array.from(sanItems)
        .map(item => item.value.trim())
        .filter(value => value); // 값이 있는 항목만 필터링

    let keys;
    if (keyType === 'rsa') {
        keys = forge.pki.rsa.generateKeyPair(Number(keySize));
    } else {
        keys = forge.pki.ed25519.generateKeyPair();
    }
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;

    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keys.publicKey;
    csr.setSubject([{
        name: 'commonName',
        value: idValue
    }, {
        name: 'countryName',
        value: country
    }, {
        shortName: 'ST',
        value: state
    }, {
        name: 'localityName',
        value: locality
    }, {
        name: 'organizationName',
        value: organization
    }, {
        shortName: 'OU',
        value: orgUnit
    }]);

    if (altNames.length > 0) {
        const sanExtensions = altNames.map(value => {
            // Prefix 제거 후 타입 구분
            if (value.startsWith('email:')) {
                return { type: 1, value: value.replace('email:', '') }; // Email
            } else if (value.startsWith('ip:')) {
                return { type: 7, ip: value.replace('ip:', '') }; // IP Address
            } else if (value.startsWith('uri:')) {
                return { type: 6, value: value.replace('uri:', '') }; // URI
            } else if (value.startsWith('dns:')) {
                return { type: 2, value: value.replace('dns:', '') }; // DNS
            } else {
                console.warn("Unsupported SAN type:", value);
                return null;
            }
        }).filter(Boolean); // null 값 제거

        csr.setAttributes([{
            name: 'extensionRequest',
            extensions: [{
                name: 'subjectAltName',
                altNames: sanExtensions
            }]
        }]);
    }

    csr.sign(keys.privateKey);

    csrPem = forge.pki.certificationRequestToPem(csr);

    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

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
            const infoRequest = {
                'label': "",
                'profile': "",
            };
            const proxyApiInfo = 'http://localhost:3000/api/info';
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

        const proxyApiSign = 'http://localhost:3000/api/sign';
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

function viewCsr() {
    const csrContent = document.getElementById('csrContent');
    csrContent.textContent = csrPem;
    csrContent.style.display = 'block';
    const copyButton = document.getElementById('copyCsrButton');
    copyButton.style.display = 'block';
    csrContent.parentElement.insertBefore(copyButton, csrContent);
}

document.getElementById('viewCertButton').addEventListener('click', viewSignedCert);
document.getElementById('viewCsrButton').addEventListener('click', viewCsr);

function addDecoderLink(button) {
    const decoderLink = document.createElement('a');
    decoderLink.href = 'https://certlogik.com/decoder';
    decoderLink.target = '_blank';
    decoderLink.textContent = ' https://certlogik.com/decoder';
    button.parentElement.appendChild(decoderLink);
}

function onMenuClick() {
    console.log("서버 인증서 발행 메뉴가 클릭되었습니다.");

    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    if (serverInfo) {
        document.getElementById('caServerUrl').value = serverInfo.cfsslServerUrl;
    }

    addSan();
    handleProfileChange();
    updateOkButtonLabel();
    document.querySelectorAll('input[name="enrollmentMethod"]').forEach(el => el.addEventListener('change', toggleCaServerUrl));
}
