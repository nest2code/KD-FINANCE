const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  nin_number: String,
  email: String,
  phone_number: String,
  photo: String,
  password: String,
  mission: String,
  profession: String,
  district: String,
  municipality: String,
  division: String,
  region: String,
  push_notifications: {
    type: String,
    default: false,
  },
  push_nothing: {
    type: String,
    default: false,
  },
  status: {
    type: String,
    default: "Pending",
  },
  savings: { type: Number, default: 0 }, // Total savings amount
  shareCapital: { type: Number, default: 0 }, // Total share capital
  loanBalance: { type: Number, default: 0 }, // Current loan balance
  loanApplications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' }], // References to the user's loan applications
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }], // References to the user's payments
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Share' }], // References to the user's share transactions
  savingsHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Saving' }], // References to the user's savings
  association: { type: mongoose.Schema.Types.ObjectId, ref: 'Association'}, // Reference to the user's association
  withdrawals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' }],
  shareTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }], // References to the user's share transactions
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
module.exports = User;

