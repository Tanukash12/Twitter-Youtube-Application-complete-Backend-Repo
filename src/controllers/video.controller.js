import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {Video} from "../models/video.models.js"
import mongoose, {isValidObjectId} from "mongoose"

const getAllVideos = asyncHandler(async(req, res) => {
    // everytime sari videos nahi -> page and limit
    const { page = 1, limit = 10, query, sortBy, sortType, userId} = req.query
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // search
    const filter = {}
    if(query){
        filter.$or = [
            {title: { $regex: query, $options: "i" }}, 
            {description: { $regex: query, $options: "i" }}
        ]
    }

    if (userId && isValidObjectId(userId)) {
        filter.userId = userId;
    }

    const sort = {}
    if(sortBy){
        sort[sortBy] = sortType === 'asc' ?  1 : -1 
    }else{
        sort.createdAt = -1;
    }

    const skip = (page - 1)*limit

    const videos = await Video.find(filter)
                        .skip(skip)
                        .sort(sort)
                        .limit(limit)
                        .populate("userId", "username avatar")

    const totalVideos = await Video.countDocuments(filter)

    return res
    .status(200)
    .json(new ApiResponse(200, {
        videos,
        page,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limit)
    }, "Videos fetched successfully."))

})

const publishVideos = asyncHandler(async(req, res) => {
    const {title, description} = req.body
    const videoLocalPath = req.file?.path 

    if(!videoLocalPath){
        throw new ApiError(404, "video not found.")
    }

    const video = await uploadOnCloudinary(videoLocalPath)

    if(!video.url){
        throw new ApiError(400, "Error while uploading a video.");
    }

    const publishedVideo = await Video.create(
        {
            title,
            description,
            videoFile: video.url,
            owner: req.user._id
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, publishedVideo, "Video is published successfully.")
    )
})

const getVideoById =  asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404, "No video found.")
    }

    const video = Video.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            }
        ]
    )

    if(!video || !video?.length){
        throw new ApiError(404, "Video Not Found.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully,"))
})

const updateVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {title, description} = req.body

    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(400,"Video not found")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video details updated successfully."))
})

const deletVideo = asyncHandler(async(req, res) => {
    const { videoId} = req.params

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid or missing video ID.")
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Video is deleted successfully."))

})

const togglePublishStatus = asyncHandler(async(req, res) => {
    
})

export {
    getAllVideos,
    publishVideos,
    getVideoById,
    updateVideo,
    deletVideo
}