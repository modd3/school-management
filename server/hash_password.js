// hash_password.js
const bcrypt = require('bcryptjs'); // Make sure you have bcryptjs installed: npm install bcryptjs

const passwordToHash = 'xnaridom'; // <-- CHANGE THIS to your desired admin password!

async function hashAndLogPassword() {
    try {
        const salt = await bcrypt.genSalt(10); // Use the same salt rounds as in your User model
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);
        console.log('Original Password:', passwordToHash);
        console.log('Hashed Password:', hashedPassword);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

hashAndLogPassword();
