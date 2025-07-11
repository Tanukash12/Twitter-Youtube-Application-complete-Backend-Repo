import mongoose, { isValidObjectId, Schema } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const {content } = req.body;
    const owner = req.user?._id;

    if(!content ){
        throw new ApiError(400, "Tweet content is required.")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner
        }
    )

    if(!tweet){
        throw new ApiError(400, "Tweet creation failed")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        tweet,
        "Tweet is created successfully."
    ))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

     if(!userId ){
        throw new ApiError(400, "Invalid User Id.")
    }

    const tweet = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                fullname: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {$first: "$user"}
                }
            },
            {
                $sort: {createdAt: -1}
            }
        ]
    )

    if(!tweet){
        throw new ApiError(404,"Uable to get tweets.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet fetched successfully."
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.param;
    
    if(!content){
        throw new ApiError(400, "Content is required.")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found.")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You cannat edit someone else's Tweet.")
    }
 
    tweet.content = content
    await tweet.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully.")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if(!tweetId){
        throw new ApiError(404, "Invalid tweet Id." )
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found.")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot delete someone else's tweet.");
    }

    await tweet.delete()
    

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet Deleted successfully."))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}