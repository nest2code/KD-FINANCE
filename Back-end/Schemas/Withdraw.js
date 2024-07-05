const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    withdrawalDate: { type: Date, default: Date.now },
    association: { type: mongoose.Schema.Types.ObjectId, ref: 'Association' }
}, { timestamps: true });

withdrawalSchema.pre('save', async function(next) {
    if (!this.association) {
        const user = await mongoose.model('User').findById(this.user);
        this.association = user.association;
    }
    next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
module.exports = Withdrawal;
