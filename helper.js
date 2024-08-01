const bcrypt = require('bcrypt');

module.exports.encryptPass = async (pass) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const encrypted = await bcrypt.hash(pass, salt);
        return encrypted;
    } catch (error) {
        console.error('Error encrypting password:', error);
        throw error;
    }
}