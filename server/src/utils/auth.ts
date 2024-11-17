import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();

interface JwtPayload {
  username: string;
  email: string;
  _id: string;
}

export const authenticateToken = async ({ req }: {req: any}) => {
  
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req;
  }

  try {
    const { data }: any = jwt.verify(token, process.env.JWT_SECRET_KEY! as string) as JwtPayload;
    req.user = data;
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }

  return req;
};

export const signToken = (username: string, email: string, _id: unknown): string => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  if (!secretKey) {
    throw new Error('JWT_SECRET_KEY not configured');
}

  return jwt.sign({ data: payload }, secretKey, { expiresIn: '1h' });
};

export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { 
        code: 'UNAUTHENTICATED',
        http: { status: 401 }
      }
});
  }
}

