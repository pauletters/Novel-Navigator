import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
import cors from 'cors';
import { GraphQLFormattedError } from 'graphql';


const startApolloServer = async () => {

  // Create a new ApolloServer instance with the schema definition and resolvers
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError: GraphQLFormattedError) => {
      console.error('GraphQL Error Details:', {
        message: formattedError.message,
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: formattedError.extensions
      });
      return formattedError;
    },
  });

  await server.start();
  console.log('Apollo Server successfully started!'); 

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(
    '/graphql',
    cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    }),
    expressMiddleware(server, {
      context: async ({ req }) => authenticateToken({ req })
    })
  );

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

await db();
console.log('Connected to the database!');

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
});
}

startApolloServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});