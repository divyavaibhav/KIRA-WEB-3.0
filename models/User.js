const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    discordId: {
        type: String,
        required: true,
    },
    user: {
        type: Array,
        required: true,
    },
    guilds: {
        type: Array,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = model("User", userSchema);