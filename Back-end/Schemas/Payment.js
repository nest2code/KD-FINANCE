const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the payment
    loanApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication', required: true }, // Reference to the loan application being paid for
    amount: { type: Number, required: true }, // Payment amount
    paymentDate: { type: Date, default: Date.now }, // Date of the payment
    association: { type: mongoose.Schema.Types.ObjectId, ref: 'Association' } // Reference to the user's association
}, { timestamps: true });

// Pre-save middleware to automatically set the association field
paymentSchema.pre('save', async function(next) {
    if (!this.association) {
        const user = await mongoose.model('User').findById(this.user);
        this.association = user.association;
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
