import express from 'express';
import mongoose from 'mongoose';
import accountsRouter from './routes/accountsRouter.js';

const dbMongooseConnect = async () => {
  await mongoose
    .connect(
      'mongodb+srv://admin:y5nIA7NUbRKVY4Bj@bootcamp.zzbnu.azure.mongodb.net/mybank?authSource=admin&replicaSet=atlas-q3snr0-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true',
      {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .then(() => {
      console.log('Connected sucessfully with DB');
    })
    .catch((err) => {
      console.log(`Error connecting with DB : ${err.message}`);
    });
};

dbMongooseConnect();
const app = express();
app.use(express.json());
app.use('/account', accountsRouter);

app.listen(3000, () => {
  console.log('API up and running');
});
