// middleware to validate token (rutas protegidas)
const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }

        // Si el token es válido, guardamos los datos desencriptados en req.user
        req.user = decoded;
        next();
    });
};

export {verifyToken};