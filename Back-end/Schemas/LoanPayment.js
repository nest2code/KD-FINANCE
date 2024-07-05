const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
    loanApplication: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'LoanApplication', 
        required: true 
    }, // Reference to the loan application
    paymentAmount: { 
        type: Number, 
        required: true 
    }, // Amount of the payment
    paymentDate: { 
        type: Date, 
        default: Date.now 
    }, // Date of the payment
      // Mode of the payment
    paymentMode: { 
        type: String, 
        enum: ['MobileMoney', 'Bank', 'Cash', 'Saving'], 
        required: true 
    },
    details:{
        type:String,
        required:true
    } ,
  
    balance: {
        type: Number,
        required: true // or you can set a default value if needed
    }
});

const LoanPayment = mongoose.model('LoanPayment', loanPaymentSchema);
module.exports = LoanPayment;

