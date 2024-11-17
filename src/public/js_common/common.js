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