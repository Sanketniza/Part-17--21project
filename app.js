const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const upload = require('./Config/multerconfig');
// const multer = require('multer');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/profile/upload", (req, res) => {
    res.render("profileupload");
});

app.post("/upload",isLoggedIn , upload.single('image'), async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });

    user.profilePic = req.file.filename;
    await user.save();
    res.redirect("/profile");
})

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
    console.log(req.user);
    let user = await userModel.findOne({ email: req.user.email }).populate('post');
    if (!user) {
        return res.status(404).send("User not found");
    }
    console.log(user);
    res.render("profile", { user });

});

app.get("/like/:id", isLoggedIn, async (req, res) => {
     let post = await postModel.findOne({ _id: req.params.id }).populate('user');

     if(post.likes.indexOf(req.user.userid) === -1){
         post.likes.push(req.user.userid);
     }
     else {
        // post.like.indexOf(req.user.userid);
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
     }

     await post.save();
     res.redirect("/profile");
});

app.get("/edit/:id" , isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    res.render("edit", {post});
})

app.get("/test" , isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    res.render("test", {post});
})

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id });
    post.content = req.body.content;
    await post.save();
    res.redirect("/profile");

})


app.post("/post" , isLoggedIn , async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
  
     let { content } = req.body;
     let post = await postModel.create({
        user: user._id,
        content
        // content:content
    });

    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");
})


app.post("/register", async (req, res) => {
    try {
        const { email, password, username, name, age } = req.body;

        let user = await userModel.findOne({ email });
        if (user) return res.status(400).send("User already exists");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        user = await userModel.create({
            password: hash,
            email,
            username,
            name,
            age
        });

        const token = jwt.sign({ email: email, userid: user._id }, "kuchh bhi");
        res.cookie("token", token);
        res.send("Registered");
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.status(404).send("User not found");

        const result = await bcrypt.compare(password, user.password);
        if (result) {
            const token = jwt.sign({ email: email, userid: user._id }, "kuchh bhi");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        } else {
            res.redirect("/login");
        }
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const data = jwt.verify(token, "kuchh bhi");
        req.user = data;
        next();
    } catch {
        res.send("You must be logged in");
    }
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
