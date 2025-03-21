const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/auth.config");
const { Mongoose } = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const admin = require('../models/admin.model');
// const user = require("../models/userSignUp.model")
const user = require("../models/user.model");
const mechanic = require("../models/mechanic.model");
// const service = require("../models/service.model");
const service = require('../models/service.model');

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

function generateToken(userid) {
    return jwt.sign({ id: userid }, config.secret, { expiresIn: 15552000 });
}

exports.createAdmin = async (req, res) => {
    try {
        const { admin_Name, admin_Email,  password } = req.body;

        // Validating email, full name, mobile number, password, and confirm password
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        // const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s)/;

        if (!admin_Email) {
            return res.status(400).send({ message: "Email is required", status: 400 });
        } else if (!admin_Email.match(emailRegex)) {
            return res.status(400).send({ message: "Please provide a valid Email address", status: 400 });
        }

        if (!admin_Name) {
            return res.status(400).send({ message: "admin  name is required", status: 400 });
        } 

        

        if (!password) {
            return res.status(400).send({ message: "Password is required", status: 400 });
        } 

        

        const checkEmail = await admin.findOne({ admin_Email }).lean();
        if (checkEmail) {
            return res.status(409).send({ message: 'Email already exists', status: 409 });
        }


        const data = await admin.create({
            admin_Name:admin_Name,
            admin_Email: admin_Email.toLowerCase(),
            password: bcrypt.hashSync(password,)
        });

        return res.status(200).send({ data, message: "Congratulations! Your account has been created successfully!", status: 200 });

    } catch (error) {
        return res.status(500).send({ message: error.message || 'Some error occurred while creating an account', status: 500 });
    }
};



//admin login
exports.adminLogin = (req, res) => {
    // Request validation
    if (!req.body || !req.body.admin_Email || !req.body.password) {
        return res.status(400).send({message: 'Please provide both admin email and password.',status: 400});
    }

    const admin_Email = req.body.admin_Email.toLowerCase();

    // Check, get, and verify login data from the database
    admin.findOne({ "admin_Email": admin_Email, deleteFlag: false })
        .then(foundAdmin => {
            if (!foundAdmin) {
                return res.status(404).send({ message: 'Email does not exist.', status: 404 });
            }

            console.log(foundAdmin)

            const passwordIsValid = bcrypt.compareSync(req.body.password, foundAdmin.password);
            if (!passwordIsValid) {
                return res.status(401).send({message: "Invalid password!.",status: 401});
            }

            const token = generateToken(foundAdmin._id);
            return res.status(200).send({ accessToken: token, data: foundAdmin, status: 200 });
        })
        .catch(err => {
            res.status(500).send({ message: 'Internal server error.', status: 500 });
        });
};


exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users except those marked as deleted
        const users = await user.find({ deleteFlag: false }).select('-password'); // Exclude the password field
        const totalCount = await user.countDocuments({ deleteFlag: false }); // Count the total users

        return res.status(200).send({ 
            data: users, 
            totalCount, // Include the total count
            message: "Users fetched successfully", 
            status: 200 
        });
    } catch (error) {
        return res.status(500).send({ 
            message: error.message || 'An error occurred while fetching users', 
            status: 500 
        });
    }
};


// Edit user data by admin
exports.editUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { user_Name, user_Email, country_code, mobile_no } = req.body;

        // Validate request data
        if (!user_Name || !user_Email || !country_code || !mobile_no) {
            return res.status(400).send({ message: 'All fields are required', status: 400 });
        }

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!user_Email.match(emailRegex)) {
            return res.status(400).send({ message: 'Please provide a valid email address', status: 400 });
        }

        const existingUser = await user.findOne({ _id: userId }).lean();
        if (!existingUser) {
            return res.status(404).send({ message: 'User not found', status: 404 });
        }

        const updatedUser = await user.findOneAndUpdate(
            { _id: userId },
            { $set: { user_Name, user_Email, country_code, mobile_no } },
            { new: true }
        );

        return res.status(200).send({ data: updatedUser, message: 'User updated successfully', status: 200 });
    } catch (error) {
        return res.status(500).send({ message: error.message || 'Error updating user', status: 500 });
    }
};

// Delete user by admin
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const existingUser = await user.findOne({ _id: userId }).lean();
        if (!existingUser) {
            return res.status(404).send({ message: 'User not found', status: 404 });
        }

        await user.findOneAndUpdate(
            { _id: userId },
            { $set: { deleteFlag: true } }
        );

        return res.status(200).send({ message: 'User deleted successfully', status: 200 });
    } catch (error) {
        return res.status(500).send({ message: error.message || 'Error deleting user', status: 500 });
    }
};


// to get mechanics list
exports.getAllMechanics = async (req, res) => {
    try {
        // Fetch all mechanics except those marked as deleted
        const mechanics = await mechanic.find({ deleteFlag: false }).select('-password'); // Exclude the password field
        const totalCount = await mechanic.countDocuments({ deleteFlag: false }); // Count the total mechanics

        return res.status(200).send({ 
            data: mechanics, 
            totalCount, // Include the total count
            message: "Mechnaics fetched successfully", 
            status: 200 
        });
    } catch (error) {
        return res.status(500).send({ 
            message: error.message || 'An error occurred while fetching mechanics', 
            status: 500 
        });
    }
};


// to get Services list
exports.getAllServices = async (req, res) => {
    try {
        // Fetch all services except those marked as deleted
        const services = await service.find({ deleteFlag: false }).select('-password'); // Exclude the password field
        const totalCount = await service.countDocuments({ deleteFlag: false }); // Count the total services

        return res.status(200).send({ 
            data: services, 
            totalCount, // Include the total count
            message: "Services fetched successfully", 
            status: 200 
        });
    } catch (error) {
        return res.status(500).send({ 
            message: error.message || 'An error occurred while fetching Services', 
            status: 500 
        });
    }
};



exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { service_name } = req.body; // Removed role from request body

        if (!service_name) {
            return res.status(400).json({ message: "Service name is required", status: 400 });
        }

        const updatedService = await service.findByIdAndUpdate(
            serviceId, 
            { service_name }, 
            { new: true }
        );

        if (!updatedService) {
            return res.status(404).json({ message: "Service not found", status: 404 });
        }

        return res.status(200).json({ message: "Service updated successfully", data: updatedService, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 });
    }
};


exports.deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Rename `service` to `deletedService`
        const deletedService = await service.findByIdAndUpdate(
            serviceId, 
            { deleteFlag: true }, 
            { new: true }
        );

        if (!deletedService) {
            return res.status(404).json({ message: "Service not found", status: 404 });
        }

        return res.status(200).json({ message: "Service deleted successfully", status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 });
    }
};


// exports.updateMechanic = async (req, res) => {
//     try {
//         const { serviceId } = req.params;
//         const { service_name } = req.body; // Removed role from request body

//         if (!service_name) {
//             return res.status(400).json({ message: "Service name is required", status: 400 });
//         }

//         const updatedService = await Service.findByIdAndUpdate(
//             serviceId, 
//             { service_name }, 
//             { new: true }
//         );

//         if (!updatedService) {
//             return res.status(404).json({ message: "Service not found", status: 404 });
//         }

//         return res.status(200).json({ message: "Service updated successfully", data: updatedService, status: 200 });
//     } catch (error) {
//         return res.status(500).json({ message: error.message, status: 500 });
//     }
// };


// exports.deleteMechanic = async (req, res) => {
//     try {
//         const { serviceId } = req.params;

//         // Rename `service` to `deletedService`
//         const deletedService = await service.findByIdAndUpdate(
//             serviceId, 
//             { deleteFlag: true }, 
//             { new: true }
//         );

//         if (!deletedService) {
//             return res.status(404).json({ message: "Service not found", status: 404 });
//         }

//         return res.status(200).json({ message: "Service deleted successfully", status: 200 });
//     } catch (error) {
//         return res.status(500).json({ message: error.message, status: 500 });
//     }
// };


// Edit mechanic data by admin
exports.updateMechanic = async (req, res) => {
    try {
        const mechanicId = req.params.mechanicId;
        const { user_Name, user_Email, country_code, mobile_no } = req.body;

        // Validate request data
        if (!user_Name || !user_Email || !country_code || !mobile_no) {
            return res.status(400).send({ message: 'All fields are required', status: 400 });
        }

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!user_Email.match(emailRegex)) {
            return res.status(400).send({ message: 'Please provide a valid email address', status: 400 });
        }

        const existingMechanic = await mechanic.findOne({ _id: mechanicId }).lean();
        if (!existingMechanic) {
            return res.status(404).send({ message: 'Mechanic not found', status: 404 });
        }

        const updatedMechanic = await mechanic.findOneAndUpdate(
            { _id: mechanicId },
            { $set: { user_Name, user_Email, country_code, mobile_no } },
            { new: true }
        );

        return res.status(200).send({ data: updatedMechanic, message: 'Mechanic updated successfully', status: 200 });
    } catch (error) {
        return res.status(500).send({ message: error.message || 'Error updating mechanic', status: 500 });
    }
};

// Delete mechanic by admin
exports.deleteMechanic = async (req, res) => {
    try {
        const mechanicId = req.params.mechanicId;

        const existingMechanic = await mechanic.findOne({ _id: mechanicId }).lean();
        if (!existingMechanic) {
            return res.status(404).send({ message: 'Mechanic not found', status: 404 });
        }

        await mechanic.findOneAndUpdate(
            { _id: mechanicId },
            { $set: { deleteFlag: true } }
        );

        return res.status(200).send({ message: 'Mechanic deleted successfully', status: 200 });
    } catch (error) {
        return res.status(500).send({ message: error.message || 'Error deleting mechanic', status: 500 });
    }
};


