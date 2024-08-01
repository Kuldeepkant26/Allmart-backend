const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listings",
        required: false
    }]
});

module.exports = mongoose.model('Users', userSchema);
