import mongoose from 'mongoose'

const connectDB = async (uri  = 'mongodb+srv://nvhoan11092003:Hoan1109@cluster0.yvldvoj.mongodb.net/') => {
    try {
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;