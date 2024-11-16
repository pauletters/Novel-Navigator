import Book from '../models/Book.js';
import User from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string;
    }
}

interface LoginArgs {
    input: {
        email: string;
        password: string;
    }
}

interface SaveBookArgs {
    input: {
        authors: string[];
        description: string;
        bookId: string;
        image: string;
        link: string;
        title: string;
    }
}

interface RemoveBookArgs {
    bookId: string;
}

 const resolvers = {
    Query: {
        user: async () => {
            return User.find().populate('savedBooks');
        },
        me: async (_: any, context: any) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
    },
    Mutation: {
        login: async (_: any, { input }: LoginArgs) => {
            const user = await User.findOne({ email: input.email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(input.password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },

        addUser: async (_: any, { input }: AddUserArgs) => {
            const user = await User.create(input);
            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },

        saveBook: async (_: any, { input }: SaveBookArgs, context: any) => {
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

        removeBook: async (_: any, { bookId }: RemoveBookArgs, context: any) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );

                if (!updatedUser) {
                    throw new AuthenticationError('Couldn\'t find user with this id!');
                }

                await Book.findOneAndUpdate(
                    { bookId },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
};

export default resolvers;