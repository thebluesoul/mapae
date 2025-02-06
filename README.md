# MAPAE (마패)

## 프로젝트 소개
**MAPAE** 프로젝트는 **CFSSL 서버**를 기반으로 인증서 발행을 테스트할 수 있는 **웹 애플리케이션**입니다. 
사용자는 **웹 인터페이스**를 통해 **CFSSL 서버**와 상호 작용하여 인증서를 발행하고 관리할 수 있습니다.

### 기술 스택
이 프로젝트는 다음과 같은 기술로 구성되어 있습니다:
- **JavaScript** (68.9%)
- **HTML** (28.0%)
- **CSS** (3.1%)

### 주요 파일
- `app.js`
- `index.html`
- `main.js`
- `styles.css`

---

## 실행 환경
MAPAE는 **Docker Compose 환경**에서 실행되며, 주요 구성 요소는 다음과 같습니다:
- **CFSSL** 서버
- **MySQL 5.7** (인증서 정보 저장)

이 구성을 통해 사용자는 인증서를 발급하고 관리할 수 있습니다.

---

## 설치 및 실행 방법

### 1. 프로젝트 클론
```sh
$ git clone https://github.com/thebluesoul/mapae.git
$ cd mapae
```

### 2. 필수 패키지 설치
```sh
$ apt update && apt install -y \
  openssl \
  docker.io \
  docker-compose \
  gnupg2 \
  pass \
  jq \
  dmidecode
```

### 3. Docker 실행
```sh
$ sudo su
# docker-compose build --no-cache
# docker-compose up -d
```

위 명령어를 실행하면 **CFSSL 서버 및 MySQL**이 설정되고, 프로젝트가 실행됩니다.

---

## 브라우저에서 확인하는 방법

### 1. 웹 애플리케이션 접속
웹 브라우저를 열고 다음 주소로 접속합니다:
```sh
http://localhost:4000
```
이 페이지에서 **CFSSL 서버와 상호작용하여 인증서를 발급**할 수 있습니다.

### 2. CFSSL 서버 상태 확인
CFSSL 서버가 정상적으로 실행되고 있는지 확인하려면:
```sh
http://localhost:8889/api/v1/cfssl/info
```
이 페이지에서 CFSSL 서버의 정보를 확인할 수 있습니다.

### 3. MySQL 데이터베이스 접속 (옵션)
MySQL에 직접 접속하여 인증서 데이터를 확인할 수도 있습니다:
```sh
$ mysql -h 127.0.0.1 -P 3306 -u mapae_user -p
Enter password: mapae_password
mysql> USE MAPAEDB;
mysql> SHOW TABLES;
```

---

## 추가 정보
- CFSSL 관련 문서: [https://github.com/cloudflare/cfssl](https://github.com/cloudflare/cfssl)
- Docker 공식 문서: [https://docs.docker.com/compose/](https://docs.docker.com/compose/)

이제 브라우저에서 프로젝트를 확인하고 CFSSL 서버와 상호작용할 수 있습니다. 🚀
