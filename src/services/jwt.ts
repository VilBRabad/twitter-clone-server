import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";

const JWT_SECRET = "$uper@1234.";

class JWTService {
  public static generateTokenForUser(user: User) {
    console.log("User While Encoding: ", user);

    const payload: JWTUser = {
      id: user?.id,
      email: user?.email,
    };
    const token = jwt.sign(payload, JWT_SECRET);
    console.log(token);
    return token;
  }

  public static async decodeToken(token: string) {
    try {
      // console.log("Token: ", token); // Log the token to ensure it's correct
      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log("Decoded: ", decoded);
      return decoded;
    } catch (error) {
      console.error("Error in decoding:", error); // Log the exact error message
      return null;
    }
  }
}

export default JWTService;