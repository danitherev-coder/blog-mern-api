

const allowList = ["http://192.168.1.37:5173/", "http://localhost:5173/", "http://localhost:5173", "http://localhost:8800/", "http://192.168.1.37:5174/", "http://localhost:5174/"]

const corsOptionsDelegate = (req, callback) => {
    let corsOptions
    if (allowList.indexOf(req.header("Origin") !== -1)) {
        corsOptions = { origin: true, credentials: true, optionsSuccessStatus: 200, methods: ["GET", "POST", "PUT", "DELETE"] }
    } else {
        corsOptions = { origin: false }
    }
    callback(null, corsOptions)

}

module.exports = {
    corsOptionsDelegate
};
