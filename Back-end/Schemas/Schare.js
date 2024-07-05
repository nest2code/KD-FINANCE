const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user owning the share
    amount: { type: Number, required: true }, 
    transferTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user to whom shares were transferred
    transferFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user from whom shares were transferred
    shareDate: { type: Date, default: Date.now }, // Date of the share transaction
    association: { type: mongoose.Schema.Types.ObjectId, ref: 'Association' } // Reference to the user's association
}, { timestamps: true });

// Pre-save middleware to automatically set the association field
shareSchema.pre('save', async function(next) {
    if (!this.association) {
        const user = await mongoose.model('User').findById(this.user);
        this.association = user.association;
    }
    next();
});

const Share = mongoose.model('Share', shareSchema);
module.exports = Share;

