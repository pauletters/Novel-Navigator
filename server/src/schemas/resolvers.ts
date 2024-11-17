import Book from '../models/Book.js';
import User from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface AddUserArgs {
        username: string;
        email: string;
        password: string;
}

interface LoginArgs {
        email: string;
        password: string;
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
        me: async (_parent: any, _args: any, context: any) => {
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
        loginUser: async (_parent: any, { email, password }: LoginArgs) => {
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
        },

        addUser: async (_parent: any, { username, email, password }: AddUserArgs) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },

        saveBook: async (_parent: any, { input }: SaveBookArgs, context: any) => {
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

        removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: any) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                ).populate('savedBooks');

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