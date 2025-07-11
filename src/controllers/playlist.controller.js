import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "Both Name and Description are required.")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist created successfully.")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID.")
    }

    const playlist = await Playlist.find({owner: userId})

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully.")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid User ID.")
    }

    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully.")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !isValidObjectId(playlistId) || 
        !videoId || !isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid playlist or video ID.")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found.")
    }

    const alreadyExists = playlist.videos.includes(videoId)
    if(alreadyExists){
        return res
        .status(400)
        .json(new ApiResponse(400, null , "Video already exists."))
    }
    playlist.videos.push(videoId)
    await playlist.save()
        
    return res
        .status(200)
        .json(new ApiResponse(200, playlist , "Video added to playlist successfully."))
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId || !isValidObjectId(playlistId) || 
        !videoId || !isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid playlist or video ID.")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found.")
    }

    const exists = await playlist.videos.some(
        (vid) => vid.toString() === videoId
    )

    if(!exists){
        throw new ApiError(400, "Video do not exists in the playlist."); 
    }

    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    )
    await playlist.save()

    return res
        .status(200)
        .json(new ApiResponse(200, playlist , "Video removed successfully."))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID.")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found.")
    }

    await playlist.remove()

    return res
        .status(200)
        .json(new ApiResponse(200, null , "playlist removed successfully."))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID.")
    }

    if(!name || !description){
        throw new ApiError(400, "Both Name and Description are required.")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        }, {new: true}
    )
    if(!playlist){
        throw new ApiError(404, "Playlist not found.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist , "playlist updated successfully."))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}