const adminAuth = async (req, res, next) => {
  const user = req.body.user;

  if (user.role !== "admin")
    return res.status(401).json({ message: "Not authorized" });
  next();
};

module.exports = adminAuth;
