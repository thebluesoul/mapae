function onMenuClick() {
    console.log("CRL(Certificate Revocation List) 메뉴가 클릭되었습니다.");
}

var crlCertPem;
async function generateCRL() {
    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));
    const caServerUrl = serverInfo.cfsslServerUrl;

    try {
        const response = await fetch('/api/crl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                caServer: caServerUrl
            })
        });

        const crlcert = await response.json();
        if (crlcert.success) {
            crlCertPem = crlcert.result;

            document.getElementById('view-crl-button').style.display = 'block';
        } else {
            console.error('Error generating CRL:', crlcert.errors);
            alert('Failed to generate CRL');
        }

    } catch (error) {
        console.error('Error generating CRL:', error);
    }
}

async function viewCRL() {
    const crlContent = document.getElementById('crl-content');
    crlContent.textContent = crlCertPem;
    crlContent.style.display = 'block';

    const copyButton = document.getElementById('copyCrlButton');
    copyButton.style.display = 'block';

    // CRL 다운로드 링크를 보이도록 설정
    const downloadLinks = document.getElementById('downloadLinks');
    downloadLinks.classList.remove('hidden');

    const downloadCrlCert = document.getElementById('downloadCrlCert');
    if (crlCertPem) {
        downloadCrlCert.href = URL.createObjectURL(new Blob([crlCertPem], { type: 'application/x-pem-file' }));
        downloadCrlCert.download = `crl.pem`;
    }

    try {
        const response = await fetch('/api/crlinfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                crlpem: crlCertPem
            })
        });

        const crlinfo = await response.json();
        if (crlinfo.success) {
            // crlCertPem = crlinfo.result;
            const crlContentInfo = document.getElementById('crl-content-info');
            crlContentInfo.textContent = crlinfo.result;
            crlContentInfo.style.display = 'block';

        } else {
            console.error('Error generating CRL:', crlcert.errors);
            alert('Failed to generate CRL');
        }
    } catch (error) {
        console.error('Error generating CRL:', error);
    }
}

document.getElementById('copyCrlButton').addEventListener('click', function () {
    const crlContent = document.getElementById('crl-content').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(crlContent).then(function() {
            const copyButton = document.getElementById('copyCrlButton');
            copyButton.textContent = '복사함';
            setTimeout(function() {
                copyButton.textContent = 'Copy PEM Content';
            }, 5000);
        }, function() {
            alert('Failed to copy content.');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = crlContent;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            const copyButton = document.getElementById('copyCrlButton');
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

document.getElementById('view-crl-button').addEventListener('click', viewCRL);