const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
},
{ timestamps: true }
);
const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
