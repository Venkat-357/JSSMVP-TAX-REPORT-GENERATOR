export function setAuthStatus(req, res, next) {
    // Tagging the request and response with the user's login status
    res.locals.isLoggedIn = req.session.loggedin || false;
    if (res.locals.isLoggedIn && req.session.admin) {
        res.locals.isAdmin = req.session.admin;
    } else {
        res.locals.isAdmin = false;
    }
    if (res.locals.isLoggedIn && req.session.division_user) {
        res.locals.division_id = req.session.user_details.division_id;
    }
    next();
}
