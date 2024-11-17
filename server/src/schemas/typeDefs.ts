const typeDefs = `
    type Query {
        me: User
        user: [User]
    }
    
    type Mutation {
        loginUser(email: String!, password: String!): Auth
        addUser(username: String!, email: String!, password: String!): Auth
        saveBook(input: SavedBook!): User
        removeBook(bookId: ID!): User
    }
    
    type User {
        _id: ID!
        username: String!
        email: String!
        bookCount: Int
        savedBooks: [Book]
    }
    
    type Book {
        bookId: ID!
        authors: [String]
        description: String
        title: String!
        image: String
        link: String
    }
    
    input SavedBook {
        authors: [String]
        description: String
        title: String!
        bookId: String!
        image: String
        link: String
    }
    
    type Auth {
        token: ID!
        user: User!
    }
    `;

    export default typeDefs;