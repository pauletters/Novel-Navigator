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
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const startApolloServer = async () => {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  // Create a new ApolloServer instance with the schema definition and resolvers
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError: GraphQLFormattedError) => {
      console.error('GraphQL Error Details:', formattedError);
      return formattedError;
    },
  });

  // Start the server
  await server.start();
  console.log('Apollo Server started successfully');

// Apply the ApolloServer instance as middleware to the Express server
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(
    '/graphql',
    cors({
      origin: ['http://localhost:3000', 
        'http://localhost:5173', 
        'https://novel-navigator.onrender.com'],
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

try {
  await db();
  console.log('Connected to MongoDB!');


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready on port ${PORT}`);
  console.log(`🚀 GraphQL ready at http://0.0.0.0:${PORT}/graphql`);
});
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}
};

startApolloServer();