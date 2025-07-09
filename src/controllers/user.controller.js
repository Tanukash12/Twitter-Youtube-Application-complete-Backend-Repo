import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    console.log("email: " , email );
    
    // 2.
    if(
        [fullname, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All Fields are required.")
    }

    // 3.
    const existedUser = User.findOne({
        $or: [{email}, {username}]
    })
    console.log(existedUser);
    

    if(existedUser){
        throw new ApiError(409, "user with email or username alrady exist.")
    }

    // 4. 
    const avatartLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatartLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // 5.
    const avatar = await uploadOnCloudinary(avatartLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // 6.
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = User.findById(user._id)
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

export {
    registerUser
}