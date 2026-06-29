const express = require("express"); 
const router = express.Router({mergeParams : true});
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema , reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");


const validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    };
};

//reviews
router.post(
  "/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success","review created!")
    res.redirect(`/listings/${listing._id}`);
  })
);
 //DELETE REVIEW ROUTE

router.delete(
  "/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);
    req.flash("success","review deleted!");
    res.redirect(`/listings/${id}`);
  })
);


router.all("/*splat" , (req , res , next)=> {
    next(new ExpressError(404, "Page not found!"));
});

module.exports = router;