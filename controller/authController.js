import SignupCollection from "../model/model.js";
import { Admin } from "../model/adminModel.js";
import jwt from 'jsonwebtoken';//handle json webtoken
import dotenv from 'dotenv'//handle env file

dotenv.config();//load env file

    
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h' // Token will expire in 1 hour,
    });
}

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await SignupCollection.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" })
        
        user = new SignupCollection({name,email,password})
        await user.save()

        res.status(201).json({_id: user._id, name: user.name, email: user.email, token: generateToken(user._id)})
    }
    catch (err) {
        res.status(500).json({ err:err.message })
    }

}

export const loginUser = async (req, res) => {
    const { email, password } = req.body

    try {
        // First check if it's an admin login
        let admin = await Admin.findOne({ email });
        if (admin) {
            // Check admin password using the comparePassword method from admin model
            const isValidPassword = await admin.comparePassword(password);
            
            if (!isValidPassword) {
                return res.status(400).json({ success: false, message: "Invalid credentials" });
            }

            // Update last login
            admin.lastLogin = new Date();
            await admin.save();

            return res.status(200).json({ 
                success: true,
                _id: admin._id, 
                name: admin.name, 
                email: admin.email, 
                role: "admin", 
                token: generateToken(admin._id),
                user: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: "admin"
                }
            });
        }

        // If not admin, check regular user
        let user = await SignupCollection.findOne({ email })
        if (!user) return res.status(400).json({ success: false, message: "User does not exist" })

        let userMatch = await user.matchPassword(password)

        if (!userMatch) return res.status(400).json({ success: false, message: "Invalid credentials" })


        res.status(200).json({ 
            success: true,
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await SignupCollection.find({}, 'name email role createdAt').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            users,
            count: users.length
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
}