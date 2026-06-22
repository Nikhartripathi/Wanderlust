const express = require("express"); 
const app = express(); 
const mongoose = require("mongoose"); 
const Listing = require("./models/listing.js");
const path = require("path");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema , reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

main()
.then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine",'ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded ({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/",(req,res) => {
    res.send("hii , im root");
})

const validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    };
};

const validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    };
};
// app.get("/testListing", async(req,res) => {
//     let sampleListing = new Listing ({
//         title: "my new villa",
//         description :"by the beach",
//         price : 1200,
//         location : "calangute ,Goa",
//         country : "India"
//     });

//     await  sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful");
// });

//INDEX ROUTE
app.get("/listings", async (req, res) => {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs",{allListings});
});

//NEW ROUTE
app.get("/listings/new" ,(req,res)=> {
    res.render("listings/new.ejs");
} );

//SHOW ROUTE
app.get("/listings/:id", wrapAsync(async (req, res) => {
let {id} = req.params; 
const listing = await Listing.findById(id).populate("reviews");
res.render("listings/show.ejs",{listing});
}));

//CREATE ROUTE
app.post("/listings", validateListing, wrapAsync(async(req,res,next) => {
    
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings"); 
 })
);

//EDIT ROUTE
app.get("/listings/:id/edit", wrapAsync(async(req , res) => {
let {id} = req.params; 
const listing = await Listing.findById(id);
res.render("listings/edit.ejs", { listing });
}));

//UPDATE ROUTE
app.put("/listings/:id", validateListing, wrapAsync(async(req , res) => {
let {id} = req.params; 
await Listing.findByIdAndUpdate(id,{...req.body.listing });
res.redirect(`/listings/${id}`);
}));

//DELETE ROUTE
app.delete("/listings/:id", wrapAsync(async (req , res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));


//reviews
app.post("/listings/:id/reviews", validateReview, wrapAsync ,  (async(req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);

 }));

 //DELETE REVIEW ROUTE
app.delete("/listings/:id/reviews/:reviewId",
    wrapAsync(async (req , res)=>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id ,{$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
  })
);


app.all("/*splat" , (req , res , next)=> {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message = "something went wrong"} = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send (message);
});



app.listen(3000, () => {
    console.log("server is listening to port 3000");
});
