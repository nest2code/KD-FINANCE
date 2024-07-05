const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    Requirement:{
        type:String,
        required:true
    },
    postDate:{
        type:String,
        required:true
    },
    deadLine:{
        type:String,
        required:true
    }
});

const Job = mongoose.model('Job',jobSchema);
module.exports = Job;