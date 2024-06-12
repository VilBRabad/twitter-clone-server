import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserServices from "../../services/user";
import { redisClient } from "../../client/redis";



const queries = {
    verifyGoogleToken: async(parent: any, {token}:{token:string})=>{
        const jwtToken = await UserServices.verifyGoogleToke(token);
        return jwtToken;
    },

    getCurrentUser: async(parent: any, args: any, ctx: GraphqlContext)=>{
        // console.log(ctx.user);
        const ctxUser = await ctx.user;
        const id = ctxUser?.id;

        if(!id) return null;

        const user = await UserServices.getUserById(id);
        return user;
    },

    getUserById: async(parent:any, {id}:{id: string}, ctx:GraphqlContext)=> 
        await UserServices.getUserById(id),
};

const extraResolver = {
    User: {
        posts: async(parent: User)=>{
            return await prismaClient.post.findMany({where: {author: {id: parent.id}}});
        },

        follower: async(parent: User)=>{
            const result = await prismaClient.follows.findMany({
                where: {following: {id: parent.id}},
                include: {
                    follower: true,
                }
            })

            return result.map(el=> el.follower);
        },

        following: async(parent: User)=>{
            const result = await prismaClient.follows.findMany({
                where: {follower: {id: parent.id}},
                include: {
                    following: true,
                }
            })

            return result.map(el=> el.following);
        },

        recomendUser: async(parent: User, _:any, ctx:GraphqlContext)=>{
            // console.log(ctx.user);
            const ctxUser = await ctx.user;

            // console.log(ctxUser);
            if(!ctxUser) return [];

            const cacheData = await redisClient.get(`RECOMMENDED_USER:${ctxUser.id}`);
            if(cacheData) {
                console.log("CACHED DATA");
                return JSON.parse(cacheData);
            }

            const myFollowingUser = await prismaClient.follows.findMany({
                where: {
                    follower: {id: ctxUser.id},
                },
                include: {
                    following: {
                        include: {follower: {include: {following: true}}},
                    },
                },
            });

            // console.log(myFollowingUser);
            const user: User[] = [];

            for(const followings of myFollowingUser){
                for(const followingOfFollowedUser of followings.following.follower){
                    if(followingOfFollowedUser.following.id !== ctxUser.id 
                        && myFollowingUser.findIndex((e)=> e.followingId === followingOfFollowedUser.following.id)<0){
                        user.push(followingOfFollowedUser.following);
                    }
                }
            }

            await redisClient.set(`RECOMMENDED_USER:${ctxUser.id}`, JSON.stringify(user));
            return user;
        }

    }
}

    
const mutations = {
    followUser: async(parent: any, {to}:{to: string}, ctx: GraphqlContext)=>{
        const ctxUser = await ctx.user;
        console.log("checkpoint 1")
        if(!ctxUser) throw new Error("Un-authenticated!");
        console.log("checkpoint 2")

        console.log(ctxUser.id, to);

        await UserServices.followUser(ctxUser.id, to);
        await redisClient.del(`RECOMMENDED_USER:${ctxUser.id}`);
        return true;
    },
    unFollowUser: async(parent: any, {to}:{to:string}, ctx: GraphqlContext)=>{
        const ctxUser = await ctx.user;
        if(!ctxUser) throw new Error("Un-authenticated!");
        
        await UserServices.unFollowUser(ctxUser.id, to);
        await redisClient.del(`RECOMMENDED_USER:${ctxUser.id}`);
        return true;
    }
}


export const resolvers = {queries, extraResolver, mutations}