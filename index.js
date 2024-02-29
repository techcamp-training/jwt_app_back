// expressの読み込み
const express = require("express");
const app = express();
app.use(express.json());

// prisma使用の宣言
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// cors対策
const cors = require('cors')
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// firebaseの初期化
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 全データの取得
app.get("/books", async (_, res) => {
  try {
    const AllBooks = await prisma.book.findMany();
    res.json(AllBooks);
  } catch(error) {
    console.log("データの取得に失敗しました",error)
  }
})

// 本データの作成
app.post("/books", async(req, res) => {
  try {
    const book = await prisma.book.create({ data: req.body})
    res.json(book)
  } catch(error) {
    res.status(500).send("データの保存に失敗しました");
  }
})


// JWTトークン検証の処理
const verifyToken = async (req, res, next) => {
  // AuthorizationヘッダーからBearerトークンを抽出
  const token = req.headers.authorization.split("Bearer ")[1];
  try {
    // Firebase Admin SDKのverifyIdTokenメソッドを使用して、tokenの検証を実施。
    // tokenが正しい場合はdecodedTokenにユーザー情報が含まれ、next()次の処理に進む。
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch(error) {
    res.status(403).send('idが確認できませんでした');
  }
}


// ログイン中ユーザーの投稿物のみ抽出する。verifyTokenでメソッドの呼び出しを実施。
app.get('/mybook', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const AllBooks = await prisma.book.findMany();
    const filterBooks = AllBooks.filter(book => uid === book.uid);
    res.json(filterBooks);
  } catch(error) {
    res.status(500).send('データの取得ができませんでした');
  }
})

app.get('/users', async(req, res) => {
  // レスポンス返却用の配列を準備
  let allUsers = [];

  // ユーザーのリストを取得するための非同期関数
  const listAllUsers = async (nextPageToken) => {
    try {
      // Firebase Authenticationからユーザー情報を取得
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      // 取得したユーザー情報を配列に追加
      allUsers = allUsers.concat(listUsersResult.users.map(userRecord => userRecord.toJSON()));
      // 次のページトークンがあれば、次のバッチのユーザーも取得
      if (listUsersResult.pageToken) {
        // 再帰的に次のバッチのユーザーを取得
        await listAllUsers(listUsersResult.pageToken);
      }
    } catch (error) {
      console.log('Error listing users:', error);
      throw error; // エラーをスローして、後続の処理を停止
    }
  };

  // リスト収集のメソッド呼び出し
  try {
    await listAllUsers();
    console.log(allUsers)
    res.json(allUsers);
  }catch(error){
    res.status(500).send("ユーザーリストの取得に失敗しました。");
  }
})


app.listen(3000, () => {
  console.log("listening on localhost port 3000");
})