import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";

const generateaccesstoekn = async (userId) => {
  try {
    const user = await User.findById(userId);
    const isaccesstoken = await user.isaccesstoken();
    const isrefrehtoken = await user.isrefrehtoken();
    return { isaccesstoken, isrefrehtoken };
  } catch (error) {
    throw new apiError(500, "server error generating token");
  }
};

const createaccount = asynhandler(async (req, res) => {
  const { userName, email, password,role } = req.body;

  if (!userName || !email || !password) {
    throw new apiError(400, "All fields are required");
  }

  const checkemail = await User.findOne({ email });
  if (checkemail) {
    throw new apiError(409, "Email already exists");
  }

 
   const newrole=role ||'user'
  // 4️⃣ Create user
  const user = await User.create({
    userName,
    email,
    password,
    role: newrole,
  });

  if (!user) {
    throw new apiError(500, "Server error");
  }

  // 5️⃣ Response
  res
    .status(201)
    .json(new apiResponse(201, "User created successfully", user));
});


const user_login = asynhandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError("all field are required");
  }

  const checkuser = await User.findOne({ email });

  if (!checkuser) {
    throw new apiError(404, "user not exist");
  }

  const checkpassword = await checkuser.ispasswordcorrect(password);

  if (!checkpassword) {
    throw new apiError(404, "password not match");
  }

  const { isrefrehtoken, isaccesstoken } = await generateaccesstoekn(
    checkuser._id
  );

  console.log("isaccesstoken", isaccesstoken);
  console.log("isrefrehtoken", isrefrehtoken);

  const loginuser = await User.findById(checkuser._id).select("-password");

  const option = {
    httpOnly: true,
    secure: false,
  };

  res
    .status(200)
    .cookie("isaccesstoken", isaccesstoken, option)
    .cookie("isrefrehtoken", isrefrehtoken, option)
    .json(new apiResponse(200, loginuser, "user login successfully"));
});

const logout_user = asynhandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id);

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("isaccesstoken", option)
    .clearCookie("isrefrehtoken", option)
    .json(new apiResponse(200, "logout user successfully"));
});




const users=asynhandler(async (req,res) => {
  
  const user=await User.find().select("-password")

  if (!user || user.length===0) {
    throw new apiError(404, "no user found");
  }

  res.status(200).json(new apiResponse(200,user,"all users"))

})


 const deleteuser=asynhandler(async (req,res) => {
   
  const {id}=req.params;

  const user=await User.findByIdAndDelete(id)

  if (!user) {
    throw new apiError(404,"userId not found")
  }

  
  res.status(200).json(
    new apiResponse(200,"delete successfully")
  )

 





 })
















const currentuser = asynhandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new apiError(404, "user nto found");
  }

  res.status(200).json(new apiResponse(200, { users: user }, "succesfully"));
});












export { createaccount, user_login, logout_user, users,currentuser,deleteuser };
