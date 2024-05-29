export const types = `#graphql

    input CreatePostData{
        content: String!
        imageURL: String
    }

    type Post{
        id: ID!
        content: String!
        imageURL: String

        author: User
    }
`