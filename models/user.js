const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/blog", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    age: Number,
    profilePic: {
        type: String,
        default: "default.webp"
    },
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ]
});

module.exports = mongoose.model("User", userSchema);
