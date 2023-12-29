import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res)=>{

    const {username, email, fullName, password} = req.body
    console.log(username, email, password)

    if(
        [username, email, fullName, password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required.")
    }

    const existingUser = User.findOne({
        $or: [{username},{email}]
    })
    if(existingUser){
        throw new ApiError(409, "Username or email already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Profile picture required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Something went wrong while uploading image.")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Created Sucessfully!")
    )
    
})

export {registerUser}