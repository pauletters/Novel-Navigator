import type { UserDocument, BookDocument } from '../models/index.js';
import User from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { GraphQLError } from 'graphql';


interface AddUserArgs {
        username: string;
        email: string;
        password: string;
}

interface LoginArgs {
        email: string;
        password: string;
}

interface SaveBookArgs extends BookDocument{}

interface RemoveBookArgs {
    bookId: string;
}

interface Context {
    user?: {
        _id: string;
        username: string;
        email: string;
    };
}

class UserInputError extends GraphQLError {
    constructor(message: string) {
      super(message, {
        extensions: {
          code: 'BAD_USER_INPUT',
        },
      });
    }
  }

 const resolvers = {
    Query: {
        me: async (_parent: unknown, _args: unknown, context: Context): Promise<UserDocument | null> => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
    },
    Mutation: {
        loginUser: async (_parent: unknown, { email, password }: LoginArgs) => {
            try{
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        } catch (err) {
            if (err instanceof AuthenticationError) {
                throw err;
            }
            console.error('Error logging in user:', err);
            throw new GraphQLError('Error logging in user', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
        },

        addUser: async (_parent: unknown, { username, email, password }: AddUserArgs) => {
            try {
                const existingUser = await User.findOne({
                    $or: [{ username }, { email }],
                });

                if (existingUser) {
                    if (existingUser.email === email) {
                    throw new UserInputError(
                           'This email is already in use'); 
                    }
                     throw new UserInputError('This username is already taken');
                    }

            const user = await User.create({ username, email, password });
            
            if (!user) {
                throw new GraphQLError('Failed to create user');
            }

            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        } catch (err) {
            console.error('Add user error:', err);

            if (err instanceof UserInputError || err instanceof GraphQLError) {
                throw err;
            }
            
            throw new GraphQLError('Error creating user', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
    },

        saveBook: async (_parent: unknown, { input }: { input: SaveBookArgs }, context: Context):
        Promise<UserDocument | null> => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: input } },
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        removeBook: async (_parent: unknown, { bookId }: RemoveBookArgs, context: Context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );

                if (!updatedUser) {
                    throw new AuthenticationError('Couldn\'t find user with this id!');
                }

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
};

export default resolvers;