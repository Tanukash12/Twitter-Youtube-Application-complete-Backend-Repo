import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invaid video Id.")
    }

    const comments = await Comment.find({video: videoId})
        .populate("owner", "username avatar")
        .skip(skip)
        .sort({createdAt: -1})
        .limit(parsedLimit)

    const totalComments = await Comment.countDocuments({video: videoId})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            comments,
            page: parsedPage,
            totalComments,
            totalPages: Math.ceil(totalComments / parsedLimit)
        }, "Comments fetched succcessfully."
    ))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const content = req.body.content
    const {videoId} = req.params
    const userId = req.user._id

    if(!videoId || isValidObjectId(videoId) || !content ){
        throw new ApiError(400, "Invalid Video ID or Content is required.")
    }

    const comment = await Comment.create({
        video: videoId,
        owner: userId,
        content: content
    })

    const populatedComment = await comment.populate("owner", "username avatar");

    return res
    .status(200)
    .json(new ApiResponse(200, populatedComment, "Comment added successfully."))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const content = req.body.content
    const {commentId} = req.params
    const userId = req.user._id

     if (!commentId || !isValidObjectId(commentId) || !content) {
        throw new ApiError(400, "Invalid comment ID or content is missing.");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found.");
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You cannot update someone else's comment.");
    }

    comment.content = content;
    await comment.save();

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully."))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId} = req.params

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(404,"Invalid or missing comment ID.")
    }

    const comment = await Comment.findById(commentId)
    
        if(!comment){
            throw new ApiError(404, "comment not found.")
        }
    
        if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You cannot delete someone else's comment.");
        }
    
        await comment.remove()
        
    return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment is deleted successfully."))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}