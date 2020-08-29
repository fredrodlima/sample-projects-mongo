import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  branch: {
    type: Number,
    required: true,
  },
  account: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
});

const accountsModel = mongoose.model('accounts', accountSchema);

export default accountsModel;
