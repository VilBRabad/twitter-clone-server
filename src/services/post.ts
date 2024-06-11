import { prismaClient } from "../client/db";

export interface CreatePostPayload{
    content: string;
    imageURL: string;
    userId: string;
}

class PostServices{
    public static async createPost(data: CreatePostPayload){
        return await prismaClient.post.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: {connect: {id: data.userId}},
            }
        });
    };

    public static async getAllPosts(){
        // console.log("###############Checkpoint 1");
        const resutl =  await prismaClient.post.findMany({orderBy: {createdAt: "desc"}});
        // console.log(resutl);
        return resutl;
    };
}

export default PostServices;