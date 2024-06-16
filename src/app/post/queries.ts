export const queries = `#graphql
    getAllPosts: [Post]
    getPreSignedURLForPost(imageType: String!): String
    getPostsOfFollowings: [Post]
`