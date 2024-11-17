function onMenuClick() {
    console.log("서버 정보 메뉴가 클릭되었습니다.");
    loadServerInfo();
    toggleInputOption('pem');
}

function toggleInputOption(type) {
    // 파일 업로드 그룹
    const certFileGroup = document.getElementById('CertFileGroup');
    // PEM 내용 그룹
    const pemContentGroup = document.getElementById('pemContentGroup');
    // 파일 기반 버튼
    const crlFileBased = document.getElementById('crlFileBased');
    // PEM 내용 버튼
    const crlPemContents = document.getElementById('crlPemContents');

    if (type === 'file') {
        certFileGroup.classList.remove('hidden');
        pemContentGroup.classList.add('hidden');
        crlFileBased.classList.add('active');
        crlPemContents.classList.remove('active');
    } else if (type === 'pem') {
        certFileGroup.classList.add('hidden');
        pemContentGroup.classList.remove('hidden');
        crlFileBased.classList.remove('active');
        crlPemContents.classList.add('active');
    }
}

function saveServerInfo() {
    const dbHost = document.getElementById('dbHost').value;
    const dbPort = document.getElementById('dbPort').value;
    const dbUser = document.getElementById('dbUser').value;
    const dbPassword = document.getElementById('dbPassword').value;
    const cfsslServerUrl = document.getElementById('cfsslServerUrl').value;
    const nodeJsServer = document.getElementById('nodeJsServer').value;

    const serverInfo = {
        dbHost,
        dbPort,
        dbUser,
        dbPassword,
        cfsslServerUrl,
        nodeJsServer
    };
    localStorage.setItem('serverInfo', JSON.stringify(serverInfo));


    const subjectTemplate = {
        CN: document.getElementById('commonName').value,
        C: document.getElementById('countryName').value,
        ST: document.getElementById('stateName').value,
        L: document.getElementById('localityName').value,
        O: document.getElementById('organizationName').value,
        OU: document.getElementById('organizationalUnitName').value,
        KeyType: document.getElementById('keyAlgorithms').value,
        KeySize: document.getElementById('keySize').value,
        Pkcs12PassWord: document.getElementById('pkcs12Password').value
    };
    localStorage.setItem('subjectTemplate', JSON.stringify(subjectTemplate));


    const serverInfoResult = {
        dbHost,
        dbPort,
        dbUser,
        dbPassword,
        cfsslServerUrl,
        nodeJsServer,
        subjectTemplate
    };
    document.getElementById('server-info-result').textContent = JSON.stringify(serverInfoResult, null, 2);
}

function loadServerInfo() {
    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    if (serverInfo) {
        document.getElementById('dbHost').value = serverInfo.dbHost;
        document.getElementById('dbPort').value = serverInfo.dbPort;
        document.getElementById('dbUser').value = serverInfo.dbUser;
        document.getElementById('dbPassword').value = serverInfo.dbPassword;
        document.getElementById('cfsslServerUrl').value = serverInfo.cfsslServerUrl;
        if (serverInfo.nodeJsServer)
            document.getElementById('nodeJsServer').value = serverInfo.nodeJsServer;
    }
    loadTemplate();
}

function loadTemplate() {
    const subjectTemplate = JSON.parse(localStorage.getItem('subjectTemplate'));
    if (subjectTemplate) {
        document.getElementById('commonName').value = subjectTemplate.CN;
        document.getElementById('countryName').value = subjectTemplate.C;
        document.getElementById('stateName').value = subjectTemplate.ST;
        document.getElementById('localityName').value = subjectTemplate.L;
        document.getElementById('organizationName').value = subjectTemplate.O;
        document.getElementById('organizationalUnitName').value = subjectTemplate.OU;
        document.getElementById('keyAlgorithms').value = subjectTemplate.KeyType;
        document.getElementById('keySize').value = subjectTemplate.KeySize;
        document.getElementById('pkcs12Password').value = subjectTemplate.Pkcs12PassWord;
    } else {
        alert('저장된 Subject Template 이 없습니다. 기본값을 가져옵니다.');
        document.getElementById('commonName').value = "OCSP Responder";
        document.getElementById('countryName').value = "KR";
        document.getElementById('stateName').value = "Gyeonggi-do";
        document.getElementById('localityName').value = "Anyang-si";
        document.getElementById('organizationName').value = "GENIANs, INC.";
        document.getElementById('organizationalUnitName').value = "Technical Research Center";
        document.getElementById('keyAlgorithms').value = "rsa";
        document.getElementById('keySize').value = "2048";
        document.getElementById('pkcs12Password').value = "12345";
    }
}

document.getElementById('togglePasswordButton').addEventListener('click', function () {
    const passwordField = document.getElementById('dbPassword');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.textContent = 'Hide Password';
    } else {
        passwordField.type = 'password';
        this.textContent = 'Show Password';
    }
});

// 비밀번호 표시 토글 기능
document.getElementById('showPassword').addEventListener('click', function () {
    const passwordField = document.getElementById('pkcs12Password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.textContent = 'Hide Password';
    } else {
        passwordField.type = 'password';
        this.textContent = 'Show Password';
    }
});

async function importRootCert() {
    const rootCertPem = document.getElementById('rootCertPem').value;
    const rootKeyPem = document.getElementById('rootKeyPem').value;

    try {
        const response = await fetch('/api/import-root-cert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rootCertPem, rootKeyPem })
        });

        const result = await response.json();
        if (result.success) {
            alert('Root certificate and private key were saved successfully.');
        } else {
            alert('Failed to save root certificate and private key. (Reason: ' + result.error + ')');
        }
    } catch (error) {
        console.error('Error storing root certificate and private key. (Reason: %s)', error);
        alert('An error occurred while saving the root certificate and private key files.');
    }
}

async function importRootCertFile() {
    const rootCertFile = document.getElementById('rootCertFile').files[0];
    const rootKeyFile = document.getElementById('rootKeyFile').files[0];

    const formData = new FormData();
    formData.append('rootCertFile', rootCertFile);
    formData.append('rootKeyFile', rootKeyFile);

    try {
        const response = await fetch('/api/import-root-cert-file', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert('The root certificate and private key have been successfully saved to a file.');
        } else {
            alert('Failed to save root certificate and private key files. (Reason: ' + result.error + ')');
        }
    } catch (error) {
        console.error('Error saving root certificate and private key files. (Reason: %s)', error);
        alert('An error occurred while saving the root certificate and private key files.');
    }
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


document.getElementById('loadTemplateButton').addEventListener('click', loadTemplate);