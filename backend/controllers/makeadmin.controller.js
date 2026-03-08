import User from "../models/user.model.js";

/**
 * Makes a user admin if the provided code matches the secret in process.env.MAKE_ADMIN_CODE
 * @route POST /makeadmin
 * @body { email: string, code: string }
 */
export const makeAdmin = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }
    if (code !== process.env.MAKE_ADMIN_CODE) {
      return res.status(403).json({ message: "Invalid code." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@thapar.edu")) {
      return res
      .status(400)
      .json({ message: "Email must be a @thapar.edu address." });
    }
    if (normalizedEmail == "stiwari2_be23@thapar.edu" || normalizedEmail == "admin@thapar.edu") {
      return res
        .status(403)
        .json({ message: "Cannot modify this user's admin status." });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with that email." });
    }
    if (user.isAdmin) {
      return res
        .status(409)
        .json({ message: `${user.name} is already an admin.` });
    }
    user.isAdmin = true;
    await user.save();
    return res
      .status(200)
      .json({ message: `${user.name} has been granted admin privileges.` });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error.", error: err.message });
  }
};

/**
 * Removes admin privileges from a user if the provided code matches the secret in process.env.MAKE_ADMIN_CODE
 * @route POST /removeadmin
 * @body { email: string, code: string }
 */
export const removeAdmin = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }
    if (code !== process.env.MAKE_ADMIN_CODE) {
      return res.status(403).json({ message: "Invalid code." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@thapar.edu")) {
      return res
        .status(400)
        .json({ message: "Email must be a @thapar.edu address." });
    }
    if (normalizedEmail == "stiwari2_be23@thapar.edu" || normalizedEmail == "admin@thapar.edu") {
      return res
        .status(403)
        .json({ message: "Cannot modify this user's admin status." });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with that email." });
    }
    if (!user.isAdmin) {
      return res
        .status(409)
        .json({ message: `${user.name} does not have admin privileges.` });
    }
    user.isAdmin = false;
    await user.save();
    return res
      .status(200)
      .json({ message: `Admin privileges revoked from ${user.name}.` });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error.", error: err.message });
  }
};
