const mongoose = require('mongoose');

let reviewSchema = mongoose.Schema({
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: false
    }
});

module.exports = mongoose.model('Reviews', reviewSchema);