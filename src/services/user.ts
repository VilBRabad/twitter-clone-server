import axios from "axios";
import { prismaClient } from "../client/db";
import JWTService from "./jwt";

interface googleTokenResult{
    iss?: string;
    azp?: string;
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string;
    nbf?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}


class UserServices{
    public static async verifyGoogleToke(token: string){
        const googleToken = token;
        
        const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo")
        googleOauthURL.searchParams.set('id_token', googleToken);

        const {data} = await axios.get<googleTokenResult>(googleOauthURL.toString(), {
            responseType: 'json',
        })

        if(!data.email || !data.given_name) throw new Error("Invalid google auth request!");

        const user = await prismaClient.user.findUnique({
            where: {email: data.email},
        });

        if(!user){
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageURL: data.picture,
                },
            });
        }
        
        const userInDb = await prismaClient.user.findUnique({where: {email: data.email,},});
        // console.log("User in DB: ", userInDb);

        if(!userInDb) throw new Error("User with email not found!")
        const jwtToken = JWTService.generateTokenForUser(userInDb);

        return jwtToken;
    }

    public static async getUserById(id: string){
        return await prismaClient.user.findUnique({where: {id}})
    }

    public static async followUser(from: string, to: string){
        return await prismaClient.follows.create(
            {
                data: {
                    follower: {connect: {id: from}},
                    following: {connect: {id: to}},
                }
            }
        )
    }

    public static async unFollowUser(from: string, to: string){
        return await prismaClient.follows.delete(
            {
                where: {followerId_followingId: {followerId: from, followingId: to}},
            }
        )
    }
}


export default UserServices;