const cookieOptions = {
  // httpOnly: true,
  // secure: true,
  // sameSite: "None",
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  //maxAge: cookiesExpiryDate,
  path: "/",
};
module.exports = cookieOptions;
