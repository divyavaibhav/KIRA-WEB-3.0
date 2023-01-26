function isAuthorized(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

function isNotAuthorized(req, res, next) {
    if (req.user) {
        res.redirect("/");
    } else {
        next();
    }
}

module.exports = {
    isAuthorized,
    isNotAuthorized,
};
