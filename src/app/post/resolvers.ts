import { Post } from "@prisma/client";
// import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserServices from "../../services/user";
import PostServices, { CreatePostPayload } from "../../services/post";


const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION
});


const queries = {
    getAllPosts: async()=> await PostServices.getAllPosts(),

    getPreSignedURLForPost: async(parent: any, {imageType}:{imageType: string}, ctx:GraphqlContext)=>{
        const user = await ctx.user;
        if(!user || !user.id) throw new Error("Un-authenticated!");

        const allowedImageType = [
            "image/jpg", 
            "image/jpeg", 
            "image/png", 
            "image/webp"
        ];
        if(!allowedImageType.includes(imageType)) throw new Error("Un-supported image type!");

        const putObjectCommand = new PutObjectCommand(
            {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `upload/${user.id}/posts/${Date.now().toString()}.${imageType.split("/")[1]}`,
            }
        );

        const signedURL = await getSignedUrl(s3Client, putObjectCommand);

        return signedURL;
    }
}


const mutations = {
    createPost: async(parent:any, {payload}:{payload: CreatePostPayload}, ctx:GraphqlContext)=>{
        const ctxUser = await ctx.user;
        if(!ctxUser) throw new Error("You are not logged in!!");
        console.log(ctxUser);
        const post = await PostServices.createPost({
            ...payload,
            userId: ctxUser.id
        });

        return post
    },

};

const extraResolver = {
    Post: {
        author: async(parent:Post)=> 
            await UserServices.getUserById(parent.authorId),
    }
};

export const resolvers = {mutations, extraResolver, queries};