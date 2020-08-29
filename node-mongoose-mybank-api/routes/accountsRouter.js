import express from 'express';
import accountsModel from '../models/accountsModels.js';
const accountsRouter = express.Router();

accountsRouter.post('/', async (req, res, next) => {
  try {
    const newAccount = new accountsModel(req.body);
    await newAccount.save();
    res.status(201).send(newAccount);
  } catch (err) {
    next(err);
  }
});

accountsRouter.post('/migrateToPrivate', async (_, res, next) => {
  try {
    let branches = await accountsModel.distinct('branch');

    for (let branch of branches) {
      if (branch === 99) {
        continue;
      }
      const account = await accountsModel
        .findOne({ branch: branch })
        .sort({ balance: -1 })
        .limit(1);

      account.branch = 99;

      await accountsModel.updateOne({ _id: account.id }, account, {
        new: true,
      });
    }
    const privateAccounts = await accountsModel.find(
      { branch: 99 },
      { _id: 0, name: 1 }
    );
    res.status(200).send(privateAccounts);
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/', async (_, res, next) => {
  try {
    const accounts = await accountsModel.find({});
    res.send(accounts);
  } catch (err) {
    next(err);
  }
});

accountsRouter.delete('/', async (req, res, next) => {
  try {
    const { branch, account } = req.body;
    const accountToDelete = await accountsModel.findOne({
      branch: branch,
      account: account,
    });
    if (!accountToDelete) {
      res.status(404).send('Account does not exist!');
    } else {
      await accountsModel.findOneAndRemove({
        _id: accountToDelete.id,
      });

      const totalAccounts = await accountsModel.count({ branch: branch });

      res.status(200).send({ totalAccounts });
    }
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/balance', async (req, res, next) => {
  try {
    const { branch, account } = req.body;

    const accountFromDb = await accountsModel.findOne({
      branch: branch,
      account: account,
    });
    if (!accountFromDb) {
      res.status(404).send('Branch and account does not exist!');
    }

    res.send(accountFromDb);
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/averageBalance', async (req, res, next) => {
  try {
    const { branch } = req.body;
    const accounts = await accountsModel.find({ branch: branch });
    const branchBalance = accounts.reduce(
      (acc, curr) => (acc += curr.balance),
      0
    );
    const avg = branchBalance / accounts.length;
    console.log(branchBalance);
    console.log(accounts.length);
    res.send({ avg });
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/shortestBalances/:amount', async (req, res, next) => {
  try {
    const amount = parseInt(req.params.amount);
    const accounts = await accountsModel
      .find({}, { _id: 0, branch: 1, account: 1, balance: 1 })
      .sort({ balance: 1 })
      .limit(amount);
    res.send(accounts);
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/biggestBalances/:amount', async (req, res, next) => {
  try {
    const amount = parseInt(req.params.amount);
    const accounts = await accountsModel
      .find({}, { _id: 0, branch: 1, account: 1, balance: 1 })
      .sort({ balance: -1 })
      .limit(amount);
    res.send(accounts);
  } catch (err) {
    next(err);
  }
});

accountsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const account = await accountsModel.find({ _id: id });
    res.send(account);
  } catch (err) {
    next(err);
  }
});

accountsRouter.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const account = await accountsModel.findByIdAndUpdate(
      { _id: id },
      req.body,
      { new: true }
    );
    res.send(account);
  } catch (err) {
    next(err);
  }
});

accountsRouter.patch('/deposit', async (req, res, next) => {
  try {
    const { branch, account, ammount } = req.body;
    if (ammount <= 0) {
      res.status(400).send('Amount must be greater than 0 to make a deposit!');
    } else {
      const accountFromDb = await accountsModel.findOne({
        branch: branch,
        account: account,
      });

      if (!accountFromDb) {
        res.status(404).send('Branch and account does not exist!');
      }
      accountFromDb.balance += ammount;

      await accountsModel.updateOne({ _id: accountFromDb.id }, accountFromDb, {
        new: true,
      });

      res.send(accountFromDb);
    }
  } catch (err) {
    next(err);
  }
});

accountsRouter.patch('/withdraw', async (req, res, next) => {
  try {
    const { branch, account, ammount } = req.body;
    if (ammount <= 0) {
      res.status(400).send('Amount must be greater than 0 to make a withdraw!');
    } else {
      const accountFromDb = await accountsModel.findOne({
        branch: branch,
        account: account,
      });
      if (!accountFromDb) {
        res.status(404).send('Branch and account does not exist!');
      }
      const amounttoWithdrawFromAccount = ammount + 1;
      if (amounttoWithdrawFromAccount > accountFromDb.balance) {
        res
          .status(400)
          .send(
            `Sorry. You don't have the ${ammount} value in your balance. Please check your balance and try with a different amount!`
          );
      } else {
        accountFromDb.balance -= amounttoWithdrawFromAccount;

        await accountsModel.updateOne(
          { _id: accountFromDb.id },
          accountFromDb,
          {
            new: true,
          }
        );

        res.send(accountFromDb);
      }
    }
  } catch (err) {
    next(err);
  }
});

accountsRouter.post('/transfer', async (req, res, next) => {
  try {
    const { originAccount, destinationAccount, amount } = req.body;
    if (amount <= 0) {
      res.status(400).send('Amount must be greater than 0 to make a transfer!');
    } else {
      const originAccountFromDb = await accountsModel.findOne({
        account: originAccount,
      });
      const destinationAccountFromDb = await accountsModel.findOne({
        account: destinationAccount,
      });
      if (!originAccountFromDb) {
        res.status(404).send('Specified origin account not found!');
      } else if (!destinationAccountFromDb) {
        res.status(404).send('Specified destination account not found!');
      } else {
        let amounttoTransfer = amount;
        if (originAccountFromDb.branch !== destinationAccountFromDb.branch) {
          amounttoTransfer += 8;
        }
        if (amounttoTransfer > originAccountFromDb.balance) {
          res
            .status(400)
            .send(
              `Sorry. You don't have the ${amount} value in your balance. Please check your balance and try with a different amount!`
            );
        } else {
          originAccountFromDb.balance -= amounttoTransfer;
          destinationAccountFromDb.balance += amount;

          await accountsModel.updateOne(
            { _id: originAccountFromDb.id },
            originAccountFromDb,
            {
              new: true,
            }
          );
          await accountsModel.updateOne(
            { _id: destinationAccountFromDb.id },
            destinationAccountFromDb,
            {
              new: true,
            }
          );

          res.status(200).send({ balance: originAccountFromDb.balance });
        }
      }
    }
  } catch (err) {
    next(err);
  }
});

accountsRouter.use((err, _, res) => {
  res.status(500).send({ error: err.message });
});

export default accountsRouter;
