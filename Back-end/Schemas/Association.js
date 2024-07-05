const mongoose = require('mongoose');

const associationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Name of the association
    chairperson:{
        type: String, required: true 
    },
    secretary:{
        type: String, required: true 
    },
    treasurer:{
        type: String, required: true 
    },
    totalSavings: { type: Number, default: 0 }, // Total savings of the association
    totalShares: { type: Number, default: 0 }, // Total shares of the association
    totalLoanBalance: { type: Number, default: 0 }, // Total loan balance of the association
    totalPayments: { type: Number, default: 0 }, // Total payments made by members of the association
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Members of the association
}, { timestamps: true });

const Association = mongoose.model('Association', associationSchema);
module.exports = Association;
