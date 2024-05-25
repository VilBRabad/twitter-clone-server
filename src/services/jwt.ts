import { User } from "@prisma/client";
import JWT from "jsonwebtoken"

class JWTService{
    public static generateTokenForUser = (user: User)=>{
        const payload = {
            id: user?.id,
            email: user?.email
        }

        const token = JWT.sign(payload, process.env.JWT_SECRETE || "87shsdkugdt67g");

        return token;
    }
}

export default JWTService;