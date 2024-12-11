const jwt = require("jsonwebtoken");

/**
 * Generate access token
 * @param {object} payload - The payload
 * @param {string} expiration - The expiration
 * @param {string} secret - The secret
 * @returns {string} - The access token
 */
const generateAccessToken = (payload, expiration, secret) => {
  const accessToken = jwt.sign(payload, secret, {
    expiresIn: expiration,
  });
  return accessToken;
};

module.exports = { generateAccessToken };
