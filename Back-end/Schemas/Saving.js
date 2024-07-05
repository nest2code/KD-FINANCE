const mongoose = require('mongoose');

const savingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the saving
    amount: { type: Number, required: true }, // Saving amount
    savingDate: { type: Date, default: Date.now }, // Date of the saving
    association: { type: mongoose.Schema.Types.ObjectId, ref: 'Association' } // Reference to the user's association
}, { timestamps: true });

// Pre-save middleware to automatically set the association field
savingSchema.pre('save', async function(next) {
    if (!this.association) {
        const user = await mongoose.model('User').findById(this.user);
        this.association = user.association;
    }
    next();
});

const Saving = mongoose.model('Saving', savingSchema);
module.exports = Saving;
