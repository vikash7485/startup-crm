import mongoose from 'mongoose';
const connectDB = async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log('Database connection failed:');
        console.error(error.message);
        console.log('\n======================================================');
        console.log(' ACTION REQUIRED: Your IP Address is blocked by MongoDB!');
        console.log('Please go to cloud.mongodb.com -> Network Access -> Add IP Address (0.0.0.0/0)');
        console.log('======================================================\n');
        // Removed process.exit(1) so the server stays up and shows this error.
    }
};
export default connectDB;