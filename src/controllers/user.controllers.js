import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Registration logic will go here
  // get user data from req.body
  // validate user data
  // check if user already exists
  // create new user
  // remove password ,refreshToken from user object before sending response
  // check user created successfully or not
  // return success response

  // for testing req.body
  // console.log('Request body: ', req.body);

  const { userName, email, fullName, password } = req.body;
  console.log('email: ', email);
  console.log('password: ', password);

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const ExistingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (ExistingUser) {
    throw new ApiError(409, 'User already exists');
  }

  // for testing req.files
  // console.log("req.files: ", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if(!avatarLocalPath ){
    throw new ApiError(400,"Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage= coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
  if(!avatar){
    throw new ApiError(500,"Failed to upload avatar");
  }

  const user = await User.create({
    userName: userName,
    email,
    fullName,
    avatar: avatar.secure_url,
    coverImage: coverImage ? coverImage.secure_url : "",
    password,
  })

  const createdUser=await User.findById(user._id).select("-password -refreshToken");

  if(!createdUser){
    throw new ApiError(500,"Failed to create user");
  }

  res.status(201).json(new ApiResponse(201, createdUser,"User registered successfully"));
});

export { registerUser };
