// 메뉴 클릭 시 초기 설정 함수
function onMenuClick() {
    console.log("인증서 폐기 메뉴가 클릭되었습니다.");

    const serverInfo = JSON.parse(localStorage.getItem('serverInfo'));

    const table = document.getElementById('certificates-table').getElementsByTagName('tbody')[0];
    const details = document.getElementById('certificate-details');
    const revokeButton = document.getElementById('revoke-button');
    const revokeSection = document.getElementById('revoke-section');
    const revokeReason = document.getElementById('revoke-reason');

    let selectedCertificate = null;

    function loadCertificates(page = 1) {
        fetch('/api/certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: serverInfo.dbHost,
                port: serverInfo.dbPort,
                user: serverInfo.dbUser,
                password: serverInfo.dbPassword,
                database: "MAPAEDB",
                page: page
            })
        })
        .then(response => response.json())
        .then(certificates => {
            table.innerHTML = '';
            // console.log("certificates=", certificates);
            certificates.forEach(cert => {
                const row = table.insertRow();
                row.insertCell(0).innerText = truncateText(cert.serial_number, 10);
                row.insertCell(1).innerText = truncateText(cert.authority_key_identifier, 10);
                row.insertCell(2).innerText = cert.status;
                row.insertCell(3).innerText = cert.expiry;
                row.insertCell(4).innerText = cert.reason;
                row.addEventListener('click', () => {
                    selectedCertificate = cert;
                    showDetails(cert);
                    highlightSelectedRow(row);
                });
            });
        });
    }

    function truncateText(text, length) {
        if (text.length > length) {
            return text.slice(0, length) + '...';
        }
        return text;
    }

    function copyPemContent() {
        const pemContent = document.getElementById('pem-content').textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pemContent).then(function() {
                const copyButton = document.getElementById('copy-button');
                copyButton.textContent = '복사함';
                setTimeout(function() {
                    copyButton.textContent = 'Copy PEM Content';
                }, 5000);
            }, function() {
                alert('Failed to copy content.');
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = pemContent;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                const copyButton = document.getElementById('copy-button');
                copyButton.textContent = '복사함';
                setTimeout(function() {
                    copyButton.textContent = 'Copy PEM Content';
                }, 5000);
            } catch (err) {
                alert('Failed to copy content.');
            }
            document.body.removeChild(textArea);
        }
    }

    function getReasonDescription(reason) {
        const reasons = {
            0: '특정한 이유가 지정되지 않았음 (0)',
            1: '인증서의 키가 손상되었거나 유출되었음 (1)',
            2: '인증서를 발급한 인증 기관(CA)이 손상 (2)',
            3: '인증서 소유자의 소속이 변경 (3)',
            4: '새로운 인증서로 대체 (4)',
            5: '인증서 소유자의 운영이 중단 (5)',
            6: '인증서가 일시적으로 보류 (6)',
            8: '인증서가 CRL(인증서 폐기 목록)에서 제거 (8)',
            9: '인증서 소유자의 권한이 철회 (9)',
            10: '속성 인증 기관(Attribute Authority, AA)이 손상 (10)'
        };
        return reasons[reason] || '알 수 없는 이유';
    }

    function showDetails(cert) {
        const reasonDescription = getReasonDescription(cert.reason);
        details.innerHTML = `
            <h3>Certificate Details</h3>
            <p><strong>Serial Number:</strong> ${cert.serial_number}</p>
            <p><strong>Authority Key Identifier:</strong> ${cert.authority_key_identifier}</p>
            <p><strong>Status:</strong> ${cert.status}</p>
            <p><strong>Expiry:</strong> ${cert.expiry}</p>
            <p><strong>Reason:</strong> ${reasonDescription}</p>
            <button id="copy-button" class="btn btn-outline-primary-custom">Copy PEM Content</button>
            <pre><code id="pem-content">${cert.pem}</code></pre>
        `;
        revokeButton.classList.remove('hidden');
        revokeSection.classList.remove('hidden');

        const copyButton = document.getElementById('copy-button');
        document.getElementById('copy-button').addEventListener('click', copyPemContent);

        if (cert.status === "revoked") {
            revokeButton.disabled = true;
            revokeButton.classList.add('disabled');
        } else {
            revokeButton.disabled = false;
            revokeButton.classList.remove('disabled');
        }
    }

    function highlightSelectedRow(row) {
        // Remove highlight from previous selected row
        const rows = table.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            rows[i].classList.remove('selected-row');
        }
        // Highlight the current selected row
        row.classList.add('selected-row');
    }

    revokeButton.addEventListener('click', () => {
        if (!selectedCertificate) return;
        if (!selectedCertificate.status) return;

        const revocCert = {
            'serial': selectedCertificate.serial_number,
            'authority_key_id': selectedCertificate.authority_key_identifier,
            'reason': revokeReason.value
        };

        const proxyApiDataRevocation = {
                revocationCert: revocCert,
                caServer: serverInfo.cfsslServerUrl
        };
        fetch('/api/revoke-certificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proxyApiDataRevocation)
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            loadCertificates(); // Refresh the certificate list
        });
    });

    loadCertificates(); // Load certificates on page load
}
