const Class = require('../models/Class');

exports.verifyClassTeacher = async (req, res, next) => {
  if (req.user.role !== 'teacher') return next();
  
  const myClass = await Class.findOne({ 
    classTeacher: req.user._id 
  });

  if (!myClass) {
    return res.status(403).json({
      message: 'You are not assigned as class teacher'
    });
  }
  
  req.classId = myClass._id;
  next();
};