var csrPem;
var privateKey;
var signedCert;
var rootCert;
var profile = "server";
var sanDns = [];
var sanIps = [];
var sanHostnames = [];

function toggleInput(type) {
    document.getElementById('csrFileGroup').classList.toggle('hidden', type !== 'csr');
    document.getElementById('pemContentGroup').classList.toggle('hidden', type !== 'pem');
    document.getElementById('csrToSign').classList.toggle('active', type === 'csr');
    document.getElementById('pemContent').classList.toggle('active', type === 'pem');
}

function selectHash(hashType) {
    document.getElementById('sha256').classList.toggle('active', hashType === 'sha256');
    document.getElementById('sha1').classList.toggle('active', hashType === 'sha1');
}

function selectProfile(selectedProfile) {
    profile = selectedProfile;
    document.getElementById('serverProfile').classList.toggle('active', selectedProfile === 'server');
    document.getElementById('clientProfile').classList.toggle('active', selectedProfile === 'client');
}

function addDns() {
    const dnsInput = document.getElementById('addDnsInput');
    const dnsValue = dnsInput.value.trim();
    if (dnsValue) {
        sanDns.push(dnsValue);
        updateSanList('dnsList', sanDns);
        dnsInput.value = '';
    }
}

function addIp() {
    const ipInput = document.getElementById('addIpInput');
    const ipValue = ipInput.value.trim();
    if (ipValue) {
        sanIps.push(ipValue);
        updateSanList('ipList', sanIps);
        ipInput.value = '';
    }
}

function addHostname() {
    const hostnameInput = document.getElementById('addHostnameInput');
    const hostnameValue = hostnameInput.value.trim();
    if (hostnameValue) {
        sanHostnames.push(hostnameValue);
        updateSanList('hostnameList', sanHostnames);
        hostnameInput.value = '';
    }
}

function updateSanList(elementId, sanList) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';
    sanList.forEach((san, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'dns-item';
        itemElement.innerHTML = `
            <input type="text" class="form-control" value="${san}" readonly>
            <button type="button" class="btn btn-outline-primary-custom" onclick="removeSan('${elementId}', ${index})">Remove</button>
        `;
        listElement.appendChild(itemElement);
    });
}

function removeSan(elementId, index) {
    if (elementId === 'dnsList') {
        sanDns.splice(index, 1);
        updateSanList(elementId, sanDns);
    } else if (elementId === 'ipList') {
        sanIps.splice(index, 1);
        updateSanList(elementId, sanIps);
    } else if (elementId === 'hostnameList') {
        sanHostnames.splice(index, 1);
        updateSanList(elementId, sanHostnames);
    }
}

async function signCertificate() {
    // 기존 인증서 삭제
    const signedCertDownloadLink = document.getElementById('signedCertDownloadLink');
    signedCertDownloadLink.href = '';
    const rootCertDownloadLink = document.getElementById('rootCertDownloadLink');
    rootCertDownloadLink.href = '';

    const csrFile = document.getElementById('csrFile').files[0];
    const pemContent = document.getElementById('pemContentText').value;
    const friendlyName = document.getElementById('certificateId').value || 'secure';
    const caServerUrl = document.getElementById('caServerUrl').value;

    if (csrFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csrContent = event.target.result;
            processCSR(csrContent, friendlyName, caServerUrl);
        };
        reader.readAsText(csrFile);
    } else if (pemContent) {
        processCSR(pemContent, friendlyName, caServerUrl);
    } else {
        alert('CSR 파일 또는 PEM 콘텐츠를 입력하세요.');
    }
}

async function processCSR(csrContent, friendlyName, caServerUrl) {
    const hashType = document.getElementById('sha256').classList.contains('active') ? 'sha256' : 'sha1';

    const proxyApiInfo = 'http://localhost:3000/api/info';
    try {
        const infoRequest = {
            'label': "",
            'profile': profile,
        };

        const enrollmentRequest = {
            info: infoRequest,
            caServer: caServerUrl
        };

        const infoResp = await fetch(`api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollmentRequest)
        });

        if (!infoResp.ok) {
            throw new Error('Network response was not ok');
        }

        const infoRespData = await infoResp.json();
        rootCert = infoRespData.result.certificate;
        console.log("rootCert Certificate Length:", rootCert.length);

        const proxyApiSign = 'http://localhost:3000/api/sign';
        const csrRequest = {
            'certificate_request': csrContent,
            'hosts': [...sanDns, ...sanIps, ...sanHostnames],
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

        const signResp = await fetch(`api/sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proxyApiDataSign)
        });

        const signData = await signResp.json();
        if (signData && signData.result && signData.result.certificate) {
            signedCert = signData.result.certificate;

            const signedBlob = new Blob([signedCert], { type: 'application/x-pem-file' });
            const signedUrl = URL.createObjectURL(signedBlob);
            signedCertDownloadLink.href = signedUrl;
            signedCertDownloadLink.download = `${friendlyName}_signed_certificate.pem`;

            const rootBlob = new Blob([rootCert], { type: 'application/x-pem-file' });
            const rootUrl = URL.createObjectURL(rootBlob);
            rootCertDownloadLink.href = rootUrl;
            rootCertDownloadLink.download = `${friendlyName}_root_certificate.pem`;

            document.getElementById('viewCertButton').classList.remove('hidden');
            document.getElementById('certText').textContent = signedCert;
            document.getElementById('rootCertText').textContent = rootCert;

            // 링크 표시
            document.getElementById('decoderLink').classList.remove('hidden');
        } else {
            alert('인증서 서명에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('인증서 서명 중 오류가 발생했습니다.');
    }
}

function viewCert() {
    document.getElementById('decoderLink').classList.remove('hidden');
    document.getElementById('certContent').classList.remove('hidden');
    document.getElementById('decoderLink').scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard(elementId, button) {
    const text = document.getElementById(elementId).textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = '복사함';
            setTimeout(() => {
                button.textContent = originalText;
            }, 5000);
        }).catch(err => {
            console.error('복사 중 오류 발생:', err);
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const originalText = button.textContent;
            button.textContent = '복사함';
            setTimeout(() => {
                button.textContent = originalText;
            }, 5000);
        } catch (err) {
            console.error('복사 중 오류 발생:', err);
        }
        document.body.removeChild(textArea);
    }
}

// 초기 설정
document.addEventListener('DOMContentLoaded', function() {
    toggleInput('pem');
    selectHash('sha256');
});

function onMenuClick() {
    console.log("인증서 서명 메뉴가 클릭되었습니다.");

    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    if (serverInfo) {
        document.getElementById('caServerUrl').value = serverInfo.cfsslServerUrl;
    }

    toggleInput('pem');
    selectHash('sha256');
}

function toggleSanSection() {
    const sanContent = document.getElementById('sanContent');
    const sanToggleIcon = document.getElementById('sanToggleIcon');
    if (sanContent.style.display === 'none' || sanContent.style.display === '') {
        sanContent.style.display = 'block';
        sanToggleIcon.textContent = '-';
    } else {
        sanContent.style.display = 'none';
        sanToggleIcon.textContent = '+';
    }
}

function toggleOtherExtenSection() {
    const sanContent = document.getElementById('otherExtensionContent');
    const sanToggleIcon = document.getElementById('otherToggleIcon');
    if (sanContent.style.display === 'none' || sanContent.style.display === '') {
        sanContent.style.display = 'block';
        sanToggleIcon.textContent = '-';
    } else {
        sanContent.style.display = 'none';
        sanToggleIcon.textContent = '+';
    }
}

