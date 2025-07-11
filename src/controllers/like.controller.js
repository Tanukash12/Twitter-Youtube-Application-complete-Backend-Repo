import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"
import {Video } from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id.")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found.");
    }

    const userId = req.user._id;
    
    const like = await Like.findOne({video: videoId, likedBy: userId});

    let message = " ";

    if(like){
        await like.deleteOne();
        message = "Video unliked successfully."
    }else{
        await Like.create({
            video: videoId,
            likedBy: userId
        });
        message = "Video is liked successfully."
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null , message))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id.")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "comment not found.");
    }

    const userId = req.user._id;
    
    const like = await Like.findOne({comment: commentId, likedBy: userId});

    let message = " ";

    if(like){
        await like.deleteOne();
        message = "comment unliked successfully."
    }else{
        await Like.create({
            comment: commentId,
            likedBy: userId
        });
        message = "comment is liked successfully."
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null , message))
    
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Video Id.")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found.");
    }

    const userId = req.user._id;
    
    const like = await Like.findOne({tweet: tweetId, likedBy: userId});

    let message = " ";

    if(like){
        await like.deleteOne();
        message = "Tweet unliked successfully."
    }else{
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        message = "Tweet is liked successfully."
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null , message))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    if (!userId) {
        throw new ApiError(400, " Invalid User Id.");
    }

    const likes = await Like.find({ likedBy: userId, video: {$ne: null}}).populate("video")

    const likedVideos = likes.map(like => like.video)

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos , "Liked Videos fetched successfully."))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}