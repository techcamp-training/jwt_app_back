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

// 全データの取得
app.get("/", async (_, res) => {
  try {
    const AllBooks = await prisma.book.findMany();
    res.json(AllBooks);
  } catch(error) {
    console.log("データの取得に失敗しました",error)
  }
})

// 本データの作成
app.post("/books", async(req, res) => {
  console.log(req.body)
  try {
    const book = await prisma.book.create({ data: req.body})
  } catch(error) {
    res.status(500).send("データの保存に失敗しました");
  }
})

app.listen(3000, () => {
  console.log("listening on localhost port 3000");
})