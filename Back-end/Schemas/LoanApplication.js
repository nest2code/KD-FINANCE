const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending'
    },
    interestRate: { 
        type: Number 
    },
    duration: { 
        type: Number 
    },
    startDate: { 
        type: Date 
    },
    endDate: { 
        type: Date 
    },
    association: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Association',
        required: true 
    },
    balance: { 
        type: Number, 
        default: function() {
            return this.amount * (1 + (this.interestRate || 0) / 100);
        }
    },
    payments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'LoanPayment' 
    }]
}, { timestamps: true });

// Pre-save middleware to handle startDate, endDate, and association
loanApplicationSchema.pre('save', async function(next) {
    if (this.isModified('status') && this.status === 'Approved' && !this.startDate) {
        this.startDate = new Date(); // Set startDate to current date when loan is approved
        if (this.duration && typeof this.duration === 'number') {
            const endDate = new Date(this.startDate);
            endDate.setMonth(endDate.getMonth() + this.duration); // Calculate endDate based on duration
            this.endDate = endDate;
        }
    }
    next();
});

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);
module.exports = LoanApplication;
