import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"

// access token & refresh token
    const generateAccessAndRefreshTokens = async(userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({validateBeforeSave: false})

            return {accessToken, refreshToken}

        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating refresh and access token.");
            
        }
    }

const registerUser = asyncHandler(async (req, res) => {
    // user details from frontend 
    // validation -> not empty
    // check if user already exist -> email and username unique
    // check for images, check for avtar
    // upload them to cloudinary, avtar
    // create user object - noSql db therefore object and create entry in db (.db)
    // remove password and refreshToken field from response
    // check for user creation
    // return response or else error.

    // 1.
    const {fullname, email, username, password} = req.body
    // console.log("email: " , email );
    
    // 2.
    if(
        [fullname, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All Fields are required.")
    }

    // 3.
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    console.log(req.files);
    

    if(existedUser){
        throw new ApiError(409, "user with email or username already exist.")
    }

    // 4. 
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if(req.files?.coverImage?.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // 5.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    let coverImage = { url: "" };
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // 6.
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id)
                            .select("-password -refreshToken")

    // 7.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    // 8.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> details 
    // email/username with pass, validate
    // find the user
    // pass check
    // access and refresh token
    // send cookie 
    // respone return -> if data matches logged in else error

    const {email, password, username } = req.body 

    if(!(username || email)){
        throw new ApiError(400, "Username or email required");
        
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if (!user) {
        throw new ApiError(404, "No user found!")
    }

    // user password check "user" s not "User" -> as User mongo k h user hmara wala user h
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials.");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(-password -refreshToken)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully."
        )
    )
})

const logOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export {
    registerUser,
    loginUser,
    logOutUser
}