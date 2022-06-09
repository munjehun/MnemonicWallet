const express = require("express");
const app = express();
const fs = require("fs"); // 파일 쓰고저장하는 모듈
const port = 8080;
const lightwallet = require("eth-lightwallet");
// 노드없이도 비밀키 암호화, 저장할수 있는 모듈.
// BIP32와 BIP39를 사용하여 무작위로 생성된 12단어 시드로부터 주소의 HD 트리를 생성한다.

app.use(express.json());
// express.json()은 json으로 이루어진 요청을 받을 때 제대로 받아오지 못하는 경우에 사용하는 express 내장 함수
// express.json()는 Express의 내장 미들웨어 기능으로 v4.16.0부터 시작됨.착신 JSON req를 해석.
// express.json() 없이는 json형태의 req가 정의되지 않음.
app.use(express.urlencoded({ extended: false }));
// .urlencoded()은 x-www-form-urlencoded형태의 데이터를 해석해줌.
// 요청의 본문에 있는 데이터가 URL-encoded 형식의 문자열로 넘어오기 때문에 객체로의 변환이 필요함.

//니모닉 12개 시드 생성
app.post("/newMnemonic", async (req, res) => {
  let mnemonic;
  try {
    mnemonic = lightwallet.keystore.generateRandomSeed();
    // eth-lightwallet의 keystore.generateRandomSeed()를 실행;
    // keystore.generateRandomSeed() : 랜덤 12워드 시드로 구성된 문자열을 생성하여 반환합니다.
    res.json({ mnemonic });
    // mnemonic 으로 응답
  } catch (err) {
    console.log(err);
  }
});

app.post("/newWallet", async (req, res) => {
  let password = req.body.password; // 원하는 비번입력
  let mnemonic = req.body.mnemonic; // POST/newMnemonic 으로 받은 시드 입력

  try {
    lightwallet.keystore.createVault(
      // keystore.createVault(options, callback)
      // 옵션들
      // password: (필수) 시리얼화 시 볼트를 암호화하기 위해 사용되는 문자열.
      // seedPhrase: (필수) 모든 계정을 생성하기 위해 사용되는 12단어 니모닉.
      // salt: (옵션)사용자는 볼트 암호화 및 복호화에 사용되는 솔트를 제공할 수 있습니다.그렇지 않으면 임의의 솔트가 생성됩니다.
      // hdPathString(필수):사용자는 다음을 제공해야 합니다.BIP39준거 HD 패스 문자열.지금까지 기본값은 다음과 같습니다.m/0'/0'/0'또 다른 일반적인 것은 BIP44 패스 문자열입니다.m/44'/60'/0'/0.
      {
        password: password,
        seedPhrase: mnemonic, // 계정 생성하기 위해 필요한 시드구문 : 받아온 시드구문 입력
        hdPathString: "m/0'/0'/0'",
      },
      function (err, ks) {
        // index.d.ts에 보면 createVault 함수 두번째 인자로 keystore 넣는다.   ===> ks = keystore;
        ks.keyFromPassword(password, function (err, pwDerivedKey) {
          ks.generateNewAddress(pwDerivedKey, 1);

          let address = ks.getAddresses().toString();
          let keystore = ks.serialize();

          fs.writeFile("wallet.json", keystore, function (err, data) {
            if (err) {
              res.json({ code: 999, message: "실패" });
            } else {
              res.json({ code: 1, message: "성공" });
            }
          });
        });
      }
    );
  } catch (exception) {
    console.log("NewWallet ==>>>> " + exception);
  }
});

//서버 시작
app.listen(port, () => {
  console.log("Listening...");
});
