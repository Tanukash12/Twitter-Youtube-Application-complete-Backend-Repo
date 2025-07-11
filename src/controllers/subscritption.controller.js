import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(404,"Channel not found.")
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }

    if(channel._id.toString() === req.user._id.toString()){
        throw new ApiError(400, "You cannot subscribe yourself.")
    }

    const existing = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(existing){
        await existing.deleteOne();
        return res
        .status(200)
        .json(new ApiResponse(200, "", "Unsubscribed the Channel successfully."))
    }else{
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res
        .status(200)
        .json(new ApiResponse(200, null, "Subscribed to the Channel successfully."))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(404,"Channel not found.")
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "Channel not found.");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
            channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
            _id: 0,
            subscriber: "$subscriberDetails._id",
            username: "$subscriberDetails.username",
            avatar: "$subscriberDetails.avatar",
            fullname: "$subscriberDetails.fullname"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully."))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(404,"Channel not found.")
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "Channel not found.");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
            subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "subscribedDetails"
            }
        },
        {
            $unwind: "$subscribedDetails"
        },
        {
            $project: {
            _id: 0,
            channel: "$subscribedDetails._id",
            username: "$subscribedDetails.username",
            avatar: "$subscribedDetails.avatar",
            fullname: "$subscribedDetails.fullname"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed Channels fetched successfully."))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

