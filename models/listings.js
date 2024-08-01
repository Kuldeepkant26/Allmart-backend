const mongoose = require('mongoose');
const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reviews",
        }
    ]
});

module.exports = mongoose.model('Listings', listingSchema);

