import { Post } from "@prisma/client";
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";

interface CreatePostPayload{
    content: string;
    imageURL: string;
}

const queries = {
    getAllPosts: async()=> await prismaClient.post.findMany({orderBy: {createdAt: "desc"}})
}


const mutations = {
    createPost: async(parent:any, {payload}:{payload: CreatePostPayload}, ctx:GraphqlContext)=>{
        const ctxUser = await ctx.user;
        if(!ctxUser) throw new Error("You are not logged in!!");
        console.log(ctxUser);
        const post = await prismaClient.post.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: {connect: {id: ctxUser.id}},
            }
        });

        return post
    },

};

const extraResolver = {
    Post: {
        author: async(parent:Post)=> await prismaClient.user.findUnique({where: {id: parent.authorId}})
    }
};

export const resolvers = {mutations, extraResolver, queries};