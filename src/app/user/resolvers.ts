import axios from "axios";
import { prismaClient } from "../../client/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";

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

const queries = {
    verifyGoogleToken: async(parent: any, {token}:{token:string})=>{
        // console.log("VIIi")
        const googleToken = token;
        // console.log(token);
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
        console.log("User in DB: ", userInDb);

        if(!userInDb) throw new Error("User with email not found!")
        const jwtToken = JWTService.generateTokenForUser(userInDb);

        return jwtToken;
    },

    getCurrentUser: async(parent: any, args: any, ctx: GraphqlContext)=>{
        const ctxUser = await ctx.user;
        // console.log("ctxUser: ", ctxUser);
        const id = ctxUser?.id;
        // console.log(id);
        if(!id) return null;

        // console.log(id);
        const user = await prismaClient.user.findUnique({where: {id}})
        // console.log("User :", user)
        return user;
    }
};

const extraResolver = {
    User: {
        posts: async(parent: User)=> await prismaClient.post.findMany({where: {author: {id: parent.id}}}) 
    }
}

export const resolvers = {queries, extraResolver}