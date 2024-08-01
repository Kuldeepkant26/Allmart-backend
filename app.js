const express = require('express');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

require('dotenv').config();

const Listings = require('./models/listings');
const Users = require('./models/users.js');
const Reviews = require('./models/reviews.js');

const { verifyToken } = require('./middlewares.js');

const { encryptPass } = require('./helper.js')

const app = express();
let cors = require('cors');

app.listen(8080, () => {
    console.log('Server is Listening on port 8080');
});

async function main() {
    await mongoose.connect(process.env.MONGO_URL);
}

main().then(() => {
    console.log("connected to Db named fs2");
})


app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Routes working');
});


app.get('/testing', async (req, res) => {
    let listings = await Listings.find();
    let user = { name: "Kuldeep", age: 22 }
    res.json(listings);
});

app.get('/show/:id', async (req, res) => {
    try {
        let listing = await Listings.findById(req.params.id).populate('owner').populate({ path: "reviews", populate: { path: "owner" } })
        res.json(listing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/add', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send({
                message: 'Authorization header is missing'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).send({
                message: 'Token is missing'
            });
        }

        const data = JWT.decode(token);
        if (!data || !data.id) {
            return res.status(401).send({
                message: 'Invalid token'
            });
        }

        const user = await Users.findById(data.id);
        if (!user) {
            return res.status(404).send({
                message: 'User not found'
            });
        }

        let { imageLink, title, description, price, category } = req.body;

        if (!imageLink || !title || !description || !price || !category) {
            return res.status(400).send({
                message: 'All fields are required'
            });
        }

        let l1 = new Listings({
            title: title,
            image: imageLink,
            description: description,
            price: price,
            category: category,
            owner: user._id // Store user ID instead of user object
        });

        user.products.push(l1._id); // Store listing ID in user's products array
        await user.save();
        await l1.save();

        res.status(200).send({
            message: 'Listing added successfully'
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).send({
            message: 'Internal server error',
            error: err.message
        });
    }
});

app.get('/deleteListing/:id', async (req, res) => {
    await Listings.findByIdAndDelete(req.params.id);
    res.status(200).send({
        success: true,
        message: 'Listing deleted successfully'
    })
})

app.post('/edit/:id', async (req, res) => {
    let { image, title, description, price, category } = req.body;
    let { id } = req.params;
    try {
        await Listings.findByIdAndUpdate(id, {
            image: image,
            title: title,
            description: description,
            price: price,
            category: category
        })
    } catch (err) {
        res.status(500).send({
            message: 'Error saving listing',
        })
    }
    res.status(200).send({
        message: 'Edited the Listing'
    })
})

app.post('/signup', async (req, res) => {
    let { userName, email, password } = req.body;
    try {
        let checkUser = await Users.findOne({ email });
        if (checkUser) {
            return res.status(409).send({
                message: "User already registered"
            });
        }

        let pass = await encryptPass(password);

        let newUser = new Users({
            userName,
            email,
            password: pass
        });

        await newUser.save();
        res.status(201).send({
            message: "Signup successful"
        });

    } catch (err) {
        res.status(500).send({
            message: err.message
        });
    }
});


app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    try {
        let user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).send({
                message: 'User not found'
            });
        }


        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {

            return res.status(401).send({
                message: 'Incorrect password'
            });
        }

        let token = JWT.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).send({
            message: 'Login successful',
            token
        });
    } catch (err) {
        res.status(500).send({
            message: 'Internal server error',
            error: err.message
        });
    }
});

app.post('/curruser', async (req, res) => {
    try {
        // Decode the token
        const data = JWT.decode(req.body.token);
        if (!data || !data.email) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // Find the user and exclude the password
        const user = await Users.findOne({ email: data.email }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the user data
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/review/:pid', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader.split(' ')[1];
        const data = JWT.decode(token);
        let user = await Users.findById(data.id);
        let { rating, comment } = req.body;
        let { pid } = req.params;

        let r1 = new Reviews({
            rating: rating,
            comment: comment,
        });
        r1.owner = user;
        let l1 = await Listings.findById(pid);
        l1.reviews.push(r1);
        await r1.save();
        await l1.save();
    } catch (err) {
        res.status(400).send({
            message: "Failed to add review"
        })
    }
    res.status(200).send({
        message: "Review added"
    })
})

app.get('/review/delete/:rid/:pid', async (req, res) => {
    let { rid, pid } = req.params;
    try {

        await Reviews.findByIdAndDelete(rid);
        await Listings.updateOne({ _id: pid }, { $pull: { reviews: rid } });
    } catch (err) {
        res.status(400).send({
            message: "Request Failed"
        })
    }
    res.status(200).send({
        message: "Review Deleted",

    })
})
