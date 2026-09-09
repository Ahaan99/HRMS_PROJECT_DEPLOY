import jwt from "jsonwebtoken";
import { ENV} from "../config/env.js";


export const signToken = (payload) => {

  const secretKey = ENV.JWT_SECRET;
  const expiresIn = ENV.JWT_EXPIRES_IN;
  return jwt.sign(payload, secretKey, {
    expiresIn: expiresIn,
  });
};

export const verifyToken = (token) => jwt.verify(token, ENV.JWT_SECRET);
