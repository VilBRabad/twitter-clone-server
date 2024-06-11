export const types = `#graphql
    type User{
        id: ID!
        firstName: String!
        lastName: String
        email: String!
        profileImageURL: String

        recomendUser: [User]

        follower: [User]
        following: [User]

        posts: [Post]
    }
`