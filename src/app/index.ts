import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { User } from "./user";
import { Post } from "./post";
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/jwt";

export async function initServer() {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.get("/", (req, res) =>
    res.status(200).json({ message: "Everything is good" })
  );

  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
       ${User.types}
       ${Post.types}

        type Query {
            ${User.queries}
            ${Post.queries}
        }

        type Mutation {
          ${Post.mutations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Post.resolvers.queries,
      },
      Mutation: {
        ...Post.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Post.resolvers.extraResolver,
      ...User.resolvers.extraResolver,
    },
  });

  await graphqlServer.start();

  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req }) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if(!token) return "";
        // console.log(token);
        return {
          user: JWTService.decodeToken(token)
        };
      },
    })
  );

  return app;
}