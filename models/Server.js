const express = require('express')
const { config } = require('dotenv')
config()
const authRoutes = require('../routes/authRoutes')
const postRoutes = require('../routes/postsRoutes')
const userRoutes = require('../routes/usersRoutes')
const uploadRoutes = require('../routes/uploadRoutes')
const cors = require('cors')
const dbConnection = require('../config/db')
const maxRequestSize = "50mb"
const compression = require('compression')
const { corsOptionsDelegate } = require('../helpers/cors')
const brotli = require('brotli');
const zlib = require('zlib');

class Server {
    constructor() {
        this.app = express()
        this.port = process.env.PORT || 8080
        this.paths = {
            auth: '/api/auth',
            posts: '/api/posts',
            users: '/api/users',
            upload: '/api/upload'
        }
        this.conexion()
        this.middlewares()
        this.routes()
    }
    async conexion() {
        await dbConnection()
    }

    middlewares() {
        this.app.use(compression({
            filter: function (req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false
                }

                // fallback to standard filter function
                return compression.filter(req, res)
            },
            brotli: {
                // set to true to use brotli compression.  Note that brotli is
                // only accepted over https
                // enabled: true,
                // zlib options for brotli compression
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
                },
            },
            // zlib options for compression
            level: zlib.constants.Z_BEST_COMPRESSION,
        }));
        this.app.use(cors(corsOptionsDelegate))
        this.app.use(express.urlencoded({ limit: maxRequestSize, extended: true }));
        this.app.use(express.json({ limit: maxRequestSize }));
    }
    routes() {
        this.app.use(this.paths.auth, authRoutes)
        this.app.use(this.paths.posts, postRoutes)
        this.app.use(this.paths.users, userRoutes)
        this.app.use(this.paths.upload, uploadRoutes)
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        })
    }
}

module.exports = Server