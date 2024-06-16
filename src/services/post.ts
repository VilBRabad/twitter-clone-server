import { prismaClient } from "../client/db";
import { JWTUser } from "../interfaces";

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

    public static async getPostsOfFollowings(ctxUser: JWTUser){
        const followings = await prismaClient.follows.findMany({
            where: {
                followerId: ctxUser.id,
            },
            select: {
                followingId: true,
            }
        })

        const followingIds = followings.map(el=> el.followingId);
        followingIds.push(ctxUser.id);

        const posts = await prismaClient.post.findMany({
            where: {
                authorId: {
                    in: followingIds,
                }
            },
            include: {
                author: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        return posts;
    }
}

export default PostServices;